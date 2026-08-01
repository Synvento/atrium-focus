-- Migração: separa Incubadora (ideas) do Congelador (frozen_ideas = projetos pausados)
-- Aditiva — não apaga projects nem frozen_ideas existentes.

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text default '',
  summary text not null default '',
  problem text default '',
  differentiator text default '',
  target_audience text default '',
  standby_reason text default '',
  next_step text default '',
  notes text default '',
  source_content text default '',
  promoted_to_project_id uuid references frozen_ideas(id) on delete set null,
  promoted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table ideas enable row level security;

create policy "own ideas" on ideas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mantém updated_at atualizado automaticamente
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists ideas_set_updated_at on ideas;
create trigger ideas_set_updated_at
  before update on ideas
  for each row execute function set_updated_at();
