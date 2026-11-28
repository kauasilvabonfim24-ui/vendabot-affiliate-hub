DO $$
DECLARE uid uuid; pid text;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = 'kauasilvabonfim24@gmail.com';
  IF uid IS NULL THEN RAISE EXCEPTION 'Conta não encontrada'; END IF;
  SELECT id INTO pid FROM public.plans ORDER BY max_groups DESC NULLS FIRST, price DESC LIMIT 1;
  INSERT INTO public.admin_users(user_id) VALUES (uid) ON CONFLICT DO NOTHING;
  INSERT INTO public.subscriptions(user_id, plan_id, status, current_period_end, terms_accepted_at)
  VALUES (uid, pid, 'active', NULL, now())
  ON CONFLICT (user_id) DO UPDATE SET plan_id = EXCLUDED.plan_id, status = 'active', current_period_end = NULL, updated_at = now();
END $$;