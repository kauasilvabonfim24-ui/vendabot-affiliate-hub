import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Permission = "granted" | "denied" | "default";

function withOneSignal<T>(fn: (OneSignal: any) => Promise<T> | T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
    (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        resolve(await fn(OneSignal));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function readNativePermission(): Permission {
  if (typeof window === "undefined" || !("Notification" in window)) return "default";
  return Notification.permission as Permission;
}

// Grava no banco o estado real desse navegador. É o que o send-push usa
// pra decidir se manda push de verdade ou só a notificação dentro do app.
async function salvarInscricao(OneSignal: any) {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;

  // Garante que a inscrição está ligada ao usuário logado (External ID),
  // senão o push sai pro dispositivo errado ou pra ninguém.
  try {
    await OneSignal.login(userId);
  } catch {
    /* já logado */
  }

  const subscribed = !!OneSignal.User?.PushSubscription?.optedIn;
  const onesignalId = OneSignal.User?.PushSubscription?.id ?? null;

  await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      subscribed,
      onesignal_id: onesignalId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

export function usePushPermission() {
  const [permission, setPermission] = useState<Permission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPermission(readNativePermission());

    let unsubscribe: (() => void) | undefined;

    withOneSignal((OneSignal) => {
      const read = () => {
        const granted = !!OneSignal.Notifications?.permission;
        setPermission(granted ? "granted" : readNativePermission());
      };
      read();

      const handler = () => read();
      OneSignal.Notifications.addEventListener("permissionChange", handler);
      unsubscribe = () =>
        OneSignal.Notifications.removeEventListener("permissionChange", handler);
    }).catch(() => {});

    return () => unsubscribe?.();
  }, []);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    try {
      await withOneSignal(async (OneSignal) => {
        if (!OneSignal.Notifications.permission) {
          await OneSignal.Notifications.requestPermission();
        }

        if (!OneSignal.Notifications.permission) {
          setPermission(readNativePermission());
          return;
        }

        // Permissão concedida não basta: é preciso criar/ativar a inscrição
        // push desse dispositivo. Sem isso o usuário fica "autorizado" mas
        // nunca recebe nada.
        if (!OneSignal.User?.PushSubscription?.optedIn) {
          try {
            await OneSignal.User.PushSubscription.optIn();
          } catch {
            /* alguns navegadores já entram opted-in */
          }
        }

        // Espera o ID da inscrição aparecer (é assíncrono após o opt-in).
        for (let i = 0; i < 10 && !OneSignal.User?.PushSubscription?.id; i++) {
          await new Promise((r) => setTimeout(r, 300));
        }

        await salvarInscricao(OneSignal);
        setPermission("granted");
      });
    } catch {
      setPermission(readNativePermission());
    } finally {
      setLoading(false);
    }
  }, []);

  return { permission, loading, requestPermission };
}
