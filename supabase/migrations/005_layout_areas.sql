-- Layout Areas table for screen division and multi-area support

create table if not exists layout_areas (
  id text primary key,
  name text not null,
  type text not null check (type in ('content', 'app')),
  layout_id text not null default 'default',
  x real not null default 0,
  y real not null default 0,
  width real not null default 100,
  height real not null default 100,
  z_index int not null default 0,
  enabled boolean not null default true,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_layout_areas_layout_id on layout_areas(layout_id);
create index if not exists idx_layout_areas_type on layout_areas(type);
