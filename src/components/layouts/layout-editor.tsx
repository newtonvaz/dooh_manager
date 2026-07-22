"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WithTooltip } from "@/components/ui/tooltip"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { AreaFormDialog } from "./area-form-dialog"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  Monitor,
  FileImage,
  AppWindow,
  AlertTriangle,
  Move,
  Maximize2,
} from "lucide-react"
import type { LayoutArea } from "@/types/layout"

interface DragInfo {
  areaId: string
  startX: number
  startY: number
  startMouseX: number
  startMouseY: number
}

interface ResizeInfo {
  areaId: string
  edge: string
  startX: number
  startY: number
  startW: number
  startH: number
  startMouseX: number
  startMouseY: number
}

const AREA_COLORS = {
  content: { bg: "bg-blue-500/10", border: "border-blue-400/40", badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  app: { bg: "bg-emerald-500/10", border: "border-emerald-400/40", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  inactive: { bg: "bg-gray-500/5", border: "border-gray-300/30", badge: "bg-gray-500/15 text-gray-500" },
}

export function LayoutEditor() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<LayoutArea | undefined>(undefined)
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null)
  const [canvasScale, setCanvasScale] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)

  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null)
  const [resizeInfo, setResizeInfo] = useState<ResizeInfo | null>(null)

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ["layout-areas"],
    queryFn: () => api.getLayoutAreas("default"),
  })

  const sortedAreas = [...areas].sort((a, b) => a.zIndex - b.zIndex)

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (dragInfo) {
        const dx = (e.clientX - dragInfo.startMouseX) / canvasScale
        const dy = (e.clientY - dragInfo.startMouseY) / canvasScale
        const newX = Math.max(0, Math.min(100 - 1, dragInfo.startX + dx))
        const newY = Math.max(0, Math.min(100 - 1, dragInfo.startY + dy))
        setAreasOptimistic(dragInfo.areaId, { x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 })
      }
      if (resizeInfo) {
        const dx = (e.clientX - resizeInfo.startMouseX) / canvasScale
        const dy = (e.clientY - resizeInfo.startMouseY) / canvasScale
        let newX = resizeInfo.startX
        let newY = resizeInfo.startY
        let newW = resizeInfo.startW
        let newH = resizeInfo.startH

        if (resizeInfo.edge.includes("e")) newW = Math.max(5, resizeInfo.startW + dx)
        if (resizeInfo.edge.includes("w")) {
          newW = Math.max(5, resizeInfo.startW - dx)
          newX = resizeInfo.startX + (resizeInfo.startW - newW)
        }
        if (resizeInfo.edge.includes("s")) newH = Math.max(5, resizeInfo.startH + dy)
        if (resizeInfo.edge.includes("n")) {
          newH = Math.max(5, resizeInfo.startH - dy)
          newY = resizeInfo.startY + (resizeInfo.startH - newH)
        }

        newX = Math.max(0, Math.min(100 - newW, newX))
        newY = Math.max(0, Math.min(100 - newH, newY))

        setAreasOptimistic(resizeInfo.areaId, {
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(Math.min(100 - newX, newW) * 10) / 10,
          height: Math.round(Math.min(100 - newY, newH) * 10) / 10,
        })
      }
    }

    function handleMouseUp() {
      if (dragInfo) {
        saveAreaPosition(dragInfo.areaId)
        setDragInfo(null)
      }
      if (resizeInfo) {
        saveAreaPosition(resizeInfo.areaId)
        setResizeInfo(null)
      }
    }

    if (dragInfo || resizeInfo) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [dragInfo, resizeInfo, canvasScale])

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
    setEditingArea(areas.find((a) => a.id === areaId))
    setFormOpen(true)
  }

  function handleCanvasClick() {
    setSelectedAreaId(null)
  }

  function handleCreateArea() {
    setEditingArea(undefined)
    setFormOpen(true)
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

  function handleDragStart(e: React.MouseEvent, area: LayoutArea) {
    e.stopPropagation()
    e.preventDefault()
    setSelectedAreaId(area.id)
    setDragInfo({
      areaId: area.id,
      startX: area.x,
      startY: area.y,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    })
  }

  function handleResizeStart(e: React.MouseEvent, area: LayoutArea, edge: string) {
    e.stopPropagation()
    e.preventDefault()
    setSelectedAreaId(area.id)
    setResizeInfo({
      areaId: area.id,
      edge,
      startX: area.x,
      startY: area.y,
      startW: area.width,
      startH: area.height,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    })
  }

  function getTypeLabel(type: string): string {
    return type === "content" ? "Conteúdo" : "App"
  }

  function getTypeIcon(type: string) {
    return type === "content" ? FileImage : AppWindow
  }

  function getConfigSummary(area: LayoutArea): string {
    if (area.type === "content") {
      return area.config.playlistId ? `Playlist: ${area.config.playlistId.slice(0, 8)}...` : "Sem playlist"
    }
    return area.config.appId ? `App: ${area.config.appId}` : "Sem app"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Carregando áreas...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WithTooltip content="Criar nova área">
            <Button onClick={handleCreateArea} size="sm">
              <Plus className="mr-1.5 size-4" />
              Criar Área
            </Button>
          </WithTooltip>
          <span className="text-sm text-muted-foreground">
            {areas.length} área{areas.length !== 1 ? "s" : ""}
          </span>
        </div>
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
        className="relative w-full overflow-hidden rounded-xl border bg-card shadow-sm"
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
            const colors = area.enabled ? AREA_COLORS[area.type] : AREA_COLORS.inactive
            const TypeIcon = getTypeIcon(area.type)

            return (
              <div
                key={area.id}
                className={`absolute rounded-lg border-2 transition-shadow ${
                  isSelected ? "ring-2 ring-primary/50 shadow-lg" : ""
                } ${area.enabled ? colors.bg : AREA_COLORS.inactive.bg} ${
                  area.enabled ? colors.border : AREA_COLORS.inactive.border
                } ${!area.enabled ? "opacity-60" : ""}`}
                style={{
                  left: `${area.x}%`,
                  top: `${area.y}%`,
                  width: `${area.width}%`,
                  height: `${area.height}%`,
                  zIndex: area.zIndex,
                  cursor: dragInfo?.areaId === area.id ? "grabbing" : "grab",
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedAreaId(area.id)
                }}
              >
                <div
                  className="absolute inset-0"
                  onMouseDown={(e) => handleDragStart(e, area)}
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

                {isSelected && (
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 pointer-events-auto z-10">
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

                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between pointer-events-none">
                  <span className="text-[9px] text-muted-foreground truncate max-w-[60%]">
                    {area.width}% × {area.height}%
                  </span>
                  <span className="text-[9px] text-muted-foreground truncate max-w-[40%] text-right">
                    [{area.x}%, {area.y}%]
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

                {isSelected && (
                  <>
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-primary bg-background cursor-n-resize z-20"
                      onMouseDown={(e) => handleResizeStart(e, area, "n")}
                    />
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full border-2 border-primary bg-background cursor-s-resize z-20"
                      onMouseDown={(e) => handleResizeStart(e, area, "s")}
                    />
                    <div
                      className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-primary bg-background cursor-w-resize z-20"
                      onMouseDown={(e) => handleResizeStart(e, area, "w")}
                    />
                    <div
                      className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-primary bg-background cursor-e-resize z-20"
                      onMouseDown={(e) => handleResizeStart(e, area, "e")}
                    />
                    <div
                      className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-primary bg-background cursor-nw-resize z-20"
                      onMouseDown={(e) => handleResizeStart(e, area, "nw")}
                    />
                    <div
                      className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-primary bg-background cursor-ne-resize z-20"
                      onMouseDown={(e) => handleResizeStart(e, area, "ne")}
                    />
                    <div
                      className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full border-2 border-primary bg-background cursor-sw-resize z-20"
                      onMouseDown={(e) => handleResizeStart(e, area, "sw")}
                    />
                    <div
                      className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full border-2 border-primary bg-background cursor-se-resize z-20"
                      onMouseDown={(e) => handleResizeStart(e, area, "se")}
                    />
                  </>
                )}
              </div>
            )
          })
        )}
      </div>

      <AreaFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v)
          if (!v) setEditingArea(undefined)
        }}
        area={editingArea}
      />
    </div>
  )
}
