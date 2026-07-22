"use client"

import { useState, useMemo } from "react"
import { usePlayers } from "@/hooks/use-players"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Calendar,
  LayoutGrid,
  List,
  Monitor,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WithTooltip } from "@/components/ui/tooltip"
import { PlayerStatusBadge } from "@/components/players/player-status-badge"

type ViewMode = "list" | "grid"

function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function ActivationReportPage() {
  const { data: players, isLoading } = usePlayers()
  const [dateFrom, setDateFrom] = useState(() => daysAgo(90))
  const [dateTo, setDateTo] = useState(() => todayLocal())
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  const filtered = useMemo(() => {
    if (!players) return []
    const from = new Date(dateFrom + "T00:00:00")
    const to = new Date(dateTo + "T23:59:59")
    return players.filter((p) => {
      const created = new Date(p.createdAt)
      return created >= from && created <= to
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [players, dateFrom, dateTo])

  const chartData = useMemo(() => {
    const days = new Map<string, number>()
    for (const p of filtered) {
      const day = p.createdAt.slice(0, 10)
      days.set(day, (days.get(day) || 0) + 1)
    }
    return Array.from(days.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date + "T12:00:00").toLocaleDateString("pt-BR"),
        players: count,
      }))
  }, [filtered])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ativação de Players</h1>
          <p className="text-sm text-muted-foreground">
            Ativação de players
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border">
            <WithTooltip content="Visualizar como lista">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-3.5" />
                Lista
              </button>
            </WithTooltip>
            <WithTooltip content="Visualizar como grade">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-3.5" />
                Grid
              </button>
            </WithTooltip>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px]">
              <Label htmlFor="dateFrom" className="text-xs mb-1 block">Data início</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="dateFrom" type="date" value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="min-w-[160px]">
              <Label htmlFor="dateTo" className="text-xs mb-1 block">Data fim</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="dateTo" type="date" value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-6 mr-2 animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : (
        <>
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Players criados por dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        stroke="var(--muted-foreground)"
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                        stroke="var(--muted-foreground)"
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontSize: 13,
                        }}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Bar
                        dataKey="players"
                        fill="var(--primary)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Players ativados</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {filtered.length} player{filtered.length !== 1 ? "es" : ""} criados no período
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Monitor className="size-10 mb-3 opacity-50" />
                  <p className="text-sm">Nenhum player encontrado no período</p>
                </div>
              ) : viewMode === "list" ? (
                <div className="overflow-x-auto">
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky top-0 bg-background z-10">Nome</TableHead>
                          <TableHead className="sticky top-0 bg-background z-10">Código</TableHead>
                          <TableHead className="sticky top-0 bg-background z-10">Grupo</TableHead>
                          <TableHead className="sticky top-0 bg-background z-10">Local</TableHead>
                          <TableHead className="sticky top-0 bg-background z-10">Status</TableHead>
                          <TableHead className="sticky top-0 bg-background z-10">Criado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((player) => (
                          <TableRow key={player.id}>
                            <TableCell className="font-medium text-xs">{player.name}</TableCell>
                            <TableCell className="font-mono text-xs">{player.code}</TableCell>
                            <TableCell className="text-xs">{player.group}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{player.location}</TableCell>
                            <TableCell>
                              <PlayerStatusBadge status={player.status} />
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {new Date(player.createdAt).toLocaleDateString("pt-BR")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((player) => (
                    <Card key={player.id} size="sm" className="overflow-hidden">
                      <CardContent className="pt-4">
                        <div className="flex flex-col items-center text-center">
                          <p className="text-sm font-medium">{player.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{player.code}</p>
                          <div className="mt-2">
                            <PlayerStatusBadge status={player.status} />
                          </div>
                          <div className="mt-3 w-full space-y-1 text-xs text-muted-foreground">
                            <p className="flex items-center justify-between">
                              <span>Grupo</span>
                              <span className="font-medium text-foreground">{player.group || "—"}</span>
                            </p>
                            <p className="flex items-center justify-between">
                              <span>Local</span>
                              <span className="font-medium text-foreground">{player.location || "—"}</span>
                            </p>
                            <p className="flex items-center justify-between">
                              <span>Criado em</span>
                              <span className="font-medium text-foreground">
                                {new Date(player.createdAt).toLocaleDateString("pt-BR")}
                              </span>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
