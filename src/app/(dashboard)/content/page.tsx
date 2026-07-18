"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import dynamic from "next/dynamic"

const DeleteContentDialog = dynamic(() => import("@/components/content/delete-content-dialog").then((m) => ({ default: m.DeleteContentDialog })), { ssr: false })
const BulkDeleteContentDialog = dynamic(() => import("@/components/content/bulk-delete-content-dialog").then((m) => ({ default: m.BulkDeleteContentDialog })), { ssr: false })
const UploadContentDialog = dynamic(() => import("@/components/content/upload-content-dialog").then((m) => ({ default: m.UploadContentDialog })), { ssr: false })
const EditContentDialog = dynamic(() => import("@/components/content/edit-content-dialog").then((m) => ({ default: m.EditContentDialog })), { ssr: false })
import {
  Plus,
  FileImage,
  Video,
  Globe,
  Search,
  LayoutGrid,
  List,
  Trash2,
  CheckSquare,
  X,
  Trash,
  Pencil,
} from "lucide-react"
import { useState, useMemo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { MediaType, MediaContent } from "@/types/content"
import { cn } from "@/lib/utils"

type ViewMode = "grid" | "list"

const typeIcons: Record<MediaType, typeof FileImage> = {
  image: FileImage,
  video: Video,
  web: Globe,
}

const typeColors: Record<MediaType, string> = {
  image: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  video: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
  web: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
}

const typeLabels: Record<MediaType, string> = {
  image: "Imagem",
  video: "Vídeo",
  web: "Web",
}

export default function ContentPage() {
  const queryClient = useQueryClient()
  const { data: content, isLoading } = useQuery({
    queryKey: ["content"],
    queryFn: api.getContent,
  })

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("Todas")
  const [view, setView] = useState<ViewMode>("list")
  const [deleting, setDeleting] = useState<MediaContent | undefined>(undefined)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<MediaContent | undefined>(undefined)
  const [editOpen, setEditOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<"selected" | "all">("selected")

  const filtered = useMemo(() => {
    if (!content) return []
    return content.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase())
      const matchCategory = categoryFilter === "Todas" || c.category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [content, search, categoryFilter])

  const filteredIds = useMemo(() => filtered.map((c) => c.id), [filtered])
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id))
  const showCheckboxes = selectionMode || selectedIds.size > 0

  const categories = useMemo(() => {
    if (!content) return ["Todas"]
    const cats = [...new Set(content.map((c) => c.category))]
    return ["Todas", ...cats]
  }, [content])

  function confirmDelete(item: MediaContent) {
    setDeleting(item)
    setDeleteOpen(true)
  }

  function openEdit(item: MediaContent) {
    setEditing(item)
    setEditOpen(true)
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
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredIds))
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
          <h1 className="text-2xl font-bold tracking-tight">Conteúdos</h1>
          <p className="text-sm text-muted-foreground">
            Biblioteca de mídias e arquivos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border">
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="size-3.5" />
              Lista
            </button>
            <button
              onClick={() => setView("grid")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                view === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-3.5" />
              Grid
            </button>
          </div>
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="mr-2 size-4" />
            Upload
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!showCheckboxes && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => setSelectionMode(true)}
          >
            <CheckSquare className="mr-1 size-3" />
            Selecionar
          </Button>
        )}
      </div>

      {showCheckboxes && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{selectedIds.size}</span>
            <span className="text-muted-foreground">de {filtered.length} selecionado(s)</span>
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
              Remover Selecionados
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => openBulk("all")}
            >
              <Trash className="mr-1 size-3" />
              Remover Todos
            </Button>
          </div>
        </div>
      )}

      {view === "grid" ? (
        <div className="space-y-3">
          {showCheckboxes && (
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Selecionar todos"
                disabled={filtered.length === 0}
              />
              <span className="text-xs text-muted-foreground">
                {allFilteredSelected ? "Todos selecionados" : "Selecionar todos"}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => {
            const Icon = typeIcons[item.type]
            const color = typeColors[item.type]
            const isSelected = selectedIds.has(item.id)

            return (
              <Card
                key={item.id}
                className={`overflow-hidden group hover:shadow-md transition-shadow ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="relative aspect-video bg-muted flex items-center justify-center">
                  {showCheckboxes && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(item.id)}
                      className="absolute top-2 left-2"
                      aria-label={`Selecionar ${item.name}`}
                    />
                  )}
                  {!showCheckboxes && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-7"
                        onClick={(e) => { e.stopPropagation(); openEdit(item) }}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="size-7"
                        onClick={(e) => { e.stopPropagation(); confirmDelete(item) }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  )}
                  <div className={`rounded-lg p-3 ${color}`}>
                    <Icon className="size-8" />
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{typeLabels[item.type]}</span>
                    <span>•</span>
                    <span>{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{item.size > 0 ? `${item.size}MB` : "-"}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {showCheckboxes && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todos"
                      disabled={filtered.length === 0}
                    />
                  </TableHead>
                )}
                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>Nome</span>
                    {!showCheckboxes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs font-normal text-muted-foreground"
                        onClick={() => setSelectionMode(true)}
                      >
                        <CheckSquare className="mr-1 size-3" />
                        Selecionar
                      </Button>
                    )}
                  </div>
                </TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data</TableHead>
                {!showCheckboxes && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showCheckboxes ? 7 : 6} className="text-center text-muted-foreground py-8">
                    Nenhum conteúdo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const Icon = typeIcons[item.type]
                  const color = typeColors[item.type]
                  return (
                    <TableRow key={item.id} data-state={selectedIds.has(item.id) ? "selected" : undefined}>
                      {showCheckboxes && (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                            aria-label={`Selecionar ${item.name}`}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-1.5 ${color}`}>
                            <Icon className="size-4" />
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{typeLabels[item.type]}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.size > 0 ? `${item.size}MB` : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      {!showCheckboxes && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive"
                              onClick={() => confirmDelete(item)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered.length === 0 && view === "grid" && (
        <div className="text-center text-muted-foreground py-12">
          Nenhum conteúdo encontrado
        </div>
      )}

      {deleting && (
        <DeleteContentDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) setDeleting(undefined)
          }}
          contentId={deleting.id}
          contentName={deleting.name}
        />
      )}

      <BulkDeleteContentDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        mode={bulkMode}
        selectedCount={selectedIds.size}
        selectedIds={Array.from(selectedIds)}
        totalCount={filtered.length}
      />

      {editing && (
        <EditContentDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open)
            if (!open) setEditing(undefined)
          }}
          content={editing}
        />
      )}

      <UploadContentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />
    </div>
  )
}
