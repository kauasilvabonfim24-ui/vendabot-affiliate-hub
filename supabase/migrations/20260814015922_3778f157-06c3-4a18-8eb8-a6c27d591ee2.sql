ALTER TABLE public.bot_status ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.bot_status TO authenticated;
GRANT ALL ON public.bot_status TO service_role;
DROP POLICY IF EXISTS "Authenticated users can read bot status" ON public.bot_status;
CREATE POLICY "Authenticated users can read bot status" ON public.bot_status FOR SELECT TO authenticated USING (true);
ALTER TABLE public.bot_status REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_status;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;