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
  Calendar,
  Layers,
  ListVideo,
  GripVertical,
  LayoutList,
  Grid3X3,
  Link2,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ContentPickerDialog } from "./content-picker-dialog"
import { ContentScheduleDialog } from "./content-schedule-dialog"
import { SubplaylistPickerDialog } from "./subplaylist-picker-dialog"
import type { Playlist, PlaylistItem, MediaContent, ContentTimeSlot } from "@/types/content"

const typeIcons = { image: FileImage, video: Video, web: Globe }

function isExpired(item: PlaylistItem): boolean {
  if (!item.timeSlots || item.timeSlots.length === 0) return false
  const now = new Date()
  return item.timeSlots.every((s) => new Date(s.endDate) < now)
}

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
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [pendingContentIds, setPendingContentIds] = useState<string[]>([])
  const [editingScheduleIndex, setEditingScheduleIndex] = useState<number | null>(null)
  const [subplaylistPickerOpen, setSubplaylistPickerOpen] = useState(false)
  const [isSubplaylist, setIsSubplaylist] = useState(false)
  const [view, setView] = useState<"list" | "grid">("list")
  const [dragState, setDragState] = useState<{ source: number; destination: number | null } | null>(null)
  const [urlDialogOpen, setUrlDialogOpen] = useState(false)
  const [urlValue, setUrlValue] = useState("")
  const [urlDuration, setUrlDuration] = useState(10)
  const [urlEditIndex, setUrlEditIndex] = useState<number | null>(null)

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

  function handleAddContent(contentIds: string[], timeSlots?: ContentTimeSlot[]) {
    if (!allContent) return
    const slots = timeSlots && timeSlots.length > 0 ? timeSlots : undefined
    setItems((prev) => [
      ...prev,
      ...contentIds.flatMap((id) => {
        const content = allContent.find((c) => c.id === id)
        if (!content) return []
        const dur = defaultDuration(content)
        return { type: "content" as const, contentId: id, duration: dur, timeSlots: slots }
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

  function handleContentPickerSelect(contentIds: string[]) {
    setPendingContentIds(contentIds)
    setEditingScheduleIndex(null)
    setContentPickerOpen(false)
    setScheduleDialogOpen(true)
  }

  function handleScheduleConfirm(timeSlots: ContentTimeSlot[]) {
    if (editingScheduleIndex != null) {
      setItems((prev) =>
        prev.map((item, i) =>
          i === editingScheduleIndex
            ? { ...item, timeSlots: timeSlots.length > 0 ? timeSlots : undefined }
            : item
        )
      )
      setEditingScheduleIndex(null)
    } else {
      handleAddContent(pendingContentIds, timeSlots)
      setPendingContentIds([])
    }
  }

  function handleEditSchedule(index: number) {
    setEditingScheduleIndex(index)
    setScheduleDialogOpen(true)
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

  function handleInsertUrl() {
    setUrlValue("")
    setUrlDuration(10)
    setUrlEditIndex(null)
    setUrlDialogOpen(true)
  }

  function handleUrlSave() {
    if (!urlValue.trim()) {
      toast.error("Informe a URL")
      return
    }
    if (urlEditIndex != null) {
      setItems((prev) =>
        prev.map((item, i) =>
          i === urlEditIndex
            ? { ...item, url: urlValue.trim(), duration: urlDuration, name: urlValue.trim() }
            : item
        )
      )
    } else {
      setItems((prev) => [
        ...prev,
        { type: "url" as const, url: urlValue.trim(), duration: urlDuration, name: urlValue.trim() },
      ])
    }
    setUrlDialogOpen(false)
    setUrlValue("")
    setUrlDuration(10)
    setUrlEditIndex(null)
  }

  function handleEditUrl(index: number) {
    const item = items[index]
    setUrlValue(item.url ?? "")
    setUrlDuration(item.duration)
    setUrlEditIndex(index)
    setUrlDialogOpen(true)
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
            <Button type="button" variant="outline" size="sm" onClick={handleInsertUrl}>
              <Link2 className="mr-1.5 size-4" />
              Inserir URL
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
              <Droppable droppableId="items" direction={view === "grid" ? "horizontal" : "vertical"}>
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
                        const isUrl = item.type === "url"
                        const content = isContent ? itemContentMap.get(item.contentId!) : undefined
                        const subPlaylist = !isContent && !isUrl ? playlistMap.get(item.playlistId!) : undefined
                        const name = isContent ? content?.name : isUrl ? (item.name || item.url) : subPlaylist?.name
                        if (!name) return null
                        const Icon = isContent ? typeIcons[content?.type ?? "image"] : isUrl ? Globe : ListVideo
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
                              <div className="w-[5px] self-stretch bg-primary/10 shrink-0 border-l-2 border-dashed border-primary/50" />
                            )}
                            <Draggable
                              draggableId={`item-${idx}`}
                              index={idx}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  title={name}
                                  style={provided.draggableProps.style}
                                  className={`w-24 flex flex-col items-center gap-1 rounded-lg border p-2 cursor-grab active:cursor-grabbing transition-transform duration-150 ${
                                    snapshot.isDragging
                                      ? "shadow-xl border-primary bg-accent opacity-75 scale-[1.02] z-50"
                                      : isExpired(item)
                                        ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                                        : "bg-card hover:bg-muted/50"
                                  }`}
                                >
                                  <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                                    <Icon className="size-3.5 text-muted-foreground" />
                                  </div>
                                  <span className="text-[9px] font-medium text-center w-full truncate leading-tight">
                                    {name}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {isContent && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditSchedule(idx)
                                        }}
                                        className={`flex items-center gap-0.5 ${item.timeSlots && item.timeSlots.length > 0 ? "text-primary" : "text-muted-foreground"}`}
                                        title="Agendar exibição"
                                      >
                                        <Calendar className="size-2.5" />
                                        {item.timeSlots && item.timeSlots.length > 0 && (
                                          <span className="text-[8px]">{item.timeSlots.length}</span>
                                        )}
                                      </button>
                                    )}
                                    {isUrl && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditUrl(idx)
                                        }}
                                        className="flex items-center text-muted-foreground hover:text-foreground"
                                        title="Editar URL"
                                      >
                                        <Pencil className="size-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          </Fragment>
                        )
                      })
                    ) : (
                      items.map((item, idx) => {
                        const isContent = item.type === "content"
                        const isUrl = item.type === "url"
                        const content = isContent ? itemContentMap.get(item.contentId!) : undefined
                        const subPlaylist = !isContent && !isUrl ? playlistMap.get(item.playlistId!) : undefined
                        const name = isContent ? content?.name : isUrl ? (item.name || item.url) : subPlaylist?.name
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
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  style={provided.draggableProps.style}
                                  className={`flex items-center justify-between rounded-lg border p-2 gap-2 transition-transform duration-150 ${
                                    snapshot.isDragging
                                      ? "shadow-xl border-primary bg-accent opacity-75 scale-[1.02] z-50"
                                      : isExpired(item)
                                        ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
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
                                      ) : isUrl ? (
                                        <Globe className="size-4 text-muted-foreground" />
                                      ) : (
                                        <ListVideo className="size-4 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-sm truncate block">{name}</span>
                                      <span className="flex items-center gap-1">
                                        {isUrl && (
                                          <span className="text-[10px] text-muted-foreground">URL</span>
                                        )}
                                        {!isContent && !isUrl && (
                                          <span className="text-[10px] text-muted-foreground">Subplaylist</span>
                                        )}
                                        {item.timeSlots && item.timeSlots.length > 0 && (
                                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                            <Calendar className="size-2.5" />
                                            {item.timeSlots.length} período{item.timeSlots.length > 1 ? "s" : ""}
                                          </span>
                                        )}
                                      </span>
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
                                      {isContent && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className={`size-7 shrink-0 ${item.timeSlots && item.timeSlots.length > 0 ? "text-primary" : "text-muted-foreground"}`}
                                          onClick={() => handleEditSchedule(idx)}
                                          title="Agendar exibição"
                                        >
                                          <Calendar className="size-3" />
                                        </Button>
                                      )}
                                      {isUrl && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="size-7 shrink-0 text-muted-foreground"
                                          onClick={() => handleEditUrl(idx)}
                                          title="Editar URL"
                                        >
                                          <Pencil className="size-3" />
                                        </Button>
                                      )}
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
                              )}
                            </Draggable>
                          </Fragment>
                        )
                      })
                    )}
                    {dragState && dragState.destination != null && dragState.destination === items.length - 1 && (
                      view === "grid" ? (
                        <div className="w-[5px] self-stretch bg-primary/10 shrink-0 border-l-2 border-dashed border-primary/50" />
                      ) : (
                        <div className="h-2 bg-primary/10 rounded shrink-0 w-full border-t-2 border-dashed border-primary/50" />
                      )
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{urlEditIndex != null ? "Editar URL" : "Inserir URL"}</DialogTitle>
                <DialogDescription>
                  {urlEditIndex != null ? "Altere a URL e a duração de exibição" : "Adicione uma URL para ser exibida na playlist"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    placeholder="https://exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urlDuration">Duração (segundos)</Label>
                  <Input
                    id="urlDuration"
                    type="number"
                    min={1}
                    value={urlDuration}
                    onChange={(e) => setUrlDuration(Math.max(1, Number(e.target.value)))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUrlDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUrlSave}>
                  {urlEditIndex != null ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ContentPickerDialog
            open={contentPickerOpen}
            onOpenChange={(v) => {
              setContentPickerOpen(v)
              if (!v) setContentPickerFilter(undefined)
            }}
            availableContent={availableContent}
            onSelect={handleContentPickerSelect}
            filterType={contentPickerFilter}
          />

          <ContentScheduleDialog
            open={scheduleDialogOpen}
            onOpenChange={(v) => {
              if (!v) setEditingScheduleIndex(null)
              setScheduleDialogOpen(v)
            }}
            selectedContent={
              editingScheduleIndex != null
                ? (() => {
                    const item = items[editingScheduleIndex]
                    const c = item?.contentId ? allContent?.find((c) => c.id === item.contentId) : null
                    return c ? [c] : []
                  })()
                : pendingContentIds
                    .map((id) => allContent?.find((c) => c.id === id))
                    .filter((c): c is MediaContent => !!c)
            }
            initialTimeSlots={
              editingScheduleIndex != null
                ? items[editingScheduleIndex]?.timeSlots
                : undefined
            }
            isEditing={editingScheduleIndex != null}
            onConfirm={handleScheduleConfirm}
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
