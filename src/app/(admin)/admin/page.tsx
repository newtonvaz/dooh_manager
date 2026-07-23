"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { Card } from "@/components/ui/card"
import { Monitor, HardDrive, Database, Wifi, WifiOff, AlertTriangle } from "lucide-react"

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: api.getAdminStats,
    refetchInterval: 15000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
        <p className="text-sm text-muted-foreground">Visão geral da plataforma</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Wifi className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Online</span>
          </div>
          <p className="text-2xl font-bold">{stats?.onlinePlayers ?? "—"}</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <WifiOff className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Offline</span>
          </div>
          <p className="text-2xl font-bold">{stats?.offlinePlayers ?? "—"}</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Nunca Conectados</span>
          </div>
          <p className="text-2xl font-bold">{stats?.neverPlayers ?? "—"}</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-600">
            <Monitor className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Total Players</span>
          </div>
          <p className="text-2xl font-bold">{stats?.totalPlayers ?? "—"}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Conteúdos</span>
          <p className="text-xl font-bold">{stats?.totalContent ?? "—"}</p>
        </Card>

        <Card className="p-4 space-y-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Playlists</span>
          <p className="text-xl font-bold">{stats?.totalPlaylists ?? "—"}</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <HardDrive className="size-3" />
            <span className="text-xs uppercase tracking-wider">Armazenamento</span>
          </div>
          <p className="text-xl font-bold">{stats ? `${(stats.storageUsed / 1073741824).toFixed(1)} GB` : "—"}</p>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(stats?.storageUsagePercent ?? 0, 100)}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Database className="size-3" />
            <span className="text-xs uppercase tracking-wider">Atividades</span>
          </div>
          <p className="text-xl font-bold">{stats?.totalActivities ?? "—"}</p>
        </Card>
      </div>
    </div>
  )
}
