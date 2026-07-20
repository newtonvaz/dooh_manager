"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, HardDrive } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import type { Player } from "@/types/player"
import type { Playlist } from "@/types/content"
import type { OperatingSchedule } from "@/types/schedule"
import { useQueryClient } from "@tanstack/react-query"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "Não disponível"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

interface Group {
  id: string
  name: string
}

interface PlayerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player?: Player
}

export function PlayerFormDialog({ open, onOpenChange, player }: PlayerFormDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(player?.name ?? "")
  const [group, setGroup] = useState(player?.group ?? "")
  const [location, setLocation] = useState(player?.location ?? "")
  const [playlistId, setPlaylistId] = useState("")
  const [loading, setLoading] = useState(false)

  const { data: dbGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: api.getGroups,
    enabled: open,
  })

  const { data: playlists = [] } = useQuery({
    queryKey: ["playlists"],
    queryFn: api.getPlaylists,
    enabled: open,
  })

  const isEditing = !!player

  const selectedPlaylistName = useMemo(() => {
    if (!playlistId) return ""
    const found = (playlists as Playlist[]).find((p) => p.id === playlistId)
    return found?.name ?? ""
  }, [playlistId, playlists])

  useEffect(() => {
    if (open) {
      setName(player?.name ?? "")
      setGroup(player?.group ?? "")
      setLocation(player?.location ?? "")
    }
  }, [open, player])

  useEffect(() => {
    if (open && playlists.length > 0) {
      const pid = player?.playlistId
      const exists = pid ? (playlists as Playlist[]).some((p) => p.id === pid) : false
      setPlaylistId(exists && pid ? pid : "")
    }
  }, [open, playlists, player?.playlistId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !group || !location.trim()) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setLoading(true)
    try {
      const playerData = {
        name: name.trim(),
        group,
        location: location.trim(),
        playlistId: playlistId || undefined,
      }

      if (isEditing) {
        const oldGroup = player.group
        await api.updatePlayer(player.id, playerData)

        if (group !== oldGroup) {
          const groupSchedules = await api.getSchedulesByTarget("group", group)
          const groupSchedule = groupSchedules[0]
          if (groupSchedule) {
            const playerSchedules = await api.getSchedulesByTarget("player", player.id)
            const playerSchedule = playerSchedules[0]
            const scheduleData = {
              name: groupSchedule.name,
              type: "player" as const,
              targetId: player.id,
              targetName: player.name,
              timeSlots: groupSchedule.timeSlots,
              enabled: groupSchedule.enabled,
            }
            if (playerSchedule) {
              await api.updateSchedule(playerSchedule.id, scheduleData)
            } else {
              await api.createSchedule(scheduleData)
            }
            toast.success("Programação ajustada para o novo grupo!")
          }
        } else {
          toast.success("Player atualizado com sucesso!")
        }
      } else {
        await api.createPlayer(playerData)
        toast.success("Player criado com sucesso!")
      }
      queryClient.invalidateQueries({ queryKey: ["players"] })
      queryClient.invalidateQueries({ queryKey: ["schedules"] })
      onOpenChange(false)
    } catch {
      toast.error("Erro ao salvar player")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Player" : "Novo Player"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Altere as informações do player" : "Preencha os dados para criar um novo player"}
          </DialogDescription>
        </DialogHeader>

        {isEditing && (
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
              <HardDrive className="size-4" />
              Armazenamento
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total</span>
                <p className="font-mono font-medium">
                  {player.totalStorage ? formatBytes(player.totalStorage) : "Indefinido"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Utilizado</span>
                <p className="font-mono font-medium">
                  {player.storageUsed ? formatBytes(player.storageUsed) : "Indefinido"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Livre</span>
                <p className="font-mono font-medium">
                  {player.storageFree != null ? formatBytes(player.storageFree) : "Indefinido"}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: TV Matriz - Sala 1"
              required
            />
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input id="code" value={player.code} disabled className="text-muted-foreground" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="group">
              Grupo <span className="text-destructive">*</span>
            </Label>
            <Select value={group} onValueChange={(v) => v && setGroup(v)}>
              <SelectTrigger id="group">
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {(dbGroups ?? []).map((g: Group) => (
                  <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              Localização <span className="text-destructive">*</span>
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: São Paulo, SP"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlist">Playlist</Label>
            <Select value={playlistId} onValueChange={(v) => v && setPlaylistId(v === "null" ? "" : v)}>
              <SelectTrigger id="playlist">
                <SelectValue placeholder="Nenhuma">
                  {selectedPlaylistName || undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Nenhuma</SelectItem>
                {(playlists as Playlist[]).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
