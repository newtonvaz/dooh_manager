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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQueryClient } from "@tanstack/react-query"

interface DeleteGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
}

export function DeleteGroupDialog({ open, onOpenChange, groupId, groupName }: DeleteGroupDialogProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await api.deleteGroup(groupId)
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      toast.success("Grupo removido")
      onOpenChange(false)
    } catch {
      toast.error("Erro ao remover grupo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remover Grupo</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover o grupo <strong>{groupName}</strong>? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <WithTooltip content="Cancelar"><Button variant="outline" onClick={() => onOpenChange(false)}>
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
