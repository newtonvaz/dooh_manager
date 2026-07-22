"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { LayoutArea, LayoutAreaType, LayoutAreaConfig } from "@/types/layout"
import type { Playlist } from "@/types/content"

interface AreaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  area?: LayoutArea
}

const APPS_LIST = [
  { id: "noticias", name: "Notícias", description: "Feed de notícias em tempo real", icon: "newspaper" },
  { id: "clima", name: "Clima", description: "Previsão do tempo atualizada", icon: "cloud-sun" },
  { id: "relogio", name: "Relógio", description: "Relógio digital analógico", icon: "clock" },
  { id: "redes-sociais", name: "Redes Sociais", description: "Feed de redes sociais", icon: "share2" },
  { id: "transito", name: "Trânsito", description: "Informações de trânsito ao vivo", icon: "car" },
  { id: "doohos-instance", name: "Instância do Sistema", description: "Outra instância do DOOHOS", icon: "monitor" },
]

export function AreaFormDialog({ open, onOpenChange, area }: AreaFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!area

  const [name, setName] = useState("")
  const [type, setType] = useState<LayoutAreaType>("content")
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(100)
  const [zIndex, setZIndex] = useState(0)
  const [enabled, setEnabled] = useState(true)
  const [config, setConfig] = useState<LayoutAreaConfig>({})
  const [loading, setLoading] = useState(false)

  const { data: playlists } = useQuery({
    queryKey: ["playlists"],
    queryFn: api.getPlaylists,
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      if (area) {
        setName(area.name)
        setType(area.type)
        setX(area.x)
        setY(area.y)
        setWidth(area.width)
        setHeight(area.height)
        setZIndex(area.zIndex)
        setEnabled(area.enabled)
        setConfig(area.config || {})
      } else {
        setName("")
        setType("content")
        setX(0)
        setY(0)
        setWidth(100)
        setHeight(100)
        setZIndex(0)
        setEnabled(true)
        setConfig({})
      }
    }
  }, [open, area])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Defina um nome para a área")
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        type,
        layoutId: "default",
        x,
        y,
        width: Math.min(100, Math.max(1, width)),
        height: Math.min(100, Math.max(1, height)),
        zIndex,
        enabled,
        config,
      }

      if (isEditing) {
        await api.updateLayoutArea(area.id, payload)
        toast.success("Área atualizada com sucesso!")
      } else {
        await api.createLayoutArea(payload)
        toast.success("Área criada com sucesso!")
      }
      queryClient.invalidateQueries({ queryKey: ["layout-areas"] })
      onOpenChange(false)
    } catch {
      toast.error("Erro ao salvar área")
    } finally {
      setLoading(false)
    }
  }

  function getPlaylistName(playlistId?: string): string {
    if (!playlistId || !playlists) return "Nenhuma"
    const pl = playlists.find((p) => p.id === playlistId)
    return pl?.name || "Playlist removida"
  }

  function getAppName(appId?: string): string {
    if (!appId) return "Nenhum"
    const app = APPS_LIST.find((a) => a.id === appId)
    return app?.name || "App removido"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Área" : "Nova Área"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere as configurações da área do layout"
              : "Defina as propriedades da nova área"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Área</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Área Principal"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo da Área</Label>
              <Select value={type} onValueChange={(v) => {
                if (v === "content" || v === "app") {
                  setType(v)
                  setConfig({})
                }
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content">Conteúdo</SelectItem>
                  <SelectItem value="app">App</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="x">Posição X (%)</Label>
              <Input
                id="x"
                type="number"
                min={0}
                max={100}
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="y">Posição Y (%)</Label>
              <Input
                id="y"
                type="number"
                min={0}
                max={100}
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Largura (%)</Label>
              <Input
                id="width"
                type="number"
                min={1}
                max={100}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altura (%)</Label>
              <Input
                id="height"
                type="number"
                min={1}
                max={100}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zIndex">Ordem / Prioridade</Label>
              <Input
                id="zIndex"
                type="number"
                min={0}
                value={zIndex}
                onChange={(e) => setZIndex(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={enabled}
                  onCheckedChange={(c) => setEnabled(c === true)}
                />
                <span className="text-sm">Área ativa</span>
              </label>
            </div>
          </div>

          {type === "content" && (
            <div className="space-y-2">
              <Label>Playlist</Label>
              <Select
                value={config.playlistId || ""}
                onValueChange={(v) => setConfig((prev) => ({ ...prev, playlistId: v || undefined }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {config.playlistId ? getPlaylistName(config.playlistId) : "Selecionar playlist..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma playlist</SelectItem>
                  {playlists?.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id}>
                      {pl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "app" && (
            <div className="space-y-2">
              <Label>Aplicativo</Label>
              <Select
                value={config.appId || ""}
                onValueChange={(v) => setConfig((prev) => ({ ...prev, appId: v || undefined }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {config.appId ? getAppName(config.appId) : "Selecionar aplicativo..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum aplicativo</SelectItem>
                  {APPS_LIST.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />}
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
