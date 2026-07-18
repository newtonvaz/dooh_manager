"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Image, Video, Globe, HardDrive } from "lucide-react"
import type { MediaContent } from "@/types/content"

interface ContentOverviewChartProps {
  contents: MediaContent[]
}

const typeConfig: Record<string, { label: string; color: string; icon: typeof Image }> = {
  image: { label: "Imagem", color: "oklch(0.546 0.245 262.881)", icon: Image },
  video: { label: "Vídeo", color: "oklch(0.627 0.265 303.9)", icon: Video },
  web: { label: "Web", color: "oklch(0.577 0.245 27.325)", icon: Globe },
}

export function ContentOverviewChart({ contents }: ContentOverviewChartProps) {
  const counts: Record<string, number> = {}
  contents.forEach((c) => {
    counts[c.type] = (counts[c.type] || 0) + 1
  })

  const total = contents.length
  const totalSize = contents.reduce((sum, c) => sum + c.size, 0)

  const chartData = Object.entries(typeConfig).map(([type, config]) => ({
    name: config.label,
    value: counts[type] || 0,
    color: config.color,
    icon: config.icon,
  }))

  return (
    <Card className="overflow-hidden border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Conteúdos por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <HardDrive className="size-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-[11px] text-muted-foreground/70 leading-none">Arquivos</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-lg font-semibold">{totalSize.toFixed(1)}GB</p>
            <p className="text-[11px] text-muted-foreground/70 leading-none">Armazenamento</p>
          </div>
        </div>

        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="30%" margin={{ left: -10 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {chartData.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.name}
                className="rounded-lg bg-muted/30 p-2.5 text-center transition-colors hover:bg-muted/50"
              >
                <Icon className="mx-auto mb-1 size-4 text-muted-foreground" />
                <p className="text-sm font-bold">{item.value}</p>
                <p className="text-[10px] text-muted-foreground/70 leading-none">{item.name}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
