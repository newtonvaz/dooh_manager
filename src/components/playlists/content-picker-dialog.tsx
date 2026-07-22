"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { WithTooltip } from "@/components/ui/tooltip"
import { Search, FileImage, Video, Globe, Plus, CheckCheck } from "lucide-react"
import type { MediaContent } from "@/types/content"

const typeIcons = { image: FileImage, video: Video, web: Globe }
const typeLabels = { image: "Imagem", video: "Vídeo", web: "URL" }

interface ContentPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableContent: MediaContent[]
  onSelect: (contentIds: string[]) => void
  filterType?: "image" | "video" | "web"
}

export function ContentPickerDialog({
  open,
  onOpenChange,
  availableContent,
  onSelect,
  filterType,
}: ContentPickerDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let list = availableContent
    if (filterType) {
      list = list.filter((c) => c.type === filterType)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
    }
    return list
  }, [availableContent, search, filterType])

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConfirm() {
    if (selectedIds.size === 0) return
    onSelect(Array.from(selectedIds))
    onOpenChange(false)
    setSearch("")
    setSelectedIds(new Set())
  }

  const counts = useMemo(() => {
    const list = filterType ? availableContent.filter((c) => c.type === filterType) : availableContent
    const image = list.filter((c) => c.type === "image").length
    const video = list.filter((c) => c.type === "video").length
    const web = list.filter((c) => c.type === "web").length
    return { image, video, web }
  }, [availableContent, filterType])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setSearch("")
          setSelectedIds(new Set())
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col bg-background">
        <DialogHeader>
          <DialogTitle>{filterType === "web" ? "Adicionar App" : "Adicionar Conteúdo"}</DialogTitle>
          <DialogDescription>
            {filterType === "web"
              ? "Selecione um ou mais Apps para inserir na playlist"
              : "Selecione um ou mais conteúdos para inserir na playlist"}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conteúdo..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1">
            <FileImage className="size-3" /> {counts.image} imagens
          </span>
          <span className="flex items-center gap-1">
            <Video className="size-3" /> {counts.video} vídeos
          </span>
          <span className="flex items-center gap-1">
            <Globe className="size-3" /> {counts.web} URLs
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-md border p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum conteúdo encontrado
            </p>
          ) : (
            filtered.map((content) => {
              const Icon = typeIcons[content.type]
              const checked = selectedIds.has(content.id)
              return (
                <button
                  key={content.id}
                  type="button"
                  onClick={() => toggle(content.id)}
                  className={`flex w-full items-center gap-3 rounded-md border p-2.5 text-left hover:bg-muted transition-colors ${
                    checked ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <Checkbox checked={checked} className="shrink-0" />
                  <div className="rounded-lg bg-muted p-1.5">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{content.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {typeLabels[content.type]} • {content.category}
                      {content.duration ? ` • ${content.duration}s` : ""}
                    </p>
                  </div>
                  <Plus className="size-4 text-muted-foreground shrink-0" />
                </button>
              )
            })
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
            <CheckCheck className="size-4 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} conteúdo{selectedIds.size !== 1 ? "s" : ""} selecionado
              {selectedIds.size !== 1 ? "s" : ""}
            </span>
            <WithTooltip content="Adicionar à playlist"><Button type="button" size="sm" className="ml-auto" onClick={handleConfirm}>
              Adicionar {selectedIds.size > 1 ? `(${selectedIds.size})` : ""}
            </Button></WithTooltip>
          </div>
        )}

        {selectedIds.size === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Selecione os conteúdos desejados
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
