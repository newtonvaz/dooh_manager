"use client"

import { useQuery } from "@tanstack/react-query"
import { Monitor, Wifi, HardDrive, Play, Activity, AlertTriangle, RefreshCw } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import dynamic from "next/dynamic"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { api } from "@/lib/api-client"

const PlayersStatusChart = dynamic(
  () => import("@/components/dashboard/players-status-chart").then((m) => ({ default: m.PlayersStatusChart })),
  { ssr: false }
)

const ContentOverviewChart = dynamic(
  () => import("@/components/dashboard/content-overview-chart").then((m) => ({ default: m.ContentOverviewChart })),
  { ssr: false }
)

const PointsByLocationChart = dynamic(
  () => import("@/components/dashboard/points-by-location-chart").then((m) => ({ default: m.PointsByLocationChart })),
  { ssr: false }
)

const POLL = 5000

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: api.getDashboardStats,
    refetchInterval: POLL,
  })

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: api.getPlayers,
    refetchInterval: POLL,
  })

  const { data: contents = [] } = useQuery({
    queryKey: ["content"],
    queryFn: api.getContent,
    refetchInterval: POLL,
  })

  const { data: activities = [] } = useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: api.getRecentActivities,
    refetchInterval: POLL,
  })

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Activity className="size-6 animate-pulse" />
          <p className="text-sm">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3 text-destructive">
          <AlertTriangle className="size-8" />
          <p className="text-sm font-medium">Erro ao carregar o dashboard</p>
          <p className="text-xs text-muted-foreground">
            Verifique se as variáveis de ambiente do Supabase estão configuradas no Vercel.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors hover:bg-accent"
          >
            <RefreshCw className="size-3" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground/70">
            Visão geral da sua rede de mídia indoor
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Ao vivo
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Players"
          value={stats.totalPlayers}
          icon={Monitor}
          variant="default"
        />
        <StatsCard
          title="Players Online"
          value={stats.onlinePlayers}
          icon={Wifi}
          variant="success"
          description={`${stats.offlinePlayers} offline · ${stats.neverPlayers} nunca acessado`}
        />
        <StatsCard
          title="Conteúdos"
          value={stats.totalContent}
          icon={HardDrive}
          variant="warning"
        />
        <StatsCard
          title="Playlists"
          value={stats.totalPlaylists}
          icon={Play}
          variant="danger"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PlayersStatusChart
          online={stats.onlinePlayers}
          offline={stats.offlinePlayers}
          never={stats.neverPlayers}
        />
        <ContentOverviewChart contents={contents} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PointsByLocationChart players={players} />
        <RecentActivity activities={activities} />
      </div>
    </div>
  )
}
