import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGroups } from "@/hooks/use-vendabot";
import { useAvailableGroups } from "@/hooks/use-available-groups";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos — VendaBot" },
      { name: "description", content: "Cadastre os grupos do WhatsApp que receberão as ofertas." },
      { property: "og:title", content: "Grupos — VendaBot" },
      { property: "og:description", content: "Gerencie os grupos do WhatsApp do seu bot." },
    ],
  }),
  component: GruposPage,
});

function GruposPage() {
  const { data: groups, isLoading } = useGroups();
  const { data: available, isLoading: loadingAvailable } = useAvailableGroups();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [gid, setGid] = useState("");
  const [role, setRole] = useState("member");
  const [saving, setSaving] = useState(false);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("groups").insert({
        name,
        whatsapp_gid: gid,
        role,
        user_id: userData.user!.id,
      });
      if (error) throw error;
      toast.success("Grupo adicionado");
      setName("");
      setGid("");
      setRole("member");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar grupo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Grupo excluído");
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Grupos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grupos do WhatsApp onde as ofertas serão publicadas.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Novo grupo</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="gname">Nome do grupo</Label>
            <Input
              id="gname"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ofertas Top 🔥"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gid">Grupo do WhatsApp</Label>
            {loadingAvailable ? (
              <p className="pt-2 text-sm text-muted-foreground">Carregando grupos...</p>
            ) : (available?.length ?? 0) === 0 ? (
              <p className="pt-2 text-sm text-muted-foreground">
                Nenhum grupo encontrado ainda — conecte o WhatsApp na aba Conexão primeiro
              </p>
            ) : (
              <select
                id="gid"
                required
                value={gid}
                onChange={(e) => {
                  const value = e.target.value;
                  setGid(value);
                  const found = available!.find((g) => g.gid === value);
                  if (found && !name.trim()) setName(found.name);
                }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecione um grupo</option>
                {available!.map((g) => (
                  <option key={g.gid} value={g.gid}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Papel do bot</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="member">Membro</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="submit" disabled={saving || !gid}>
            {saving ? "Salvando..." : "Adicionar grupo"}
          </Button>
        </div>
      </form>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Grupos cadastrados</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (groups?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum grupo cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {groups!.map((g) => (
              <li key={g.id} className="flex items-center gap-4 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Users className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{g.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{g.whatsapp_gid}</p>
                </div>
                <span className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground">
                  {g.role === "admin" ? "Admin" : "Membro"}
                </span>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
