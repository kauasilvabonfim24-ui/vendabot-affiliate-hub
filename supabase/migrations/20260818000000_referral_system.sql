-- =========================================================
-- Sistema "Indique e Ganhe" — dias grátis por indicação paga
-- =========================================================

-- Config editável sem precisar mexer em código (ex: quantos dias por indicação)
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;
DROP POLICY IF EXISTS "qualquer autenticado pode ler config" ON public.app_config;
CREATE POLICY "qualquer autenticado pode ler config"
  ON public.app_config FOR SELECT TO authenticated USING (true);

INSERT INTO public.app_config (key, value) VALUES ('referral_reward_days', '15')
  ON CONFLICT (key) DO NOTHING;

-- Código exclusivo de cada usuário (vendabot.com.br/r/ABC123)
CREATE TABLE IF NOT EXISTS public.referral_codes (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
DROP POLICY IF EXISTS "usuario ve o proprio codigo" ON public.referral_codes;
CREATE POLICY "usuario ve o proprio codigo"
  ON public.referral_codes FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Cliques no link (só contagem, sem dado pessoal)
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referral_clicks_code_idx ON public.referral_clicks (code);
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.referral_clicks TO service_role;
-- sem policy pra anon/authenticated: só a função register_referral_click (abaixo)
-- grava aqui, e só get_referral_stats (abaixo) lê, ambas SECURITY DEFINER

-- Quem se cadastrou vindo de qual indicador (capturado 1x, no primeiro login)
CREATE TABLE IF NOT EXISTS public.referral_signups (
  referred_user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id),
  referral_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referral_signups_referrer_idx ON public.referral_signups (referrer_user_id);
ALTER TABLE public.referral_signups ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.referral_signups TO authenticated;
GRANT ALL ON public.referral_signups TO service_role;
DROP POLICY IF EXISTS "ve os proprios registros de indicacao" ON public.referral_signups;
CREATE POLICY "ve os proprios registros de indicacao"
  ON public.referral_signups FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

-- Recompensas realmente concedidas (1 por indicado, nunca duplica)
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id),
  referred_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  reward_days integer NOT NULL,
  cakto_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referral_rewards_referrer_idx ON public.referral_rewards (referrer_user_id);
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.referral_rewards TO authenticated;
GRANT ALL ON public.referral_rewards TO service_role;
DROP POLICY IF EXISTS "ve as proprias recompensas" ON public.referral_rewards;
CREATE POLICY "ve as proprias recompensas"
  ON public.referral_rewards FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid());

-- =========================================================
-- Funções (todas SECURITY DEFINER — rodam com privilégio próprio,
-- então não precisam de policy de INSERT liberada pro usuário comum)
-- =========================================================

-- Garante (cria se não existir) o código de indicação do usuário logado
CREATE OR REPLACE FUNCTION public.ensure_referral_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  existing text;
  new_code text;
  tries int := 0;
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;

  select code into existing from public.referral_codes where user_id = auth.uid();
  if existing is not null then
    return existing;
  end if;

  loop
    tries := tries + 1;
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into public.referral_codes (user_id, code) values (auth.uid(), new_code);
      return new_code;
    exception when unique_violation then
      if tries > 8 then
        raise exception 'não foi possível gerar código, tente novamente';
      end if;
    end;
  end loop;
end;
$function$;

-- Registra 1 clique num código (chamada pela página pública /r/:code, sem login)
CREATE OR REPLACE FUNCTION public.register_referral_click(p_code text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  INSERT INTO public.referral_clicks (code)
  SELECT upper(p_code)
  WHERE EXISTS (SELECT 1 FROM public.referral_codes WHERE code = upper(p_code));
$function$;

-- Vincula um cadastro novo ao indicador (chamada 1x, no primeiro login do indicado)
CREATE OR REPLACE FUNCTION public.capture_referral(p_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  ref_user uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  if exists (select 1 from public.referral_signups where referred_user_id = auth.uid()) then
    return false; -- já capturado antes, não sobrescreve
  end if;

  select user_id into ref_user from public.referral_codes where code = upper(p_code);

  if ref_user is null or ref_user = auth.uid() then
    return false; -- código inválido ou tentativa de auto-indicação
  end if;

  insert into public.referral_signups (referred_user_id, referrer_user_id, referral_code)
  values (auth.uid(), ref_user, upper(p_code));

  return true;
end;
$function$;

-- Estatísticas do "Indique e Ganhe" pro usuário logado
CREATE OR REPLACE FUNCTION public.get_referral_stats()
 RETURNS TABLE(
   code text,
   clicks bigint,
   signups bigint,
   valid_referrals bigint,
   days_earned bigint,
   reward_days_config integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  my_code text;
  cfg integer;
begin
  select rc.code into my_code from public.referral_codes rc where rc.user_id = auth.uid();
  select coalesce(ac.value::integer, 15) into cfg from public.app_config ac where ac.key = 'referral_reward_days';

  return query
  select
    my_code,
    coalesce((select count(*) from public.referral_clicks c where c.code = my_code), 0),
    coalesce((select count(*) from public.referral_signups s where s.referrer_user_id = auth.uid()), 0),
    coalesce((select count(*) from public.referral_rewards r where r.referrer_user_id = auth.uid()), 0),
    coalesce((select sum(r.reward_days) from public.referral_rewards r where r.referrer_user_id = auth.uid()), 0),
    coalesce(cfg, 15);
end;
$function$;

-- Concede a recompensa (chamada só pelo webhook, com service_role)
CREATE OR REPLACE FUNCTION public.grant_referral_reward(
  p_referred_user_id uuid,
  p_cakto_subscription_id text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_referrer uuid;
  v_referrer_email text;
  v_referred_email text;
  v_reward_days integer;
  v_current_end timestamptz;
begin
  -- já indicado antes? (dedup)
  if exists (select 1 from public.referral_rewards where referred_user_id = p_referred_user_id) then
    return;
  end if;

  select referrer_user_id into v_referrer
  from public.referral_signups
  where referred_user_id = p_referred_user_id;

  if v_referrer is null or v_referrer = p_referred_user_id then
    return; -- sem indicação registrada, ou auto-indicação (defesa extra)
  end if;

  -- indicador precisa já ter sido cliente pagante em algum momento
  if not exists (select 1 from public.subscriptions where user_id = v_referrer) then
    return;
  end if;

  select email into v_referrer_email from auth.users where id = v_referrer;
  select email into v_referred_email from auth.users where id = p_referred_user_id;
  if v_referrer_email is not null and lower(v_referrer_email) = lower(v_referred_email) then
    return; -- mesmo e-mail, indício de fraude
  end if;

  select coalesce(value::integer, 15) into v_reward_days
  from public.app_config where key = 'referral_reward_days';
  v_reward_days := coalesce(v_reward_days, 15);

  select current_period_end into v_current_end
  from public.subscriptions where user_id = v_referrer;

  update public.subscriptions
  set
    current_period_end = greatest(coalesce(v_current_end, now()), now()) + (v_reward_days || ' days')::interval,
    status = 'active',
    updated_at = now()
  where user_id = v_referrer;

  insert into public.referral_rewards (referrer_user_id, referred_user_id, reward_days, cakto_subscription_id)
  values (v_referrer, p_referred_user_id, v_reward_days, p_cakto_subscription_id);
end;
$function$;

GRANT EXECUTE ON FUNCTION public.ensure_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_referral_click(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_referral(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_referral_reward(uuid, text) TO service_role;
