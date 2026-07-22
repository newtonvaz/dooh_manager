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
import { WithTooltip } from "@/components/ui/tooltip"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQueryClient } from "@tanstack/react-query"

interface BulkDeleteCategoriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "selected" | "all"
  selectedCount?: number
  selectedIds?: string[]
  totalCount: number
}

export function BulkDeleteCategoriesDialog({
  open,
  onOpenChange,
  mode,
  selectedCount = 0,
  selectedIds = [],
  totalCount,
}: BulkDeleteCategoriesDialogProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      if (mode === "all") {
        await api.deleteAllCategories()
        toast.success("Todas as categorias foram removidas!")
      } else {
        await api.deleteMultipleCategories(selectedIds)
        toast.success(`${selectedCount} categoria(s) removida(s)!`)
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      onOpenChange(false)
    } catch {
      toast.error("Erro ao remover categorias")
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
            Remover Categorias
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover <strong>{count}</strong> categoria(s)?
            {mode === "all" && (
              <span className="block mt-1 text-destructive font-medium">
                Esta ação removerá TODAS as categorias cadastradas!
              </span>
            )}
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <WithTooltip content="Cancelar"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button></WithTooltip>
          <WithTooltip content="Confirmar exclusão"><Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Remover {mode === "all" ? "Todas" : `${count} categoria(s)`}
          </Button></WithTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
