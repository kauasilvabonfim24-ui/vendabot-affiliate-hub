GRANT INSERT, UPDATE ON public.bot_status TO authenticated;

DROP POLICY IF EXISTS "Users can upsert their own bot status" ON public.bot_status;
CREATE POLICY "Users can upsert their own bot status"
  ON public.bot_status
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own bot status" ON public.bot_status;
CREATE POLICY "Users can update their own bot status"
  ON public.bot_status
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can read bot status" ON public.bot_status;
CREATE POLICY "Users can read their own bot status"
  ON public.bot_status
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can read available groups" ON public.whatsapp_groups_available;
CREATE POLICY "Users can read their own available groups"
  ON public.whatsapp_groups_available
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
