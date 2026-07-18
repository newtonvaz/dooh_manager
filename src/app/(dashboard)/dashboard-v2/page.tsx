"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Monitor,
  Wifi,
  HardDrive,
  Play,
  TrendingUp,
  Image,
  Video,
  Globe,
  Database,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api-client"

const POLL = 600000

const contentColors: Record<string, string> = {
  image: "oklch(0.546 0.245 262.881)",
  video: "oklch(0.627 0.265 303.9)",
  web: "oklch(0.577 0.245 27.325)",
}

const contentIcons: Record<string, typeof Image> = {
  image: Image,
  video: Video,
  web: Globe,
}

function StorageCard({
  used,
  total,
}: {
  used: number
  total: number
}) {
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Armazenamento
        </CardTitle>
        <div className="rounded-lg bg-violet-100 p-2 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
          <Database className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {used}GB
          <span className="text-base font-normal text-muted-foreground">
            /{total}GB
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Armazenamento utilizado</span>
            <span>{percentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PlayerStatusBars({
  online,
  offline,
  never,
}: {
  online: number
  offline: number
  never: number
}) {
  const total = online + offline + never
  const onlinePct = total > 0 ? (online / total) * 100 : 0
  const offlinePct = total > 0 ? (offline / total) * 100 : 0
  const neverPct = total > 0 ? (never / total) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Distribuição dos Players
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${onlinePct}%` }}
          />
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${offlinePct}%` }}
          />
          <div
            className="bg-zinc-300 dark:bg-zinc-600 transition-all"
            style={{ width: `${neverPct}%` }}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{online}</span>
              <span className="text-xs text-muted-foreground">
                {total > 0 ? Math.round(onlinePct) : 0}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{offline}</span>
              <span className="text-xs text-muted-foreground">
                {total > 0 ? Math.round(offlinePct) : 0}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <span className="text-muted-foreground">Nunca acessado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{never}</span>
              <span className="text-xs text-muted-foreground">
                {total > 0 ? Math.round(neverPct) : 0}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ContentTypeChart({
  contents,
}: {
  contents: { type: string; name: string }[]
}) {
  const counts: Record<string, number> = {}
  contents.forEach((c) => {
    counts[c.type] = (counts[c.type] || 0) + 1
  })

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const chartData = Object.entries(counts).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    color: contentColors[type] || "oklch(0.546 0.245 262.881)",
    icon: contentIcons[type] || Image,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Conteúdos por Tipo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%">
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-sm">
                      <span className="font-medium">{d.name}</span>
                      <span className="ml-2 text-muted-foreground">
                        {d.value} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
                      </span>
                    </div>
                  )
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Separator className="my-3" />
        <div className="grid grid-cols-3 gap-2">
          {chartData.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.name} className="text-center">
                <div className="mx-auto mb-1 flex size-8 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="text-lg font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.name}</div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ModernDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: api.getDashboardStats,
    refetchInterval: POLL,
  })

  const { data: activities } = useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: api.getRecentActivities,
    refetchInterval: POLL,
  })

  const { data: contents } = useQuery({
    queryKey: ["content"],
    queryFn: api.getContent,
    refetchInterval: POLL,
  })

  if (statsLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Carregando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard Moderno
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão geral completa da sua rede de mídia indoor
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
          <TrendingUp className="size-3 text-emerald-500" />
          Atualizado em tempo real
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <StatsCard
            title="Total de Players"
            value={stats.totalPlayers}
            icon={Monitor}
            variant="default"
          />
        </div>
        <div className="relative">
          <StatsCard
            title="Players Online"
            value={stats.onlinePlayers}
            icon={Wifi}
            variant="success"
            description={`${stats.offlinePlayers} offline · ${stats.neverPlayers} nunca acessado`}
          />
        </div>
        <div className="relative">
          <StatsCard
            title="Conteúdos"
            value={stats.totalContent}
            icon={HardDrive}
            variant="warning"
          />
        </div>
        <div className="relative">
          <StatsCard
            title="Playlists"
            value={stats.totalPlaylists}
            icon={Play}
            variant="danger"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StorageCard
          used={stats.storageUsed}
          total={stats.storageTotal}
        />
        <PlayerStatusBars
          online={stats.onlinePlayers}
          offline={stats.offlinePlayers}
          never={stats.neverPlayers}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ContentTypeChart contents={contents ?? []} />
        <RecentActivity activities={activities ?? []} />
      </div>
    </div>
  )
}
