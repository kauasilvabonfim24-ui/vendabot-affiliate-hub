import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/auth")({
  ssr: false,
  // /auth?teste=1 → fluxo do "Teste grátis" (cadastro com WhatsApp + consentimento)
  validateSearch: (search: Record<string, unknown>): { teste?: boolean } => {
    const t = search["teste"];
    return t === "1" || t === 1 || t === true ? { teste: true } : {};
  },
  head: () => ({
    meta: [
      { title: "Entrar — VendaBot" },
      { name: "description", content: "Acesse seu painel VendaBot de automação de ofertas." },
      { property: "og:title", content: "Entrar — VendaBot" },
      { property: "og:description", content: "Acesse seu painel VendaBot." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { teste } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(teste ? "signup" : "signin");
  const [whatsapp, setWhatsapp] = useState("");
  const [consent, setConsent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/painel", replace: true });
      } else {
        const digitos = whatsapp.replace(/\D/g, "");
        if (teste) {
          if (digitos.length < 10 || digitos.length > 13) {
            throw new Error("Informe um número de WhatsApp válido, com DDD.");
          }
          if (!consent) {
            throw new Error("Aceite o consentimento para iniciar o teste grátis.");
          }
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            // O teste grátis é criado no primeiro acesso logado (ver _authenticated/route.tsx),
            // então o número e o consentimento viajam junto com a conta.
            ...(teste ? { data: { trial_whatsapp: digitos, trial_consent: true } } : {}),
          },
        });
        if (error) throw error;
        // Dispara pro Meta Pixel só quando o cadastro realmente deu certo
        // (não em quem apenas abre a tela ou só faz login).
        (window as any).fbq?.("track", "CompleteRegistration");
        if (data.session) navigate({ to: teste ? "/conexao-telegram" : "/painel", replace: true });
        else toast.success("Conta criada! Confirme seu e-mail para entrar.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Enviamos um link de redefinição para seu e-mail. Verifique a caixa de entrada e o spam.");
      setResetMode(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar o e-mail.");
    } finally {
      setLoading(false);
    }
  }

  if (resetMode) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold">Recuperar senha</h1>
              <p className="text-xs text-muted-foreground">Vamos te enviar um link por e-mail</p>
            </div>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-mail da sua conta</Label>
              <Input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setResetMode(false)}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Voltar para o login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold">{teste ? "Teste grátis" : "VendaBot"}</h1>
            <p className="text-xs text-muted-foreground">
              {teste ? "Teste o VendaBot no Telegram" : "Automação de ofertas no WhatsApp"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label={showPassword ? "Ocultar senha" : "Revelar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {teste && mode === "signup" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Seu WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  inputMode="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(31) 99999-9999"
                />
              </div>
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                  className="mt-0.5"
                />
                <span>
                  Aceito receber novidades, dicas e ofertas do VendaBot por WhatsApp e e-mail. Posso
                  pedir para sair a qualquer momento.
                </span>
              </label>
            </>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Aguarde..."
              : mode === "signin"
                ? "Entrar"
                : teste
                  ? "Começar teste grátis"
                  : "Criar conta"}
          </Button>
        </form>

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => setResetMode(true)}
            className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Esqueci minha senha
          </button>
        )}

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </main>
  );
}
