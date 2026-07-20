"use client"

import { useState, useMemo, useEffect, useCallback, Fragment } from "react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DragStart,
  type DragUpdate,
} from "@hello-pangea/dnd"
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
  Loader2,
  Plus,
  Trash2,
  FileImage,
  Video,
  Globe,
  AppWindow,
  Clock,
  Layers,
  ListVideo,
  GripVertical,
  LayoutList,
  Grid3X3,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ContentPickerDialog } from "./content-picker-dialog"
import { SubplaylistPickerDialog } from "./subplaylist-picker-dialog"
import type { Playlist, PlaylistItem, MediaContent } from "@/types/content"

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

interface PlaylistFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist?: Playlist
}

export function PlaylistFormDialog({ open, onOpenChange, playlist }: PlaylistFormDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [items, setItems] = useState<PlaylistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [contentPickerOpen, setContentPickerOpen] = useState(false)
  const [contentPickerFilter, setContentPickerFilter] = useState<"image" | "video" | "web" | undefined>(undefined)
  const [subplaylistPickerOpen, setSubplaylistPickerOpen] = useState(false)
  const [isSubplaylist, setIsSubplaylist] = useState(false)
  const [view, setView] = useState<"list" | "grid">("list")
  const [dragState, setDragState] = useState<{ source: number; destination: number | null } | null>(null)

  const isEditing = !!playlist

  useEffect(() => {
    if (open) {
      setName(playlist?.name ?? "")
      setCategory(playlist?.category ?? "")
      setDescription(playlist?.description ?? "")
      setItems(playlist?.items ?? [])
      setIsSubplaylist(playlist?.isSubplaylist ?? false)
    }
  }, [open, playlist])

  const { data: allContent } = useQuery({
    queryKey: ["content"],
    queryFn: api.getContent,
    enabled: open,
  })

  const { data: allPlaylists } = useQuery({
    queryKey: ["playlists"],
    queryFn: api.getPlaylists,
    enabled: open,
  })

  const itemContentMap = useMemo(
    () => new Map(allContent?.map((c) => [c.id, c]) ?? []),
    [allContent]
  )

  const playlistMap = useMemo(
    () => new Map(allPlaylists?.map((p) => [p.id, p]) ?? []),
    [allPlaylists]
  )

  // Apenas subplaylists podem ser inseridas como item (playlists raiz não)
  const availablePlaylists = useMemo(
    () => (allPlaylists ?? []).filter(
      (p) => p.isSubplaylist && p.id !== playlist?.id
    ),
    [allPlaylists, playlist?.id]
  )

  const availableContent = useMemo(
    () => allContent ?? [],
    [allContent]
  )

  const totalDuration = useMemo(
    () => items.reduce((sum, item) => sum + item.duration, 0),
    [items]
  )

  function handleAddContent(contentIds: string[]) {
    if (!allContent) return
    setItems((prev) => [
      ...prev,
      ...contentIds.flatMap((id) => {
        const content = allContent.find((c) => c.id === id)
        if (!content) return []
        const dur = defaultDuration(content)
        return { type: "content" as const, contentId: id, duration: dur }
      }),
    ])
  }

  function handleAddSubplaylist(playlistId: string, count = 1) {
    const pl = allPlaylists?.find((p) => p.id === playlistId)
    if (!pl) return
    const dur = pl.totalDuration || 30
    setItems((prev) => [
      ...prev,
      ...Array.from({ length: count }, () => ({
        type: "playlist" as const,
        playlistId,
        duration: dur,
      })),
    ])
  }

  const handleDragStart = useCallback((start: DragStart) => {
    setDragState({ source: start.source.index, destination: null })
  }, [])

  const handleDragUpdate = useCallback((update: DragUpdate) => {
    if (update.destination) {
      setDragState((prev) =>
        prev ? { ...prev, destination: update.destination!.index } : null
      )
    }
  }, [])

  const handleDragEnd = useCallback((result: DropResult) => {
    setDragState(null)
    if (!result.destination) return
    if (result.destination.index === result.source.index) return
    setItems((prev) => {
      const updated = Array.from(prev)
      const [removed] = updated.splice(result.source.index, 1)
      updated.splice(result.destination!.index, 0, removed)
      return updated
    })
  }, [])

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleDurationChange(index: number, duration: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, duration: Math.max(1, duration) } : item
      )
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !category.trim()) {
      toast.error("Preencha o nome e a categoria")
      return
    }
    if (items.length === 0) {
      toast.error("Adicione pelo menos um item")
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        items,
        isSubplaylist,
      }
      if (isEditing) {
        await api.updatePlaylist(playlist.id, payload)
        toast.success("Playlist atualizada com sucesso!")
      } else {
        await api.createPlaylist(payload)
        toast.success("Playlist criada com sucesso!")
      }
      queryClient.invalidateQueries({ queryKey: ["playlists"] })
      onOpenChange(false)
    } catch {
      toast.error("Erro ao salvar playlist")
    } finally {
      setLoading(false)
    }
  }

  function handleInsertContent() {
    if (availableContent.length === 0) {
      toast.error(allContent?.length ? "Todos os conteúdos já foram adicionados" : "Nenhum conteúdo disponível")
      return
    }
    setContentPickerFilter(undefined)
    setContentPickerOpen(true)
  }

  function handleInsertApps() {
    const apps = availableContent.filter((c) => c.type === "web")
    if (apps.length === 0) {
      toast.error("Nenhum App disponível")
      return
    }
    setContentPickerFilter("web")
    setContentPickerOpen(true)
  }

  function handleInsertSubplaylist() {
    if (isSubplaylist) {
      toast.error("Subplaylists não podem conter outras subplaylists")
      return
    }
    if (availablePlaylists.length === 0) {
      toast.error(allPlaylists?.length ? "Todas as playlists já foram adicionadas" : "Nenhuma playlist disponível")
      return
    }
    setSubplaylistPickerOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Playlist" : "Nova Playlist"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Altere as informações da playlist" : "Defina o nome, categoria e adicione conteúdos"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-hidden">
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Playlist Matriz"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Institucional"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSubplaylist}
                onChange={(e) => setIsSubplaylist(e.target.checked)}
                className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">Esta é uma subplaylist</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={handleInsertContent}>
              <Plus className="mr-1.5 size-4" />
              Inserir Conteúdos
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleInsertApps}>
              <AppWindow className="mr-1.5 size-4" />
              Inserir Apps
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleInsertSubplaylist} disabled={isSubplaylist}>
              <Layers className="mr-1.5 size-4" />
              Inserir Subplaylist
            </Button>
          </div>

          <div className="flex-1 min-h-0 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Itens da Playlist</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{items.length} item(ns)</span>
                <div className="inline-flex items-center rounded-md border bg-muted/50 p-0.5">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={view === "list"}
                    onClick={() => setView("list")}
                    className={`inline-flex items-center justify-center rounded-sm h-7 w-7 text-sm font-medium transition-all ${
                      view === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <LayoutList className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={view === "grid"}
                    onClick={() => setView("grid")}
                    className={`inline-flex items-center justify-center rounded-sm h-7 w-7 text-sm font-medium transition-all ${
                      view === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Grid3X3 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <DragDropContext onDragStart={handleDragStart} onDragUpdate={handleDragUpdate} onDragEnd={handleDragEnd}>
              <Droppable droppableId="items">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`overflow-y-auto rounded-md border p-3 ${
                      view === "grid" ? "h-[200px] flex flex-wrap gap-2 content-start" : "h-[200px] space-y-2"
                    } ${
                      snapshot.isDraggingOver
                        ? "border-primary/50 bg-primary/[0.03]"
                        : ""
                    }`}
                  >
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8 w-full">
                        Nenhum item adicionado
                      </p>
                    ) : view === "grid" ? (
                      items.map((item, idx) => {
                        const isContent = item.type === "content"
                        const content = isContent ? itemContentMap.get(item.contentId!) : undefined
                        const subPlaylist = !isContent ? playlistMap.get(item.playlistId!) : undefined
                        const name = isContent ? content?.name : subPlaylist?.name
                        if (!name) return null
                        const Icon = isContent ? typeIcons[content?.type ?? "image"] : ListVideo
                        const visualIdx =
                          dragState && idx < dragState.source
                            ? idx
                            : dragState && idx > dragState.source
                              ? idx - 1
                              : -1
                        const isTarget =
                          dragState?.destination != null &&
                          dragState.destination === visualIdx &&
                          visualIdx >= 0

                        return (
                          <Fragment key={`${idx}-${isContent ? item.contentId : item.playlistId}`}>
                            {isTarget && (
                              <div className="w-24 flex flex-col items-center gap-1 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-2 shrink-0">
                                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
                                  <Plus className="size-3.5 text-primary/60" />
                                </div>
                                <span className="text-[9px] font-medium text-primary/60 text-center w-full truncate leading-tight">
                                  Inserir aqui
                                </span>
                              </div>
                            )}
                            <Draggable
                              draggableId={`item-${idx}`}
                              index={idx}
                            >
                              {(provided, snapshot) => {
                                const keepTransform = snapshot.isDragging || snapshot.isDropAnimating
                                return (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    title={name}
                                    style={{
                                      ...provided.draggableProps.style,
                                      transform: keepTransform
                                        ? provided.draggableProps.style?.transform
                                        : undefined,
                                    }}
                                    className={`w-24 flex flex-col items-center gap-1 rounded-lg border p-2 cursor-grab active:cursor-grabbing ${
                                      snapshot.isDragging
                                        ? "shadow-lg border-primary bg-accent"
                                        : "bg-card hover:bg-muted/50"
                                    }`}
                                  >
                                    <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                                      <Icon className="size-3.5 text-muted-foreground" />
                                    </div>
                                    <span className="text-[9px] font-medium text-center w-full truncate leading-tight">
                                      {name}
                                    </span>
                                  </div>
                                )
                              }}
                            </Draggable>
                          </Fragment>
                        )
                      })
                    ) : (
                      items.map((item, idx) => {
                        const isContent = item.type === "content"
                        const content = isContent ? itemContentMap.get(item.contentId!) : undefined
                        const subPlaylist = !isContent ? playlistMap.get(item.playlistId!) : undefined
                        const name = isContent ? content?.name : subPlaylist?.name
                        if (!name) return null
                        const visualIdx =
                          dragState && idx < dragState.source
                            ? idx
                            : dragState && idx > dragState.source
                              ? idx - 1
                              : -1
                        const isTarget =
                          dragState?.destination != null &&
                          dragState.destination === visualIdx &&
                          visualIdx >= 0

                        return (
                          <Fragment key={`${idx}-${isContent ? item.contentId : item.playlistId}`}>
                            {isTarget && (
                              <div className="h-2 w-full bg-primary/10 rounded shrink-0 border-2 border-dashed border-primary/50" />
                            )}
                            <Draggable
                              draggableId={`item-${idx}`}
                              index={idx}
                            >
                              {(provided, snapshot) => {
                                const keepTransform = snapshot.isDragging || snapshot.isDropAnimating
                                return (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      transform: keepTransform
                                        ? provided.draggableProps.style?.transform
                                        : undefined,
                                    }}
                                    className={`flex items-center justify-between rounded-lg border p-2 gap-2 transition-shadow ${
                                      snapshot.isDragging
                                        ? "shadow-lg border-primary bg-accent"
                                        : ""
                                    }`}
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      className="flex items-center gap-1 min-w-0 flex-1 cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="size-3.5 text-muted-foreground/50 shrink-0" />
                                      <div className="rounded-lg bg-muted p-1.5 shrink-0">
                                        {isContent ? (
                                          (() => {
                                            const Icon = typeIcons[content?.type ?? "image"]
                                            return <Icon className="size-4 text-muted-foreground" />
                                          })()
                                        ) : (
                                          <ListVideo className="size-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-sm truncate block">{name}</span>
                                        {!isContent && (
                                          <span className="text-[10px] text-muted-foreground">Subplaylist</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="flex items-center gap-1">
                                        <Clock className="size-3 text-muted-foreground" />
                                        <Input
                                          type="number"
                                          min={1}
                                          value={item.duration}
                                          onChange={(e) =>
                                            handleDurationChange(idx, Number(e.target.value))
                                          }
                                          className="w-16 h-7 text-xs"
                                        />
                                        <span className="text-xs text-muted-foreground">s</span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 text-destructive shrink-0"
                                        onClick={() => handleRemoveItem(idx)}
                                      >
                                        <Trash2 className="size-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              }}
                            </Draggable>
                          </Fragment>
                        )
                      })
                    )}
                    {dragState && dragState.destination != null && dragState.destination === items.length - 1 && (
                      view === "grid" ? (
                        <div className="w-24 flex flex-col items-center gap-1 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-2 shrink-0">
                          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
                            <Plus className="size-3.5 text-primary/60" />
                          </div>
                          <span className="text-[9px] font-medium text-primary/60 text-center w-full truncate leading-tight">
                            Inserir aqui
                          </span>
                        </div>
                      ) : (
                        <div className="h-2 bg-primary/10 rounded shrink-0 w-full border-2 border-dashed border-primary/50" />
                      )
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          <ContentPickerDialog
            open={contentPickerOpen}
            onOpenChange={(v) => {
              setContentPickerOpen(v)
              if (!v) setContentPickerFilter(undefined)
            }}
            availableContent={availableContent}
            onSelect={handleAddContent}
            filterType={contentPickerFilter}
          />

          <SubplaylistPickerDialog
            open={subplaylistPickerOpen}
            onOpenChange={setSubplaylistPickerOpen}
            availablePlaylists={availablePlaylists}
            onSelect={handleAddSubplaylist}
          />

          <div className="rounded-lg border bg-muted/50 p-3 flex items-center justify-between text-sm shrink-0">
            <span className="text-muted-foreground">Duração total</span>
            <span className="font-medium">{formatDuration(totalDuration)}</span>
          </div>

          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
