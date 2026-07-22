"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WithTooltip } from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
  Trash2,
  Pencil,
  FileImage,
  AppWindow,
  Plus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import type { LayoutArea } from "@/types/layout"

const CANVAS_W = 1920
const CANVAS_H = 1080

function pctToPxX(pct: number) { return Math.round((pct / 100) * CANVAS_W) }
function pctToPxY(pct: number) { return Math.round((pct / 100) * CANVAS_H) }

interface AreaListProps {
  onEdit: (area: LayoutArea) => void
  onCreate: () => void
  layoutId: string
}

export function AreaList({ onEdit, onCreate, layoutId }: AreaListProps) {
  const queryClient = useQueryClient()

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ["layout-areas", layoutId],
    queryFn: () => api.getLayoutAreas(layoutId),
  })

  const sortedAreas = [...areas].sort((a, b) => a.zIndex - b.zIndex)

  async function handleToggleEnabled(area: LayoutArea) {
    try {
      await api.updateLayoutArea(area.id, { enabled: !area.enabled })
      queryClient.invalidateQueries({ queryKey: ["layout-areas", layoutId] })
      toast.success(`Área "${area.name}" ${area.enabled ? "desativada" : "ativada"}`)
    } catch {
      toast.error("Erro ao atualizar área")
    }
  }

  async function handleDelete(areaId: string) {
    if (!confirm("Excluir esta área?")) return
    try {
      await api.deleteLayoutArea(areaId)
      queryClient.invalidateQueries({ queryKey: ["layout-areas", layoutId] })
      toast.success("Área excluída")
    } catch {
      toast.error("Erro ao excluir área")
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-4 text-center">Carregando...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Áreas</h3>
        <WithTooltip content="Criar nova área">
          <Button variant="outline" size="xs" onClick={onCreate}>
            <Plus className="size-3 mr-1" />
            Nova
          </Button>
        </WithTooltip>
      </div>

      {areas.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
          Nenhuma área criada
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedAreas.map((area, idx) => {
            const px = pctToPxX(area.x)
            const py = pctToPxY(area.y)
            const pw = pctToPxX(area.width)
            const ph = pctToPxY(area.height)
            return (
              <div
                key={area.id}
                className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${
                  !area.enabled ? "opacity-50" : ""
                }`}
              >
                <span className="text-[10px] text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {area.type === "content" ? (
                      <FileImage className="size-3.5 text-blue-500 shrink-0" />
                    ) : (
                      <AppWindow className="size-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span className="text-sm truncate">{area.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] py-0 h-4 px-1 ${
                        area.type === "content"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {area.type === "content" ? "Conteúdo" : "App"}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {pw}×{ph} px ({area.width}% × {area.height}%)
                    {' '}· ({px}, {py}) px [{area.x}%, {area.y}%]
                    {area.type === "content" && area.config.playerId && (
                      <span className="ml-1">· Player vinculado</span>
                    )}
                    {area.type === "app" && area.config.appId && (
                      <span className="ml-1">· App: {area.config.appId}</span>
                    )}
                  </div>
                </div>
                <WithTooltip content={area.enabled ? "Desativar" : "Ativar"}>
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleToggleEnabled(area)}
                  >
                    {area.enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                  </button>
                </WithTooltip>
                <WithTooltip content="Editar">
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(area)}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </WithTooltip>
                <WithTooltip content="Excluir">
                  <button
                    type="button"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(area.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </WithTooltip>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
