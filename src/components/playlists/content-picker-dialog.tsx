"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Search, FileImage, Video, Globe, Plus, CopyPlus } from "lucide-react"
import type { MediaContent } from "@/types/content"

const typeIcons = { image: FileImage, video: Video, web: Globe }
const typeLabels = { image: "Imagem", video: "Vídeo", web: "URL" }

interface ContentPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableContent: MediaContent[]
  onSelect: (contentId: string, count: number) => void
}

export function ContentPickerDialog({
  open,
  onOpenChange,
  availableContent,
  onSelect,
}: ContentPickerDialogProps) {
  const [search, setSearch] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = availableContent
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
    }
    return list
  }, [availableContent, search])

  function handleSelect(id: string) {
    if (selectedId === id) {
      handleConfirm(id)
    } else {
      setSelectedId(id)
      setQuantity(1)
    }
  }

  function handleConfirm(id?: string) {
    const targetId = id ?? selectedId
    if (!targetId) return
    onSelect(targetId, quantity)
    onOpenChange(false)
    setSearch("")
    setSelectedId(null)
    setQuantity(1)
  }

  const counts = useMemo(() => {
    const image = availableContent.filter((c) => c.type === "image").length
    const video = availableContent.filter((c) => c.type === "video").length
    const web = availableContent.filter((c) => c.type === "web").length
    return { image, video, web }
  }, [availableContent])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col bg-background">
        <DialogHeader>
          <DialogTitle>Adicionar Conteúdo</DialogTitle>
          <DialogDescription>
            Selecione o conteúdo e a quantidade para inserir na playlist
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
              const isSelected = selectedId === content.id
              return (
                <button
                  key={content.id}
                  type="button"
                  onClick={() => handleSelect(content.id)}
                  className={`flex w-full items-center gap-3 rounded-md border p-2.5 text-left hover:bg-muted transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : ""
                  }`}
                >
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

        {selectedId && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
            <CopyPlus className="size-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2">
              <Label htmlFor="qty-content" className="text-sm whitespace-nowrap">
                Quantidade:
              </Label>
              <Input
                id="qty-content"
                type="number"
                min={1}
                max={999}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-20 h-8 text-sm"
              />
            </div>
            <Button type="button" size="sm" className="ml-auto" onClick={() => handleConfirm()}>
              Adicionar {quantity > 1 ? `(${quantity}x)` : ""}
            </Button>
          </div>
        )}

        {!selectedId && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Clique em um conteúdo para selecionar
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
