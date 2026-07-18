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
import { Search, Layers, Plus, CopyPlus } from "lucide-react"
import type { Playlist } from "@/types/content"

interface SubplaylistPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availablePlaylists: Playlist[]
  onSelect: (playlistId: string, count: number) => void
}

export function SubplaylistPickerDialog({
  open,
  onOpenChange,
  availablePlaylists,
  onSelect,
}: SubplaylistPickerDialogProps) {
  const [search, setSearch] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return availablePlaylists
    const q = search.toLowerCase()
    return availablePlaylists.filter((p) => p.name.toLowerCase().includes(q))
  }, [availablePlaylists, search])

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col bg-background">
        <DialogHeader>
          <DialogTitle>Adicionar Subplaylist</DialogTitle>
          <DialogDescription>
            Selecione a subplaylist e a quantidade para inserir na playlist
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar subplaylist..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-md border p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma subplaylist encontrada
            </p>
          ) : (
            filtered.map((pl) => {
              const isSelected = selectedId === pl.id
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => handleSelect(pl.id)}
                  className={`flex w-full items-center gap-3 rounded-md border p-2.5 text-left hover:bg-muted transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="rounded-lg bg-muted p-1.5">
                    <Layers className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pl.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pl.items.length} itens
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
              <Label htmlFor="qty-sub" className="text-sm whitespace-nowrap">
                Quantidade:
              </Label>
              <Input
                id="qty-sub"
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
            Clique em uma subplaylist para selecionar
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
