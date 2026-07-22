"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { WithTooltip } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, LayoutPanelTop } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { Layout } from "@/types/layout"

interface PlayerLayoutEditorProps {
  playerId: string
  currentLayoutId?: string
}

export function PlayerLayoutEditor({ playerId, currentLayoutId }: PlayerLayoutEditorProps) {
  const queryClient = useQueryClient()
  const [selectedLayoutId, setSelectedLayoutId] = useState("__none__")
  const [saving, setSaving] = useState(false)

  const { data: layouts } = useQuery({
    queryKey: ["layouts"],
    queryFn: api.getLayouts,
  })

  useEffect(() => {
    if (layouts && layouts.length > 0 && currentLayoutId) {
      const exists = layouts.some((l) => l.id === currentLayoutId)
      setSelectedLayoutId(exists ? currentLayoutId : "__none__")
    }
  }, [layouts, currentLayoutId])

  const selectedLayout = layouts?.find((l) => l.id === selectedLayoutId)

  async function handleAssign() {
    setSaving(true)
    try {
      const lid = selectedLayoutId === "__none__" ? null : selectedLayoutId
      await api.updatePlayer(playerId, { layoutId: lid } as any)
      queryClient.invalidateQueries({ queryKey: ["players"] })
      queryClient.invalidateQueries({ queryKey: ["player", playerId] })
      toast.success("Layout atribuído com sucesso!")
    } catch {
      toast.error("Erro ao atribuir layout")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <LayoutPanelTop className="size-4" />
          Layout Vinculado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Select
              value={selectedLayoutId}
              onValueChange={(v) => v && setSelectedLayoutId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um layout">
                  {selectedLayout?.name || undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {(layouts ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <WithTooltip content="Vincular layout ao player">
            <Button onClick={handleAssign} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Vincular
            </Button>
          </WithTooltip>
        </div>

        {selectedLayout && (
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">{selectedLayout.name}</p>
            {selectedLayout.description && (
              <p className="text-xs text-muted-foreground mt-1">{selectedLayout.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {selectedLayout.canvasWidth}×{selectedLayout.canvasHeight}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
