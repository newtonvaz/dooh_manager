"use client"

import { useState, useRef, useCallback, useEffect } from "react"
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

  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const totalSlides = chartData.length

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50
    if (diff > threshold) goNext()
    else if (diff < -threshold) goPrev()
  }, [goNext, goPrev])

  useEffect(() => {
    setCurrentIndex(0)
  }, [players.length])

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
        <div
          className="relative select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {totalSlides > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 z-10 size-8 -translate-y-1/2 rounded-full bg-background/80 shadow-xs backdrop-blur-sm hover:bg-background"
              onClick={goPrev}
              aria-label="Anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}

          <div className="mx-8 overflow-hidden">
            <div
              ref={trackRef}
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {chartData.map((item, i) => (
                <div key={item.name} className="flex min-w-0 shrink-0 basis-full flex-col items-center justify-center py-6">
                  <div className="flex flex-col items-center gap-3">
                    <span
                      className="size-4 shrink-0 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="max-w-full truncate text-center text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{item.value}</span>
                      <span className="text-sm text-muted-foreground">
                        player{item.value !== 1 ? "es" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalSlides > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 z-10 size-8 -translate-y-1/2 rounded-full bg-background/80 shadow-xs backdrop-blur-sm hover:bg-background"
              onClick={goNext}
              aria-label="Próximo"
            >
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>

        {totalSlides > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {chartData.map((_, i) => (
              <button
                key={i}
                className={`size-2 rounded-full transition-colors ${
                  i === currentIndex
                    ? "bg-foreground"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                onClick={() => goTo(i)}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          {chartData.map((item, i) => (
            <div
              key={item.name}
              className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-xs"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="max-w-[120px] truncate text-muted-foreground">{item.name}</span>
              <span className="shrink-0 font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
