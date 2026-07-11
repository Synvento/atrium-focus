-- Atrium Focus App — schema com autenticação
-- Apaga tabelas antigas (se existirem) antes de recriar

drop table if exists projects;
drop table if exists frozen_ideas;

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  tag text default 'geral',
  energy int default 20,
  last_touch_date date,
  stage text not null default 'Ideia',
  lifecycle text not null default 'afos', -- 'afos' | 'generic'
  tasks jsonb not null default '[]',
  task_history jsonb not null default '[]',
  created_at timestamptz default now()
);

create table frozen_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  tag text default 'geral',
  stage text not null default 'Ideia',
  lifecycle text not null default 'afos',
  notes jsonb not null default '[]',
  tasks_backup jsonb not null default '[]',
  history_backup jsonb not null default '[]',
  created_at timestamptz default now()
);

alter table projects enable row level security;
alter table frozen_ideas enable row level security;

-- Cada utilizador só vê e altera os seus próprios dados
create policy "own projects" on projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own frozen_ideas" on frozen_ideas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
