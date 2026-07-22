-- Add layout_id to players table
alter table if exists players
  add column if not exists layout_id text references layouts(id) on delete set null;
