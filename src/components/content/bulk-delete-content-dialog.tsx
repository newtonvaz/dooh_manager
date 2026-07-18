"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQueryClient } from "@tanstack/react-query"

interface BulkDeleteContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "selected" | "all"
  selectedCount?: number
  selectedIds?: string[]
  totalCount: number
}

export function BulkDeleteContentDialog({
  open,
  onOpenChange,
  mode,
  selectedCount = 0,
  selectedIds = [],
  totalCount,
}: BulkDeleteContentDialogProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      if (mode === "all") {
        await api.deleteAllContent()
        toast.success("Todos os conteúdos foram removidos!")
      } else {
        await api.deleteMultipleContent(selectedIds)
        toast.success(`${selectedCount} conteúdo(s) removido(s) com sucesso!`)
      }
      queryClient.invalidateQueries({ queryKey: ["content"] })
      onOpenChange(false)
    } catch {
      toast.error("Erro ao remover conteúdos")
    } finally {
      setLoading(false)
    }
  }

  const count = mode === "all" ? totalCount : selectedCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Remover Conteúdos
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover <strong>{count}</strong> conteúdo(s)?
            {mode === "all" && (
              <span className="block mt-1 text-destructive font-medium">
                Esta ação removerá TODOS os conteúdos cadastrados!
              </span>
            )}
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Remover {mode === "all" ? "Todos" : `${count} conteúdo(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
