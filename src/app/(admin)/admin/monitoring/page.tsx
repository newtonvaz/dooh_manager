"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { Card } from "@/components/ui/card"
import { Loader2, Wifi, WifiOff, AlertTriangle, Monitor, HardDrive, Database, Activity } from "lucide-react"

import { cn } from "@/lib/utils"

export default function MonitoringPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: api.getAdminStats,
    refetchInterval: 10000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const cards = [
    { label: "Players Online", value: stats?.onlinePlayers ?? 0, icon: Wifi, color: "text-emerald-600" },
    { label: "Players Offline", value: stats?.offlinePlayers ?? 0, icon: WifiOff, color: "text-muted-foreground" },
    { label: "Nunca Conectados", value: stats?.neverPlayers ?? 0, icon: AlertTriangle, color: "text-destructive" },
    { label: "Total Players", value: stats?.totalPlayers ?? 0, icon: Monitor, color: "text-blue-600" },
    { label: "Conteúdos", value: stats?.totalContent ?? 0, icon: Database, color: "text-violet-600" },
    { label: "Playlists", value: stats?.totalPlaylists ?? 0, icon: Activity, color: "text-orange-600" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monitoramento</h1>
        <p className="text-sm text-muted-foreground">Acompanhe o status da plataforma em tempo real</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-4 space-y-2">
            <div className={cn("flex items-center gap-2", c.color)}>
              <c.icon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wider">{c.label}</span>
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-medium mb-4">Armazenamento</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Utilizado</span>
            <span className="font-medium">{stats ? `${(stats.storageUsed / 1073741824).toFixed(2)} GB` : "—"}</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(stats?.storageUsagePercent ?? 0, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>{stats?.storageUsagePercent ?? 0}%</span>
            <span>100%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Capacidade Total</span>
            <span className="font-medium">{stats ? `${(stats.storageTotal / 1073741824).toFixed(2)} GB` : "—"}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
