-- Atrium Focus App — schema

create table projects (
  id uuid primary key default gen_random_uuid(),
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
  title text not null,
  tag text default 'geral',
  stage text not null default 'Ideia',
  lifecycle text not null default 'afos',
  notes jsonb not null default '[]',
  tasks_backup jsonb not null default '[]',
  history_backup jsonb not null default '[]',
  created_at timestamptz default now()
);

-- RLS: aberto por agora (single-user). Aperta depois se adicionares login.
alter table projects enable row level security;
alter table frozen_ideas enable row level security;

create policy "allow all projects" on projects for all using (true) with check (true);
create policy "allow all frozen_ideas" on frozen_ideas for all using (true) with check (true);
