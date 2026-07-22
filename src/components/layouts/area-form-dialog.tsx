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
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { LayoutArea, LayoutAreaType, LayoutAreaConfig } from "@/types/layout"
import type { Player } from "@/types/player"

const CANVAS_W = 1920
const CANVAS_H = 1080

function pxToPctX(px: number) { return Math.round((px / CANVAS_W) * 1000) / 10 }
function pxToPctY(px: number) { return Math.round((px / CANVAS_H) * 1000) / 10 }
function pctToPxX(pct: number) { return Math.round((pct / 100) * CANVAS_W) }
function pctToPxY(pct: number) { return Math.round((pct / 100) * CANVAS_H) }

interface AreaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  area?: LayoutArea
  layoutId: string
}

const APPS_LIST = [
  { id: "noticias", name: "Notícias", description: "Feed de notícias em tempo real", icon: "newspaper" },
  { id: "clima", name: "Clima", description: "Previsão do tempo atualizada", icon: "cloud-sun" },
  { id: "relogio", name: "Relógio", description: "Relógio digital analógico", icon: "clock" },
  { id: "redes-sociais", name: "Redes Sociais", description: "Feed de redes sociais", icon: "share2" },
  { id: "transito", name: "Trânsito", description: "Informações de trânsito ao vivo", icon: "car" },
  { id: "doohos-instance", name: "Instância do Sistema", description: "Outra instância do DOOHOS", icon: "monitor" },
]

export function AreaFormDialog({ open, onOpenChange, area, layoutId }: AreaFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!area

  const [name, setName] = useState("")
  const [type, setType] = useState<LayoutAreaType>("content")

  const [px, setPx] = useState(0)
  const [py, setPy] = useState(0)
  const [pw, setPw] = useState(CANVAS_W)
  const [ph, setPh] = useState(CANVAS_H)

  const [zIndex, setZIndex] = useState(0)
  const [enabled, setEnabled] = useState(true)
  const [config, setConfig] = useState<LayoutAreaConfig>({})
  const [loading, setLoading] = useState(false)

  const pctX = pxToPctX(px)
  const pctY = pxToPctY(py)
  const pctW = pxToPctX(pw)
  const pctH = pxToPctY(ph)

  const { data: players } = useQuery({
    queryKey: ["players"],
    queryFn: api.getPlayers,
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      if (area) {
        setName(area.name)
        setType(area.type)
        setPx(pctToPxX(area.x))
        setPy(pctToPxY(area.y))
        setPw(pctToPxX(area.width))
        setPh(pctToPxY(area.height))
        setZIndex(area.zIndex)
        setEnabled(area.enabled)
        setConfig(area.config || {})
      } else {
        setName("")
        setType("content")
        setPx(0)
        setPy(0)
        setPw(CANVAS_W)
        setPh(CANVAS_H)
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
      const payload: Omit<LayoutArea, "id" | "createdAt" | "updatedAt"> = {
        name: name.trim(),
        type,
        layoutId,
        x: Math.max(0, Math.min(100, pxToPctX(px))),
        y: Math.max(0, Math.min(100, pxToPctY(py))),
        width: Math.max(1, Math.min(100, pxToPctX(pw))),
        height: Math.max(1, Math.min(100, pxToPctY(ph))),
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
      queryClient.invalidateQueries({ queryKey: ["layout-areas", layoutId] })
      onOpenChange(false)
    } catch {
      toast.error("Erro ao salvar área")
    } finally {
      setLoading(false)
    }
  }

  function getPlayerName(playerId?: string): string {
    if (!playerId || !players) return "Nenhum"
    const pl = players.find((p: any) => p.id === playerId)
    return pl?.name || "Player removido"
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

          <Separator />

          <div className="text-xs text-muted-foreground">
            Resolução de referência: {CANVAS_W}×{CANVAS_H} px
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="px">Posição X (px)</Label>
              <Input
                id="px"
                type="number"
                min={0}
                max={CANVAS_W}
                value={px}
                onChange={(e) => setPx(Math.max(0, Number(e.target.value)))}
              />
              <span className="text-[10px] text-muted-foreground">
                {pctX}% do canvas
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="py">Posição Y (px)</Label>
              <Input
                id="py"
                type="number"
                min={0}
                max={CANVAS_H}
                value={py}
                onChange={(e) => setPy(Math.max(0, Number(e.target.value)))}
              />
              <span className="text-[10px] text-muted-foreground">
                {pctY}% do canvas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pw">Largura (px)</Label>
              <Input
                id="pw"
                type="number"
                min={1}
                max={CANVAS_W}
                value={pw}
                onChange={(e) => setPw(Math.max(1, Number(e.target.value)))}
              />
              <span className="text-[10px] text-muted-foreground">
                {pctW}% do canvas
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph">Altura (px)</Label>
              <Input
                id="ph"
                type="number"
                min={1}
                max={CANVAS_H}
                value={ph}
                onChange={(e) => setPh(Math.max(1, Number(e.target.value)))}
              />
              <span className="text-[10px] text-muted-foreground">
                {pctH}% do canvas
              </span>
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
              <Label>Player (playlist que será reproduzida nesta área)</Label>
              <Select
                value={config.playerId || ""}
                onValueChange={(v) => setConfig((prev) => ({ ...prev, playerId: v || undefined }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {config.playerId ? getPlayerName(config.playerId) : "Selecionar player..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum player</SelectItem>
                  {players?.map((pl: any) => (
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
