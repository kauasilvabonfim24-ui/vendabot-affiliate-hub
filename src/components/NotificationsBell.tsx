import { useEffect, useRef, useState } from "react";
import { IconBell as Bell } from "@tabler/icons-react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type Notification = {
  id: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

function tempoRelativo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

// Sino de notificações in-app — funciona pra qualquer usuário, independente
// de permissão de push no navegador. Busca o histórico ao montar e escuta
// novas notificações em tempo real via Supabase Realtime. Componente único,
// montado nos 3 modos de layout (desktop, PWA, navegador mobile); cada modo
// decide via CSS se mostra ou esconde, a lógica de dados não se repete.
export function NotificationsBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) return;
      userIdRef.current = userId;

      supabase
        .from("notifications")
        .select("id,title,message,read_at,created_at")
        .order("created_at", { ascending: false })
        .limit(30)
        .then(({ data: rows }) => {
          if (rows) setItems(rows as Notification[]);
        });

      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          (payload) => {
            setItems((prev) => [payload.new as Notification, ...prev].slice(0, 30));
          },
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = items.filter((n) => !n.read_at).length;

  async function marcarTodasComoLidas() {
    const userId = userIdRef.current;
    if (!userId || unreadCount === 0) return;
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) marcarTodasComoLidas();
      }}
    >
      <PopoverTrigger asChild>
        <button
          aria-label="Notificações"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notificações</p>
        </div>
        <ScrollArea className="h-80">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação ainda.</p>
          ) : (
            <div className="flex flex-col">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-border/60 px-4 py-3 last:border-0 ${!n.read_at ? "bg-primary/5" : ""}`}
                >
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{tempoRelativo(n.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
