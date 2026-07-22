"use client"

import { useState, useRef, useCallback } from "react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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

function PillsCarousel({
  items,
  colors,
}: {
  items: { name: string; value: number }[]
  colors: string[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" })
    requestAnimationFrame(() => requestAnimationFrame(updateScrollState))
  }, [updateScrollState])

  const scrollRefCallback = useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node
    if (node) requestAnimationFrame(updateScrollState)
  }, [updateScrollState])

  if (items.length === 0) return null

  return (
    <div className="relative mt-2">
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -left-1.5 top-1/2 z-10 size-6 -translate-y-1/2 rounded-full bg-background/80 shadow-xs backdrop-blur-sm hover:bg-background"
          onClick={() => scroll("left")}
          aria-label="Anterior"
        >
          <ChevronLeft className="size-3.5" />
        </Button>
      )}

      <div
        ref={scrollRefCallback}
        className="flex gap-2 overflow-x-auto scroll-smooth"
        onScroll={updateScrollState}
      >
        {items.map((item, i) => (
          <div
            key={item.name}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-xs"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="max-w-[120px] truncate text-muted-foreground">{item.name}</span>
            <span className="shrink-0 font-bold">{item.value}</span>
          </div>
        ))}
      </div>

      {canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-1.5 top-1/2 z-10 size-6 -translate-y-1/2 rounded-full bg-background/80 shadow-xs backdrop-blur-sm hover:bg-background"
          onClick={() => scroll("right")}
          aria-label="Próximo"
        >
          <ChevronRight className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
