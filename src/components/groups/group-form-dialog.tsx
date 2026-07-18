"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQueryClient } from "@tanstack/react-query"

interface GroupFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: { id: string; name: string }
}

export function GroupFormDialog({ open, onOpenChange, group }: GroupFormDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(group?.name ?? "")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Preencha o nome do grupo")
      return
    }

    setLoading(true)
    try {
      if (group) {
        await api.updateGroup(group.id, name.trim())
        toast.success("Grupo atualizado com sucesso!")
      } else {
        await api.createGroup(name.trim())
        toast.success("Grupo criado com sucesso!")
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      onOpenChange(false)
    } catch {
      toast.error("Erro ao salvar grupo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{group ? "Editar Grupo" : "Novo Grupo"}</DialogTitle>
          <DialogDescription>
            {group ? "Altere o nome do grupo" : "Preencha o nome para criar um novo grupo"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Filial Norte"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {group ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
