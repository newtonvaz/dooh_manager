"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { MediaContent } from "@/types/content"

interface EditContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: MediaContent
}

export function EditContentDialog({ open, onOpenChange, content }: EditContentDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(content.name)
  const [category, setCategory] = useState(content.category)
  const [saving, setSaving] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: api.getCategories,
  })

  useEffect(() => {
    setName(content.name)
    setCategory(content.category)
  }, [content])

  async function handleSave() {
    if (!name.trim()) {
      toast.error("O nome é obrigatório")
      return
    }
    if (!category) {
      toast.error("A categoria é obrigatória")
      return
    }

    setSaving(true)
    try {
      await api.updateContent(content.id, { name: name.trim(), category })
      queryClient.invalidateQueries({ queryKey: ["content"] })
      toast.success("Conteúdo atualizado com sucesso!")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar conteúdo")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Conteúdo</DialogTitle>
          <DialogDescription>Altere as informações do conteúdo</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do conteúdo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
