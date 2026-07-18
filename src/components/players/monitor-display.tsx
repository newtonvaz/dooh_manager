"use client"

import type { Player } from "@/types/player"

const statusScreen = {
  online: "fill-emerald-500/10 stroke-emerald-500/25",
  offline: "fill-red-500/10 stroke-red-500/25",
  never: "fill-zinc-500/5 stroke-zinc-500/15",
}

export function MonitorDisplay({ player, size = "md" }: { player: Player; size?: "sm" | "md" | "lg" }) {
  const screen = statusScreen[player.status]
  const svgSize = size === "sm" ? "size-16" : size === "lg" ? "size-32" : "size-24"

  return (
    <div className="flex items-center justify-center p-2">
      <svg
        viewBox="0 0 200 160"
        className={`${svgSize} text-foreground drop-shadow-sm`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="75" y="140" width="50" height="6" rx="3" className="fill-foreground/20" />
        <rect x="92" y="120" width="16" height="20" rx="2" className="fill-foreground/30" />
        <rect
          x="10" y="10" width="180" height="115" rx="12"
          className="fill-foreground/5 stroke-foreground/20"
          strokeWidth="1.5"
        />
        <rect
          x="20" y="20" width="160" height="95" rx="6"
          className={screen}
          strokeWidth="1"
        />
        <rect x="40" y="40" width="100" height="5" rx="2.5" className="fill-foreground/15" />
        <rect x="40" y="52" width="70" height="5" rx="2.5" className="fill-foreground/10" />
        <rect x="40" y="64" width="85" height="5" rx="2.5" className="fill-foreground/10" />
        <rect x="40" y="76" width="55" height="5" rx="2.5" className="fill-foreground/8" />
        <rect
          x="100" y="88" width="60" height="4" rx="2"
          className={player.status === "online" ? "fill-emerald-500/40" : "fill-foreground/10"}
        />
      </svg>
    </div>
  )
}
