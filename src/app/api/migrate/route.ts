import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

const MIGRATION_SQL = `-- Programming Groups - Migration
-- Run this SQL in the Supabase Dashboard SQL Editor

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

-- Layout Areas - Migration
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
create index if not exists idx_layout_areas_type on layout_areas(type);`

export async function GET() {
  const missingTables: string[] = []

  try {
    const { error: pgError } = await supabaseAdmin
      .from("programming_groups")
      .select("id", { count: "exact", head: true })
    if (pgError) missingTables.push("programming_groups")
  } catch {
    missingTables.push("programming_groups")
  }

  try {
    const { error: laError } = await supabaseAdmin
      .from("layout_areas")
      .select("id", { count: "exact", head: true })
    if (laError) missingTables.push("layout_areas")
  } catch {
    missingTables.push("layout_areas")
  }

  if (missingTables.length === 0) {
    return NextResponse.json({
      status: "ok",
      message: "Todas as tabelas já existem no banco de dados.",
      tablesExist: true,
    })
  }

  return NextResponse.json({
    status: "pending",
    message: `As tabelas a seguir ainda não existem: ${missingTables.join(", ")}. Execute o SQL abaixo no SQL Editor do Supabase Dashboard.`,
    missingTables,
    sql: MIGRATION_SQL,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  })
}
