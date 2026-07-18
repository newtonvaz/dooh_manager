"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wifi, WifiOff, Clock } from "lucide-react"

interface PlayersStatusChartProps {
  online: number
  offline: number
  never: number
}

export function PlayersStatusChart({ online, offline, never }: PlayersStatusChartProps) {
  const total = online + offline + never
  const onlinePct = total > 0 ? Math.round((online / total) * 100) : 0

  const chartData = [
    { name: "Online", value: online, color: "#22c55e", glow: "rgba(34,197,94,0.3)" },
    { name: "Offline", value: offline, color: "#ef4444", glow: "rgba(239,68,68,0.3)" },
    { name: "Nunca acessado", value: never, color: "#71717a", glow: "rgba(113,113,122,0.2)" },
  ]

  return (
    <Card className="overflow-hidden border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Status dos Players</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {chartData.map((item, i) => (
                  <filter key={i} id={`glow-${i}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={115}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    filter={entry.value > 0 ? `url(#glow-${index})` : undefined}
                  />
                ))}
              </Pie>
              <text
                x="50%"
                y="48%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--foreground)"
                fontSize={34}
                fontWeight="bold"
                fontFamily="var(--font-geist-mono, monospace)"
              >
                {onlinePct}%
              </text>
              <text
                x="50%"
                y="62%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--muted-foreground)"
                fontSize={11}
              >
                online
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 p-2.5">
            <div className="relative">
              <div className="size-2.5 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 size-2.5 rounded-full bg-emerald-500 animate-ping opacity-30" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{online}</p>
              <p className="text-[11px] text-muted-foreground/70 leading-none">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-red-500/5 p-2.5">
            <div className="size-2.5 rounded-full bg-red-500" />
            <div>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{offline}</p>
              <p className="text-[11px] text-muted-foreground/70 leading-none">Offline</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-zinc-500/5 p-2.5">
            <div className="size-2.5 rounded-full bg-zinc-400" />
            <div>
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{never}</p>
                <p className="text-[11px] text-muted-foreground/70 leading-none">Nunca acessado</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
