"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import type { Player } from "@/types/player"

interface PointsByLocationChartProps {
  players: Player[]
}

const COLORS = [
  "oklch(0.488 0.243 264.376)",
  "oklch(0.585 0.233 277.117)",
  "oklch(0.621 0.189 309.096)",
  "oklch(0.577 0.245 27.325)",
  "oklch(0.627 0.194 149.214)",
]

export function PointsByLocationChart({ players }: PointsByLocationChartProps) {
  const locationMap = new Map<string, number>()
  players.forEach((p) => {
    const loc = p.location || "Sem local"
    locationMap.set(loc, (locationMap.get(loc) || 0) + 1)
  })

  const chartData = Array.from(locationMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  if (chartData.length === 0) {
    return (
      <Card className="overflow-hidden border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pontos por Local</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <MapPin className="mb-2 size-8 opacity-30" />
            <p className="text-sm">Nenhum player cadastrado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Pontos por Local</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 0, top: 4, bottom: 4 }}
              barCategoryGap="25%"
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <PillsCarousel items={chartData} colors={COLORS} />
      </CardContent>
    </Card>
  )
}

const PILLS_PER_PAGE = 5

function PillsCarousel({
  items,
  colors,
}: {
  items: { name: string; value: number }[]
  colors: string[]
}) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(items.length / PILLS_PER_PAGE))
  const safePage = Math.min(page, totalPages - 1)

  const pages: typeof items[] = []
  for (let i = 0; i < items.length; i += PILLS_PER_PAGE) {
    pages.push(items.slice(i, i + PILLS_PER_PAGE))
  }

  return (
    <div className="mt-2">
      <div className="flex justify-center gap-2 overflow-hidden">
        {pages[safePage]?.map((item, i) => {
          const globalIndex = items.indexOf(item)
          return (
            <div
              key={item.name}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-xs"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: colors[globalIndex % colors.length] }}
              />
              <span className="max-w-[120px] truncate text-muted-foreground">{item.name}</span>
              <span className="shrink-0 font-bold">{item.value}</span>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`size-2 rounded-full transition-colors ${
                i === safePage
                  ? "bg-foreground"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              onClick={() => setPage(i)}
              aria-label={`Página ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
