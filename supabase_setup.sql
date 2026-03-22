-- Execute no Supabase → SQL Editor → Run

drop table if exists leads;

create table leads (
  id              uuid primary key default gen_random_uuid(),
  session_id      text unique not null,
  nome            text,
  negocio         text,
  plano           text,
  email           text,
  phone           text,
  historico       text,
  ultima_mensagem text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table leads enable row level security;

create policy "insert_leads" on leads for insert with check (true);
create policy "update_leads" on leads for update using (true);
create policy "select_leads" on leads for select using (true);
