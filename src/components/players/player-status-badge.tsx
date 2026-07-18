"use client"

import { Badge } from "@/components/ui/badge"
import type { PlayerStatus } from "@/types/player"
import { cn } from "@/lib/utils"

const statusConfig: Record<PlayerStatus, { label: string; className: string }> = {
  online: {
    label: "Online",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  offline: {
    label: "Offline",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  never: {
    label: "Nunca acessado",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  },
}

export function PlayerStatusBadge({ status }: { status: PlayerStatus }) {
  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={cn("gap-1.5", config.className)}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "online" && "bg-emerald-600",
          status === "offline" && "bg-red-600",
          status === "never" && "bg-zinc-400"
        )}
      />
      {config.label}
    </Badge>
  )
}
