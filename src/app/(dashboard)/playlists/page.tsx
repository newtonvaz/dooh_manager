"use client"

import { useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"

const PlaylistFormDialog = dynamic(() => import("@/components/playlists/playlist-form-dialog").then((m) => ({ default: m.PlaylistFormDialog })), { ssr: false })
const BulkDeletePlaylistsDialog = dynamic(() => import("@/components/playlists/bulk-delete-playlists-dialog").then((m) => ({ default: m.BulkDeletePlaylistsDialog })), { ssr: false })
const DeletePlaylistDialog = dynamic(() => import("@/components/playlists/delete-playlist-dialog").then((m) => ({ default: m.DeletePlaylistDialog })), { ssr: false })
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  ListVideo,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  FileImage,
  Video,
  Globe,
  CheckSquare,
  X,
  Trash,
  LayoutGrid,
  List,
  Layers,
  GripVertical,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import type { Playlist, PlaylistItem, MediaContent } from "@/types/content"

const typeIcons = { image: FileImage, video: Video, web: Globe }

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function PlaylistsPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | undefined>(undefined)

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<"selected" | "all">("selected")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | undefined>()

  const { data: playlists, isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: api.getPlaylists,
  })

  const playlistList = playlists ?? []

  const { data: allContent } = useQuery({
    queryKey: ["content"],
    queryFn: api.getContent,
  })

  const [orderedIds, setOrderedIds] = useState<string[]>([])

  // Sync orderedIds from query data
  if (playlistList.length > 0 && orderedIds.length === 0) {
    setOrderedIds(playlistList.map((p) => p.id))
  }

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(orderedIds)
    const [reordered] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reordered)

    setOrderedIds(items)
    try {
      await api.reorderPlaylists(items)
      queryClient.invalidateQueries({ queryKey: ["playlists"] })
    } catch {
      queryClient.invalidateQueries({ queryKey: ["playlists"] })
    }
  }, [orderedIds, queryClient])

  const contentMap = new Map(allContent?.map((c) => [c.id, c]) ?? [])
  const playlistMap = new Map(playlists?.map((p: Playlist) => [p.id, p]) ?? [])

  const allSelected = playlistList.length > 0 && playlistList.every((p: Playlist) => selectedIds.has(p.id))
  const showCheckboxes = selectionMode || selectedIds.size > 0

  function handleEdit(playlist: Playlist) {
    setEditingPlaylist(playlist)
    setFormOpen(true)
  }

  function handleNew() {
    setEditingPlaylist(undefined)
    setFormOpen(true)
  }

  function confirmDelete(id: string, name: string) {
    setDeleteDialog({ id, name })
  }

  function toggleSelect(id: string) {
    if (!selectionMode) setSelectionMode(true)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(playlistList.map((p: Playlist) => p.id)))
    }
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  function openBulk(mode: "selected" | "all") {
    setBulkMode(mode)
    setBulkOpen(true)
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Playlists</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas listas de reprodução
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="size-3.5" />
              Lista
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-3.5" />
              Grid
            </button>
          </div>
          <Button onClick={handleNew}>
            <Plus className="mr-2 size-4" />
            Nova Playlist
          </Button>
        </div>
      </div>

      {showCheckboxes && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{selectedIds.size}</span>
            <span className="text-muted-foreground">de {playlistList.length} selecionado(s)</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={exitSelectionMode}>
              <X className="mr-1 size-3" />
              Cancelar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => openBulk("selected")}
              disabled={selectedIds.size === 0}
            >
              <Trash2 className="mr-1 size-3" />
              Remover Selecionadas
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => openBulk("all")}
            >
              <Trash className="mr-1 size-3" />
              Remover Todas
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {playlistList.length} playlist(s)
        </span>
      </div>

      {playlistList.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlistList.map((pl) => (
              <PlaylistCard
                key={pl.id}
                pl={pl}
                showCheckboxes={showCheckboxes}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                handleEdit={handleEdit}
                confirmDelete={confirmDelete}
                contentMap={contentMap}
                playlistMap={playlistMap}
              />
            ))}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!showCheckboxes && <TableHead className="w-10" />}
                    {showCheckboxes && <TableHead className="w-10" />}
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Criada em</TableHead>
                    {!showCheckboxes && <TableHead className="w-12" />}
                  </TableRow>
                </TableHeader>
                <Droppable droppableId="playlists">
                  {(provided) => (
                    <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                      {orderedIds.map((id, index) => {
                        const pl = playlistList.find((p) => p.id === id)
                        if (!pl) return null
                        return (
                          <Draggable key={pl.id} draggableId={pl.id} index={index}>
                            {(dragProvided) => (
                              <TableRow
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                data-state={selectedIds.has(pl.id) ? "selected" : undefined}
                              >
                                {!showCheckboxes && (
                                  <TableCell className="w-10 p-0 pl-2">
                                    <div
                                      {...dragProvided.dragHandleProps}
                                      className="flex items-center justify-center size-8 text-muted-foreground cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="size-4" />
                                    </div>
                                  </TableCell>
                                )}
                                {showCheckboxes && (
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedIds.has(pl.id)}
                                      onCheckedChange={() => toggleSelect(pl.id)}
                                    />
                                  </TableCell>
                                )}
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{pl.name}</span>
                                    {pl.isSubplaylist ? (
                                      <Badge variant="secondary" className="text-[10px]">Subplaylist</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px]">Playlist</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell><Badge variant="outline" className="text-xs">{pl.category}</Badge></TableCell>
                                <TableCell className="text-muted-foreground text-sm">{pl.items.length}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{formatDuration(pl.totalDuration)}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {format(new Date(pl.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                </TableCell>
                                {!showCheckboxes && (
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none">
                                        <MoreHorizontal className="size-4" />
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(pl)}>
                                          <Edit className="mr-2 size-4" />
                                          Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem variant="destructive" onClick={() => confirmDelete(pl.id, pl.name)}>
                                          <Trash2 className="mr-2 size-4" />
                                          Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                )}
                              </TableRow>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </TableBody>
                  )}
                </Droppable>
              </Table>
            </div>
          </DragDropContext>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ListVideo className="size-12 mb-4 opacity-50" />
          <p>Nenhuma playlist encontrada</p>
          <Button variant="outline" className="mt-4" onClick={handleNew}>
            <Plus className="mr-2 size-4" />
            Criar primeira playlist
          </Button>
        </div>
      )}

      <PlaylistFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        playlist={editingPlaylist}
      />

      {deleteDialog && (
        <DeletePlaylistDialog
          open={!!deleteDialog}
          onOpenChange={(open) => { if (!open) setDeleteDialog(undefined) }}
          playlistId={deleteDialog.id}
          playlistName={deleteDialog.name}
        />
      )}

      <BulkDeletePlaylistsDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        mode={bulkMode}
        selectedCount={selectedIds.size}
        selectedIds={Array.from(selectedIds)}
        totalCount={playlistList.length}
      />
    </div>
  )
}

interface PlaylistCardProps {
  pl: Playlist
  showCheckboxes: boolean
  selectedIds: Set<string>
  toggleSelect: (id: string) => void
  handleEdit: (pl: Playlist) => void
  confirmDelete: (id: string, name: string) => void
  contentMap: Map<string, MediaContent>
  playlistMap: Map<string, Playlist>
}

function PlaylistCard({ pl, showCheckboxes, selectedIds, toggleSelect, handleEdit, confirmDelete, contentMap, playlistMap }: PlaylistCardProps) {
  const isSub = pl.isSubplaylist

  function renderItemIcon(item: PlaylistItem) {
    if (item.type === "content") {
      const content = contentMap.get(item.contentId!)
      if (!content) return null
      const Icon = typeIcons[content.type]
      return (
        <div className="rounded bg-muted p-1" title={content.name}>
          <Icon className="size-3 text-muted-foreground" />
        </div>
      )
    }
    const sub = playlistMap.get(item.playlistId!)
    return (
      <div className="rounded bg-muted p-1" title={sub?.name ?? "Subplaylist"}>
        <Layers className="size-3 text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card className="group relative">
      {showCheckboxes && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={selectedIds.has(pl.id)}
            onCheckedChange={() => toggleSelect(pl.id)}
            aria-label={`Selecionar ${pl.name}`}
          />
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div className={cn("flex items-start justify-between gap-2", showCheckboxes && "ml-7")}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{pl.name}</h3>
              {isSub ? (
                <Badge variant="secondary" className="text-[10px] shrink-0">Subplaylist</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] shrink-0">Playlist</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-xs">{pl.category}</Badge>
              <Badge variant="secondary" className="text-xs">{pl.items.length} itens</Badge>
            </div>
          </div>
          {!showCheckboxes && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-center size-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(pl)}>
                  <Edit className="mr-2 size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => confirmDelete(pl.id, pl.name)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {pl.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{pl.description}</p>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span>{formatDuration(pl.totalDuration)}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {pl.items.slice(0, 5).map((item) => (
            <div key={item.type === "content" ? `c:${item.contentId}` : `p:${item.playlistId}`}>
              {renderItemIcon(item)}
            </div>
          ))}
          {pl.items.length > 5 && (
            <span className="text-xs text-muted-foreground self-center ml-1">
              +{pl.items.length - 5}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Criada em {format(new Date(pl.createdAt), "dd/MM/yyyy", { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  )
}
