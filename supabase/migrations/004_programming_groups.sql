-- Programming Groups for centralized schedule management
-- Each group bundles players + operating hours, with priority over individual player schedules

create table if not exists programming_groups (
  id text primary key,
  name text not null,
  enabled boolean not null default true,
  time_slots jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists programming_group_players (
  group_id text not null references programming_groups(id) on delete cascade,
  player_id text not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, player_id)
);

create index if not exists idx_programming_group_players_group on programming_group_players(group_id);
create index if not exists idx_programming_group_players_player on programming_group_players(player_id);
