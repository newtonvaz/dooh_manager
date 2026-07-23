"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"

const POLL_INTERVAL = 30000 // 30 segundos

export function usePlayers() {
  return useQuery({
    queryKey: ["players"],
    queryFn: api.getPlayers,
    refetchInterval: POLL_INTERVAL,
  })
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: ["player", id],
    queryFn: () => api.getPlayer(id),
    enabled: !!id,
    refetchInterval: POLL_INTERVAL,
  })
}
