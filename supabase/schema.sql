-- Mộc Finance: each Supabase Auth user owns exactly one JSON finance document.
-- Run this in a dedicated Supabase project (SQL Editor or MCP apply_migration).
create table if not exists public.finance_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  document jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint finance_document_is_object check (jsonb_typeof(document) = 'object'),
  constraint finance_document_size check (pg_column_size(document) < 2097152)
);

create index if not exists finance_states_updated_idx on public.finance_states(updated_at desc);

alter table public.finance_states enable row level security;

revoke all on table public.finance_states from anon;
grant select, insert, update, delete on table public.finance_states to authenticated;

create policy "Read own finance data"
  on public.finance_states for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Create own finance data"
  on public.finance_states for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Update own finance data"
  on public.finance_states for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Delete own finance data"
  on public.finance_states for delete to authenticated
  using ((select auth.uid()) = user_id);
