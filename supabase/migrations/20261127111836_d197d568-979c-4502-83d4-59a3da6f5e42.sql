drop policy if exists "qualquer autenticado pode ler config" on public.app_config;
drop policy if exists "qualquer um pode ver os planos" on public.plans;
create policy "usuarios logados podem ver os planos" on public.plans
  for select to authenticated using ((select auth.uid()) is not null);