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
create index if not exists idx_programming_group_players_player on programming_group_players(player_id);`

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("programming_groups")
      .select("id", { count: "exact", head: true })

    if (!error) {
      return NextResponse.json({
        status: "ok",
        message: "As tabelas já existem no banco de dados.",
        tablesExist: true,
      })
    }
  } catch {}

  return NextResponse.json({
    status: "pending",
    message:
      "As tabelas de programação ainda não existem. Execute o SQL abaixo no SQL Editor do Supabase Dashboard.",
    sql: MIGRATION_SQL,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  })
}
