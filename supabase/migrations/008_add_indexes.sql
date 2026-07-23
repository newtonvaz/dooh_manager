-- Performance: index para markOfflinePlayers() que filtra por last_seen
CREATE INDEX IF NOT EXISTS idx_players_last_seen ON players (last_seen);

-- Performance: index para deleteSchedulesByGroup() e updateProgrammingGroup()
CREATE INDEX IF NOT EXISTS idx_schedules_replicated_from_group ON schedules (replicated_from_group);

-- Performance: index composto para programming_group_players (group_id, player_id)
CREATE INDEX IF NOT EXISTS idx_programming_group_players_group_player ON programming_group_players (group_id, player_id);
