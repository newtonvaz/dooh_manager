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
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQueryClient } from "@tanstack/react-query"

interface DeletePlayerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playerId: string
  playerName: string
}

export function DeletePlayerDialog({ open, onOpenChange, playerId, playerName }: DeletePlayerDialogProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await api.deletePlayer(playerId)
      queryClient.invalidateQueries({ queryKey: ["players"] })
      toast.success("Player removido com sucesso!")
      onOpenChange(false)
    } catch {
      toast.error("Erro ao remover player")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            Remover Player
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover <strong>{playerName}</strong>? Esta ação não pode ser desfeita.
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
