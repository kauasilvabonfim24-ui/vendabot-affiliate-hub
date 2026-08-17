-- Migration de registro (as tabelas abaixo já existem no banco, criadas
-- pelo dashboard/Lovable sem gerar migration). Esse arquivo só garante
-- que o schema fica versionado no Git. Todo mundo usa IF NOT EXISTS /
-- CREATE OR REPLACE / DROP...IF EXISTS, então é seguro rodar de novo.

-- =========================================================
-- 1) plans — planos disponíveis (Básico, Pro, etc.)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  max_groups integer,
  max_schedules integer,
  cakto_product_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qualquer um pode ver os planos" ON public.plans;
CREATE POLICY "qualquer um pode ver os planos"
  ON public.plans
  FOR SELECT
  USING (true);

-- =========================================================
-- 2) subscriptions — assinatura ativa de cada usuário
-- =========================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  plan_id text NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'pending',
  cakto_subscription_id text,
  terms_accepted_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuario ve so a propria assinatura" ON public.subscriptions;
CREATE POLICY "usuario ve so a propria assinatura"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- =========================================================
-- 3) bot_auth_state — sessão Baileys por usuário (dado sensível;
--    RLS habilitado e SEM policy de propósito: só service_role
--    do bot no Render acessa, ninguém pelo painel)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.bot_auth_state (
  user_id uuid NOT NULL REFERENCES auth.users(id),
  key text NOT NULL,
  data text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

ALTER TABLE public.bot_auth_state ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 4) webhook_debug_log — log bruto de webhooks recebidos (Cakto etc.);
--    também sem policy de propósito, só service_role grava/lê
-- =========================================================
CREATE TABLE IF NOT EXISTS public.webhook_debug_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source text NOT NULL,
  payload jsonb NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_debug_log ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 5) Funções de suporte
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(uid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.subscriptions
    where user_id = uid
      and status = 'active'
      and (current_period_end is null or current_period_end > now())
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(lookup_email text)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select id from auth.users where email = lookup_email limit 1;
$function$;

-- =========================================================
-- 6) Funções de trigger: bloqueiam ação sem assinatura ativa
--    e respeitam o limite (max_groups/max_schedules) do plano
-- =========================================================
CREATE OR REPLACE FUNCTION public.check_subscription_before_connect()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.status = 'requested' and not public.has_active_subscription(new.user_id) then
    raise exception 'Assinatura inativa. Assine um plano para conectar o WhatsApp.';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.check_subscription_before_group()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  limite integer;
  atual integer;
begin
  if not public.has_active_subscription(new.user_id) then
    raise exception 'Assinatura inativa. Assine um plano para cadastrar grupos.';
  end if;

  select p.max_groups into limite
  from public.subscriptions s join public.plans p on p.id = s.plan_id
  where s.user_id = new.user_id;

  if limite is not null then
    select count(*) into atual from public.groups where user_id = new.user_id;
    if atual >= limite then
      raise exception 'Limite de % grupo(s) do seu plano atingido. Faça upgrade para adicionar mais.', limite;
    end if;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.check_subscription_before_schedule()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  limite integer;
  atual integer;
begin
  if not public.has_active_subscription(new.user_id) then
    raise exception 'Assinatura inativa. Assine um plano para criar horários.';
  end if;

  select p.max_schedules into limite
  from public.subscriptions s join public.plans p on p.id = s.plan_id
  where s.user_id = new.user_id;

  if limite is not null then
    select count(*) into atual from public.schedules where user_id = new.user_id;
    if atual >= limite then
      raise exception 'Limite de % horário(s) do seu plano atingido. Faça upgrade para adicionar mais.', limite;
    end if;
  end if;

  return new;
end;
$function$;

-- =========================================================
-- 7) Funções de notificação (push via Edge Function send-push)
--    OBS: o secret está fixo no corpo da função (ver ressalva
--    no resumo enviado no chat) — funciona, mas o ideal é migrar
--    pra Supabase Vault no futuro.
-- =========================================================
CREATE OR REPLACE FUNCTION public.notify_bot_disconnected()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.status = 'disconnected' and old.status is distinct from 'disconnected' and old.status is not null then
    perform net.http_post(
      url := 'https://uyprazfzkzxnmvpzrogs.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'secret', '9WiRMiFpUVwxc3MnyARG5dphbUjnOUNd',
        'user_id', new.user_id,
        'title', '⚠️ WhatsApp desconectado',
        'message', 'Seu VendaBot perdeu a conexão. Abra o app pra reconectar e não perder vendas.'
      )
    );
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.notify_payment_failed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.status = 'past_due' and old.status is distinct from 'past_due' then
    perform net.http_post(
      url := 'https://uyprazfzkzxnmvpzrogs.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'secret', '9WiRMiFpUVwxc3MnyARG5dphbUjnOUNd',
        'user_id', new.user_id,
        'title', '💳 Pagamento recusado',
        'message', 'Não conseguimos confirmar seu pagamento. Atualize seus dados pra continuar usando o VendaBot.'
      )
    );
  end if;
  return new;
end;
$function$;

-- =========================================================
-- 8) Triggers (ligando as funções acima nas tabelas)
-- =========================================================
DROP TRIGGER IF EXISTS trg_check_subscription_connect ON public.bot_status;
CREATE TRIGGER trg_check_subscription_connect
  BEFORE INSERT OR UPDATE ON public.bot_status
  FOR EACH ROW EXECUTE FUNCTION public.check_subscription_before_connect();

DROP TRIGGER IF EXISTS trg_notify_disconnect ON public.bot_status;
CREATE TRIGGER trg_notify_disconnect
  AFTER UPDATE ON public.bot_status
  FOR EACH ROW EXECUTE FUNCTION public.notify_bot_disconnected();

DROP TRIGGER IF EXISTS trg_check_subscription_group ON public.groups;
CREATE TRIGGER trg_check_subscription_group
  BEFORE INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.check_subscription_before_group();

DROP TRIGGER IF EXISTS trg_check_subscription_schedule ON public.schedules;
CREATE TRIGGER trg_check_subscription_schedule
  BEFORE INSERT ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.check_subscription_before_schedule();

DROP TRIGGER IF EXISTS trg_notify_payment_failed ON public.subscriptions;
CREATE TRIGGER trg_notify_payment_failed
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_failed();
