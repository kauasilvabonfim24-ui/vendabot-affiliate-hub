GRANT SELECT ON public.whatsapp_groups_available TO authenticated;
GRANT ALL ON public.whatsapp_groups_available TO service_role;
ALTER TABLE public.whatsapp_groups_available ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read available groups" ON public.whatsapp_groups_available;
CREATE POLICY "Authenticated users can read available groups" ON public.whatsapp_groups_available FOR SELECT TO authenticated USING (true);
ALTER TABLE public.whatsapp_groups_available REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_groups_available;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;