-- Colunas novas no histórico de envios.
-- (O Telegram já tenta gravar "platform"; se a coluna não existia, isso conserta.)
alter table public.message_logs add column if not exists platform text;
alter table public.message_logs add column if not exists product_id text;
alter table public.message_logs add column if not exists product_name text;
alter table public.message_logs add column if not exists product_platform text;

-- Tabela de eventos dos agentes
create table if not exists public.agent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent text not null check (agent in ('cacador','redator','mensageiro')),
  action text not null check (action in ('escolhendo','escrevendo','enviando','concluido','erro')),
  channel text not null default 'whatsapp',
  group_name text,
  product_id text,
  product_name text,
  product_platform text,
  created_at timestamptz not null default now()
);

create index if not exists agent_events_user_created_idx
  on public.agent_events (user_id, created_at desc);

alter table public.agent_events enable row level security;

drop policy if exists "Users read own agent events" on public.agent_events;
create policy "Users read own agent events"
  on public.agent_events for select to authenticated
  using (auth.uid() = user_id);

-- Realtime (pro painel atualizar na hora)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'agent_events'
  ) then
    alter publication supabase_realtime add table public.agent_events;
  end if;
end $$;
