"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WithTooltip } from "@/components/ui/tooltip"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { toast } from "sonner"
import {
  Trash2,
  Pencil,
  Monitor,
  FileImage,
  AppWindow,
} from "lucide-react"
import type { LayoutArea } from "@/types/layout"

const CANVAS_W = 1920
const CANVAS_H = 1080

const MIN_PCT = 3

function pctToPxX(pct: number) { return Math.round((pct / 100) * CANVAS_W) }
function pctToPxY(pct: number) { return Math.round((pct / 100) * CANVAS_H) }

const AREA_COLORS = {
  content: { bg: "bg-blue-500/10", border: "border-blue-400/40", badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  app: { bg: "bg-emerald-500/10", border: "border-emerald-400/40", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  inactive: { bg: "bg-gray-500/5", border: "border-gray-300/30", badge: "bg-gray-500/15 text-gray-500" },
}

interface LayoutEditorProps {
  layoutId: string
}

export function LayoutEditor({ layoutId }: LayoutEditorProps) {
  const queryClient = useQueryClient()
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null)
  const [canvasScale, setCanvasScale] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ["layout-areas", layoutId],
    queryFn: () => api.getLayoutAreas(layoutId),
  })

  const sortedAreas = [...areas].sort((a, b) => a.zIndex - b.zIndex)

  function clamp(v: number, min: number, max: number) {
    return Math.round(Math.min(max, Math.max(min, v)) * 10) / 10
  }

  function round1(v: number) { return Math.round(v * 10) / 10 }

  function setAreasOptimistic(areaId: string, updates: Partial<LayoutArea>) {
    queryClient.setQueryData<LayoutArea[]>(["layout-areas"], (old) =>
      old?.map((a) => (a.id === areaId ? { ...a, ...updates } : a)) ?? []
    )
  }

  function saveAreaPosition(areaId: string) {
    const area = queryClient.getQueryData<LayoutArea[]>(["layout-areas"])?.find((a) => a.id === areaId)
    if (area) {
      api.updateLayoutArea(areaId, {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      }).catch(() => {
        queryClient.invalidateQueries({ queryKey: ["layout-areas"] })
      })
    }
  }

  function handleAreaClick(e: React.MouseEvent, areaId: string) {
    e.stopPropagation()
    setSelectedAreaId(areaId)
  }

  function handleCanvasClick() {
    setSelectedAreaId(null)
  }

  async function handleDeleteArea(areaId: string) {
    if (!confirm("Excluir esta área?")) return
    try {
      await api.deleteLayoutArea(areaId)
      queryClient.invalidateQueries({ queryKey: ["layout-areas"] })
      toast.success("Área excluída")
    } catch {
      toast.error("Erro ao excluir área")
    }
  }

  function handlePointerDown(e: React.PointerEvent, area: LayoutArea) {
    e.stopPropagation()
    e.preventDefault()
    setSelectedAreaId(area.id)
    setDraggingId(area.id)
    const el = canvasRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()

    const startMouseX = e.clientX
    const startMouseY = e.clientY
    const startAreaX = area.x
    const startAreaY = area.y
    const areaId = area.id

    function onMove(ev: PointerEvent) {
      ev.preventDefault()
      const dxPct = (ev.clientX - startMouseX) / rect.width * 100
      const dyPct = (ev.clientY - startMouseY) / rect.height * 100
      const newX = clamp(startAreaX + dxPct, 0, 100 - MIN_PCT)
      const newY = clamp(startAreaY + dyPct, 0, 100 - MIN_PCT)
      setAreasOptimistic(areaId, { x: newX, y: newY })
    }

    function onUp() {
      setDraggingId(null)
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
      saveAreaPosition(areaId)
    }

    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }

  function handleResizePointerDown(e: React.PointerEvent, area: LayoutArea, edge: string) {
    e.stopPropagation()
    e.preventDefault()
    setSelectedAreaId(area.id)

    const el = canvasRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()

    const startX = e.clientX
    const startY = e.clientY
    const startAreaX = area.x
    const startAreaY = area.y
    const startAreaW = area.width
    const startAreaH = area.height
    const areaId = area.id

    function onMove(ev: PointerEvent) {
      ev.preventDefault()
      const dxPct = (ev.clientX - startX) / rect.width * 100
      const dyPct = (ev.clientY - startY) / rect.height * 100

      let newX = startAreaX
      let newY = startAreaY
      let newW = startAreaW
      let newH = startAreaH

      if (edge.includes("e")) newW = Math.max(MIN_PCT, startAreaW + dxPct)
      if (edge.includes("w")) {
        newW = Math.max(MIN_PCT, startAreaW - dxPct)
        newX = startAreaX + (startAreaW - newW)
      }
      if (edge.includes("s")) newH = Math.max(MIN_PCT, startAreaH + dyPct)
      if (edge.includes("n")) {
        newH = Math.max(MIN_PCT, startAreaH - dyPct)
        newY = startAreaY + (startAreaH - newH)
      }

      newX = clamp(newX, 0, 100 - newW)
      newY = clamp(newY, 0, 100 - newH)

      setAreasOptimistic(areaId, {
        x: newX,
        y: newY,
        width: round1(Math.min(100 - newX, newW)),
        height: round1(Math.min(100 - newY, newH)),
      })
    }

    function onUp() {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
      saveAreaPosition(areaId)
    }

    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }

  function getTypeLabel(type: string): string {
    return type === "content" ? "Conteúdo" : "App"
  }

  function getTypeIcon(type: string) {
    return type === "content" ? FileImage : AppWindow
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Carregando áreas...
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {areas.length} área{areas.length !== 1 ? "s" : ""} · Resolução {CANVAS_W}x{CANVAS_H}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setCanvasScale((s) => Math.max(0.3, s - 0.1))}
          >
            -
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(canvasScale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setCanvasScale((s) => Math.min(1.5, s + 0.1))}
          >
            +
          </Button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="relative w-full overflow-hidden rounded-xl border bg-card shadow-sm touch-none"
        style={{
          aspectRatio: "16/9",
          transform: `scale(${canvasScale})`,
          transformOrigin: "top left",
        }}
        onClick={handleCanvasClick}
      >
        {areas.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Monitor className="size-12 opacity-30" />
            <p className="text-sm">Nenhuma área configurada</p>
            <p className="text-xs">Clique em &quot;Criar Área&quot; para adicionar</p>
          </div>
        ) : (
          sortedAreas.map((area) => {
            const isSelected = selectedAreaId === area.id
            const isDragging = draggingId === area.id
            const colors = area.enabled ? AREA_COLORS[area.type] : AREA_COLORS.inactive
            const TypeIcon = getTypeIcon(area.type)

            const px = pctToPxX(area.x)
            const py = pctToPxY(area.y)
            const pw = pctToPxX(area.width)
            const ph = pctToPxY(area.height)

            return (
              <div
                key={area.id}
                className={`absolute rounded-lg border-2 ${
                  isDragging
                    ? "shadow-2xl ring-2 ring-primary z-50"
                    : isSelected
                      ? "ring-2 ring-primary/50 shadow-lg"
                      : ""
                } ${area.enabled ? colors.bg : AREA_COLORS.inactive.bg} ${
                  area.enabled ? colors.border : AREA_COLORS.inactive.border
                } ${!area.enabled ? "opacity-60" : ""}`}
                style={{
                  left: `${area.x}%`,
                  top: `${area.y}%`,
                  width: `${area.width}%`,
                  height: `${area.height}%`,
                  zIndex: isDragging ? 9999 : area.zIndex,
                  cursor: isDragging ? "grabbing" : "grab",
                  touchAction: "none",
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedAreaId(area.id)
                }}
              >
                <div
                  className="absolute inset-0"
                  onPointerDown={(e) => handlePointerDown(e, area)}
                />

                <div className="absolute top-1 left-1 right-1 flex items-center gap-1 pointer-events-none">
                  <div className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${area.enabled ? colors.badge : "bg-gray-500/15 text-gray-500"}`}>
                    <TypeIcon className="size-3" />
                    <span className="truncate max-w-[80px]">{area.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[8px] py-0 h-4 px-1">
                    {getTypeLabel(area.type)}
                  </Badge>
                  {!area.enabled && (
                    <Badge variant="outline" className="text-[8px] py-0 h-4 px-1 text-muted-foreground">
                      Inativa
                    </Badge>
                  )}
                </div>

                {isSelected && !isDragging && (
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 z-10">
                    <WithTooltip content="Editar área">
                      <button
                        type="button"
                        className="flex size-5 items-center justify-center rounded bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground"
                        onClick={(e) => handleAreaClick(e, area.id)}
                      >
                        <Pencil className="size-3" />
                      </button>
                    </WithTooltip>
                    <WithTooltip content="Excluir área">
                      <button
                        type="button"
                        className="flex size-5 items-center justify-center rounded bg-background/80 hover:bg-background text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteArea(area.id)
                        }}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </WithTooltip>
                  </div>
                )}

                <div className="absolute bottom-1 left-1 right-1 flex flex-col gap-0.5 pointer-events-none">
                  <span className="text-[9px] text-muted-foreground truncate">
                    {pw}×{ph} px ({area.width}% × {area.height}%)
                  </span>
                  <span className="text-[9px] text-muted-foreground truncate">
                    ({px}, {py}) px — [{area.x}%, {area.y}%]
                  </span>
                </div>

                {area.type === "app" && area.config.appId && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col items-center gap-1 opacity-30">
                      <AppWindow className="size-8" />
                      <span className="text-[10px] font-medium">{area.config.appId}</span>
                    </div>
                  </div>
                )}

                {isSelected && !isDragging && (
                  <>
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-primary bg-background cursor-n-resize z-20"
                      onPointerDown={(e) => handleResizePointerDown(e, area, "n")}
                    />
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full border-2 border-primary bg-background cursor-s-resize z-20"
                      onPointerDown={(e) => handleResizePointerDown(e, area, "s")}
                    />
                    <div
                      className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-primary bg-background cursor-w-resize z-20"
                      onPointerDown={(e) => handleResizePointerDown(e, area, "w")}
                    />
                    <div
                      className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-primary bg-background cursor-e-resize z-20"
                      onPointerDown={(e) => handleResizePointerDown(e, area, "e")}
                    />
                    <div
                      className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-primary bg-background cursor-nw-resize z-20"
                      onPointerDown={(e) => handleResizePointerDown(e, area, "nw")}
                    />
                    <div
                      className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-primary bg-background cursor-ne-resize z-20"
                      onPointerDown={(e) => handleResizePointerDown(e, area, "ne")}
                    />
                    <div
                      className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full border-2 border-primary bg-background cursor-sw-resize z-20"
                      onPointerDown={(e) => handleResizePointerDown(e, area, "sw")}
                    />
                    <div
                      className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full border-2 border-primary bg-background cursor-se-resize z-20"
                      onPointerDown={(e) => handleResizePointerDown(e, area, "se")}
                    />
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
