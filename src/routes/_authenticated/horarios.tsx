import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGroups, useSchedules } from "@/hooks/use-vendabot";
import { repeatLabel } from "@/lib/vendabot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/horarios")({
  head: () => ({
    meta: [
      { title: "Horários — VendaBot" },
      { name: "description", content: "Programe os horários de disparo automático das ofertas." },
      { property: "og:title", content: "Horários — VendaBot" },
      { property: "og:description", content: "Programe os disparos automáticos do seu bot." },
    ],
  }),
  component: HorariosPage,
});

function HorariosPage() {
  const { data: schedules, isLoading } = useSchedules();
  const { data: groups } = useGroups();
  const queryClient = useQueryClient();
  const [time, setTime] = useState("09:00");
  const [repeat, setRepeat] = useState("daily");
  const [category, setCategory] = useState("");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  function toggleGroup(id: string) {
    setGroupIds((ids) => (ids.includes(id) ? ids.filter((g) => g !== id) : [...ids, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (groupIds.length === 0) {
      toast.error("Selecione pelo menos um grupo");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("schedules").insert({
        time,
        repeat,
        group_ids: groupIds,
        category: category || null,
        user_id: userData.user!.id,
      });
      if (error) throw error;
      toast.success("Horário adicionado");
      setCategory("");
      setGroupIds([]);
      setSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar horário");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Horário excluído");
    queryClient.invalidateQueries({ queryKey: ["schedules"] });
  }

  const groupName = (id: string) => groups?.find((g) => g.id === id)?.name ?? "Grupo removido";

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-5 pwa:space-y-4!">
      <div className="grid gap-4 pwa:gap-3! md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="time-hour">Horário</Label>
          <div className="flex items-center gap-2">
            <select
              id="time-hour"
              aria-label="Hora"
              value={time.split(":")[0] ?? "09"}
              onChange={(e) => setTime(`${e.target.value}:${time.split(":")[1] ?? "00"}`)}
              className="h-9 pwa:h-12! flex-1 rounded-md border border-input bg-background px-2 text-center text-sm"
            >
              {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground">:</span>
            <select
              aria-label="Minuto"
              value={time.split(":")[1] ?? "00"}
              onChange={(e) => setTime(`${time.split(":")[0] ?? "09"}:${e.target.value}`)}
              className="h-9 pwa:h-12! flex-1 rounded-md border border-input bg-background px-2 text-center text-sm"
            >
              {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="repeat">Repetição</Label>
          <select
            id="repeat"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            className="h-9 pwa:h-12! w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="daily">Todos os dias</option>
            <option value="weekdays">Dias úteis</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat">Categoria (opcional)</Label>
          <Input
            id="cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Deixe vazio para a IA decidir"
          />
        </div>
      </div>

      <div>
        <Label>Grupos que recebem</Label>
        {(groups?.length ?? 0) === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum grupo cadastrado.{" "}
            <Link to="/grupos" className="text-primary hover:underline">
              Cadastrar grupo
            </Link>
          </p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {groups!.map((g) => (
              <label
                key={g.id}
                className="flex min-h-11 pwa:min-h-12! min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm"
              >
                <Checkbox
                  checked={groupIds.includes(g.id)}
                  onCheckedChange={() => toggleGroup(g.id)}
                  className="shrink-0 pwa:h-5! pwa:w-5!"
                />
                <span className="min-w-0 flex-1 truncate">{g.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={saving} className="w-full pwa:h-12!">
        {saving ? "Salvando..." : "Adicionar horário"}
      </Button>
    </form>
  );

  return (
    <div className="space-y-8 pwa:space-y-4!">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl pwa:text-xl! font-bold">Horários</h1>
          <p className="mt-1 text-sm text-muted-foreground pwa:hidden">
            Defina quando o bot deve enviar as ofertas.
          </p>
        </div>
        <Button
          onClick={() => setSheetOpen(true)}
          size="sm"
          className="hidden pwa:flex items-center gap-1.5 rounded-full"
        >
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </header>

      <form onSubmit={handleSubmit} className="pwa:hidden rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Novo horário</h2>
        {formContent}
      </form>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="hidden pwa:block max-h-[85vh] overflow-y-auto rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+16px)]"
        >
          <SheetHeader className="mb-3">
            <SheetTitle className="text-left">Novo horário</SheetTitle>
          </SheetHeader>
          {formContent}
        </SheetContent>
      </Sheet>

      <section className="rounded-xl border border-border bg-card p-6 pwa:border-none! pwa:bg-transparent! pwa:p-0!">
        <h2 className="mb-4 text-lg font-semibold pwa:hidden">Horários cadastrados</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (schedules?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum horário cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-border pwa:space-y-2! pwa:divide-y-0!">
            {schedules!.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4 pwa:rounded-xl! pwa:border! pwa:border-border! pwa:bg-card! pwa:p-3! pwa:py-3!"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold">
                      {s.time}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        · {repeatLabel(s.repeat)}
                      </span>
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {(s.group_ids ?? []).map(groupName).join(", ") || "Sem grupos"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                  <span className="rounded-full bg-ai/15 px-2 py-1 text-xs whitespace-nowrap text-ai">
                    {s.category ?? "IA decide"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(s.id)}
                    className="pwa:h-11! pwa:w-11!"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
