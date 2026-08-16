import { useEffect, useState } from "react";

export function usePushPermission() {
  const [permission, setPermission] = useState<"granted" | "denied" | "default">("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
    (window as any).OneSignalDeferred.push((OneSignal: any) => {
      const read = () => {
        setPermission(OneSignal.Notifications.permission ? "granted" : "default");
      };
      read();

      const handler = () => read();
      OneSignal.Notifications.addEventListener("permissionChange", handler);
      unsubscribe = () => OneSignal.Notifications.removeEventListener("permissionChange", handler);
    });

    return () => unsubscribe?.();
  }, []);

  async function requestPermission() {
    setLoading(true);
    try {
      await new Promise<void>((resolve) => {
        (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
        (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
          await OneSignal.Notifications.requestPermission();
          resolve();
        });
      });
    } finally {
      setLoading(false);
    }
  }

  return { permission, loading, requestPermission };
}
