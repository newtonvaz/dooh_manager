-- DOOH Database Schema for Supabase

-- 1. Players
create table if not exists players (
  id text primary key,
  name text not null default '',
  code text unique not null,
  status text not null default 'never' check (status in ('online', 'offline', 'never')),
  "group" text not null default '',
  location text not null default '',
  last_seen timestamptz not null default '1970-01-01T00:00:00Z',
  storage_used bigint not null default 0,
  total_storage bigint not null default 34359738368,
  storage_free bigint not null default 34359738368,
  version text not null default '2.1.0',
  ip text not null default '0.0.0.0',
  electron_version text not null default '',
  public_ip text not null default '',
  playlist_id text references playlists(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_players_code on players(code);
create index if not exists idx_players_status on players(status);

-- 2. Content
create table if not exists content (
  id text primary key,
  name text not null,
  type text not null check (type in ('image', 'video', 'web')),
  url text not null,
  thumbnail_url text,
  size real not null default 0,
  duration int,
  category text not null default '',
  tags jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists idx_content_name on content(name);
create index if not exists idx_content_category on content(category);

-- 3. Playlists
create table if not exists playlists (
  id text primary key,
  name text not null,
  category text not null default '',
  description text not null default '',
  items jsonb not null default '[]',
  total_duration int not null default 0,
  "order" int not null default 0,
  is_subplaylist boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_playlists_order on playlists("order");

-- 4. Playback Logs (relatorio)
create table if not exists playback_logs (
  id text primary key,
  content_id text not null,
  content_name text not null,
  content_duration int not null default 0,
  player_id text not null,
  player_name text not null default '',
  playlist_id text not null default '',
  playlist_name text not null default '',
  start_time timestamptz not null,
  end_time timestamptz not null,
  date date not null
);

create index if not exists idx_playback_logs_date on playback_logs(date);
create index if not exists idx_playback_logs_content_id on playback_logs(content_id);
create index if not exists idx_playback_logs_player_id on playback_logs(player_id);
create index if not exists idx_playback_logs_date_content on playback_logs(date, content_id);

-- 5. Schedules
create table if not exists schedules (
  id text primary key,
  name text not null,
  type text not null check (type in ('player', 'group')),
  target_id text not null,
  target_name text not null default '',
  time_slots jsonb not null default '[]',
  enabled boolean not null default true,
  replicated_from_group text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_schedules_target on schedules(type, target_id);

-- 6. Groups
create table if not exists groups (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

-- 7. Categories
create table if not exists categories (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

-- 8. Activities
create table if not exists activities (
  id text primary key,
  type text not null default '',
  description text not null default '',
  player_name text not null default '',
  player_code text not null default '',
  "user" text not null default 'Sistema',
  timestamp timestamptz not null default now()
);

create index if not exists idx_activities_timestamp on activities(timestamp desc);

-- 9. Storage bucket for uploads
-- Run in Supabase Dashboard SQL Editor:
-- insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true);
