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

interface DeleteCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: string
  categoryName: string
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName,
}: DeleteCategoryDialogProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await api.deleteCategory(categoryId)
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Categoria removida")
      onOpenChange(false)
    } catch {
      toast.error("Erro ao remover categoria")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Remover Categoria
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover <strong>{categoryName}</strong>?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <WithTooltip content="Cancelar"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button></WithTooltip>
          <WithTooltip content="Excluir"><Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Remover
          </Button></WithTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
