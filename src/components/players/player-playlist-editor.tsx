"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Loader2, Play, Plus, Trash2, FileImage, Video, Globe, Clock } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { Playlist, MediaContent, PlaylistItem } from "@/types/content"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const typeIcons = { image: FileImage, video: Video, web: Globe }

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function defaultDuration(content: MediaContent): number {
  if (content.duration) return content.duration
  if (content.type === "image") return 10
  if (content.type === "web") return 15
  return 30
}

interface PlayerPlaylistEditorProps {
  playerId: string
  currentPlaylistId?: string
}

export function PlayerPlaylistEditor({ playerId, currentPlaylistId }: PlayerPlaylistEditorProps) {
  const queryClient = useQueryClient()
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("__none__")
  const [saving, setSaving] = useState(false)
  const [editPlaylistOpen, setEditPlaylistOpen] = useState(false)
  const [addContentOpen, setAddContentOpen] = useState(false)
  const [newItemDuration, setNewItemDuration] = useState(10)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)

  const { data: playlists } = useQuery({
    queryKey: ["playlists"],
    queryFn: api.getPlaylists,
  })

  useEffect(() => {
    if (playlists && playlists.length > 0 && currentPlaylistId) {
      const exists = playlists.some((p) => p.id === currentPlaylistId)
      setSelectedPlaylistId(exists ? currentPlaylistId : "__none__")
    }
  }, [playlists, currentPlaylistId])

  const { data: currentPlaylist } = useQuery({
    queryKey: ["playlist", currentPlaylistId],
    queryFn: () => api.getPlaylist(currentPlaylistId!),
    enabled: !!currentPlaylistId,
  })

  const selectedPlaylistName = useMemo(() => {
    if (!selectedPlaylistId || selectedPlaylistId === "__none__") return ""
    const found = (playlists ?? []).find((p) => p.id === selectedPlaylistId)
    return found?.name ?? ""
  }, [selectedPlaylistId, playlists])

  const { data: allContent } = useQuery({
    queryKey: ["content"],
    queryFn: api.getContent,
  })

  async function handleAssign() {
    setSaving(true)
    try {
      const pid = selectedPlaylistId === "__none__" ? null : selectedPlaylistId
      await api.assignPlaylist(playerId, pid)
      queryClient.invalidateQueries({ queryKey: ["players"] })
      queryClient.invalidateQueries({ queryKey: ["player", playerId] })
      toast.success("Playlist atribuída com sucesso!")
    } catch {
      toast.error("Erro ao atribuir playlist")
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveFromPlaylist(contentId: string) {
    if (!currentPlaylistId) return
    try {
      await api.removeContentFromPlaylist(currentPlaylistId, contentId)
      queryClient.invalidateQueries({ queryKey: ["playlist", currentPlaylistId] })
      queryClient.invalidateQueries({ queryKey: ["playlists"] })
      toast.success("Conteúdo removido da playlist")
    } catch {
      toast.error("Erro ao remover conteúdo")
    }
  }

  async function handleAddContent() {
    if (!currentPlaylistId || !selectedContentId) return
    try {
      await api.addContentToPlaylist(currentPlaylistId, selectedContentId, newItemDuration)
      queryClient.invalidateQueries({ queryKey: ["playlist", currentPlaylistId] })
      queryClient.invalidateQueries({ queryKey: ["playlists"] })
      setSelectedContentId(null)
      setNewItemDuration(10)
      setAddContentOpen(false)
      toast.success("Conteúdo adicionado à playlist")
    } catch {
      toast.error("Erro ao adicionar conteúdo")
    }
  }

  const contentItemIds = currentPlaylist?.items.filter((i) => i.type === "content").map((i) => i.contentId!) ?? []
  const availableContent = allContent?.filter((c) => !contentItemIds.includes(c.id)) ?? []

  const selectedContent = useMemo(() => {
    if (!selectedContentId) return null
    return allContent?.find((c) => c.id === selectedContentId) ?? null
  }, [selectedContentId, allContent])

  const itemContentMap = new Map(allContent?.map((c) => [c.id, c]) ?? [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Play className="size-4" />
            Playlist Vinculada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Select
                value={selectedPlaylistId}
                onValueChange={(v) => v && setSelectedPlaylistId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma playlist">
                    {selectedPlaylistName || undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {playlists?.filter((pl) => !pl.isSubplaylist).map((pl) => (
                    <SelectItem key={pl.id} value={pl.id}>
                      {pl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssign} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Vincular
            </Button>
          </div>

          {currentPlaylist && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{currentPlaylist.name}</p>
                  <p className="text-xs text-muted-foreground">{currentPlaylist.description}</p>
                </div>
                <Badge variant="secondary">{currentPlaylist.items.length} itens</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setEditPlaylistOpen(true)}
              >
                Editar Playlist
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editPlaylistOpen} onOpenChange={setEditPlaylistOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Playlist: {currentPlaylist?.name}</DialogTitle>
            <DialogDescription>
              Gerencie os conteúdos desta playlist
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Conteúdos na Playlist</h4>
              <Button size="sm" onClick={() => {
                setNewItemDuration(10)
                setSelectedContentId(null)
                setAddContentOpen(true)
              }}>
                <Plus className="mr-1 size-3" />
                Adicionar
              </Button>
            </div>

            {currentPlaylist && currentPlaylist.items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum conteúdo nesta playlist
              </p>
            ) : (
              <div className="space-y-2">
                {currentPlaylist?.items.map((item) => {
                  if (item.type !== "content") return null
                  const content = itemContentMap.get(item.contentId!)
                  if (!content) return null
                  const Icon = typeIcons[content.type]
                  return (
                    <div
                      key={item.contentId}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{content.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {content.type === "image" ? "Imagem" : content.type === "video" ? "Vídeo" : "Web"} • {content.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDuration(item.duration)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => handleRemoveFromPlaylist(item.contentId!)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {currentPlaylist && currentPlaylist.items.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm flex items-center justify-between">
                <span className="text-muted-foreground">Duração total</span>
                <span className="font-medium">{formatDuration(currentPlaylist.totalDuration)}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setEditPlaylistOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addContentOpen} onOpenChange={setAddContentOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Conteúdo</DialogTitle>
            <DialogDescription>
              Selecione o conteúdo e defina a duração de exibição
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {availableContent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Todos os conteúdos já estão na playlist
              </p>
            ) : (
              <>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableContent.map((content) => {
                    const Icon = typeIcons[content.type]
                    return (
                      <button
                        key={content.id}
                        type="button"
                        onClick={() => {
                          setSelectedContentId(content.id)
                          setNewItemDuration(defaultDuration(content))
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted transition-colors ${
                          selectedContentId === content.id ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <div className="rounded-lg bg-muted p-2">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{content.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {content.category} • {content.size > 0 ? `${content.size}MB` : "-"}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">
                    Duração (segundos)
                    {selectedContent?.type === "video" && (
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        (detectada do vídeo)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min={selectedContent?.type === "image" ? 10 : 1}
                    value={newItemDuration}
                    onChange={(e) => setNewItemDuration(Math.max(selectedContent?.type === "image" ? 10 : 1, Number(e.target.value)))}
                  />
                  {selectedContent?.type === "image" && (
                    <p className="text-xs text-muted-foreground">Mínimo de 10 segundos para imagens</p>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddContentOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddContent} disabled={!selectedContentId}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
