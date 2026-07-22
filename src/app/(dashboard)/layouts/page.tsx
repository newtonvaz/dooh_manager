"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { LayoutEditor } from "@/components/layouts/layout-editor"
import { AreaList } from "@/components/layouts/area-list"
import { AreaFormDialog } from "@/components/layouts/area-form-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WithTooltip } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Grid3x3,
  Plus,
  Trash2,
  Pencil,
  Monitor,
  LayoutTemplate,
} from "lucide-react"
import type { Layout, LayoutArea } from "@/types/layout"

export default function LayoutsPage() {
  const queryClient = useQueryClient()
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<LayoutArea | undefined>(undefined)
  const [layoutFormOpen, setLayoutFormOpen] = useState(false)
  const [editingLayout, setEditingLayout] = useState<Layout | undefined>(undefined)
  const [layoutName, setLayoutName] = useState("")
  const [layoutDesc, setLayoutDesc] = useState("")
  const [layoutSaving, setLayoutSaving] = useState(false)

  const { data: layouts = [], isLoading: layoutsLoading } = useQuery({
    queryKey: ["layouts"],
    queryFn: api.getLayouts,
  })

  const selectedLayout = layouts.find((l) => l.id === selectedLayoutId)

  function openLayoutForm(layout?: Layout) {
    setEditingLayout(layout)
    setLayoutName(layout?.name ?? "")
    setLayoutDesc(layout?.description ?? "")
    setLayoutFormOpen(true)
  }

  async function saveLayout(e: React.FormEvent) {
    e.preventDefault()
    if (!layoutName.trim()) {
      toast.error("Defina um nome para o layout")
      return
    }
    setLayoutSaving(true)
    try {
      if (editingLayout) {
        await api.updateLayout(editingLayout.id, {
          name: layoutName.trim(),
          description: layoutDesc.trim(),
        })
        toast.success("Layout atualizado")
      } else {
        const created = await api.createLayout({
          name: layoutName.trim(),
          description: layoutDesc.trim(),
          canvasWidth: 1920,
          canvasHeight: 1080,
        })
        setSelectedLayoutId(created.id)
        toast.success("Layout criado")
      }
      queryClient.invalidateQueries({ queryKey: ["layouts"] })
      setLayoutFormOpen(false)
    } catch {
      toast.error("Erro ao salvar layout")
    } finally {
      setLayoutSaving(false)
    }
  }

  async function deleteLayout(id: string) {
    const layout = layouts.find((l) => l.id === id)
    if (!confirm(`Excluir o layout "${layout?.name}"? Todas as áreas serão removidas.`)) return
    try {
      await api.deleteLayout(id)
      queryClient.invalidateQueries({ queryKey: ["layouts"] })
      if (selectedLayoutId === id) setSelectedLayoutId(null)
      toast.success("Layout excluído")
    } catch {
      toast.error("Erro ao excluir layout")
    }
  }

  function handleEditArea(area: LayoutArea) {
    setEditingArea(area)
    setFormOpen(true)
  }

  function handleCreateArea() {
    if (!selectedLayoutId) {
      toast.error("Selecione um layout primeiro")
      return
    }
    setEditingArea(undefined)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Layouts</h1>
        <p className="text-sm text-muted-foreground">
          Crie e gerencie layouts de tela com áreas de conteúdo e apps
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Button onClick={() => openLayoutForm(undefined)} size="sm">
          <Plus className="mr-1.5 size-4" />
          Novo Layout
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-1">
          <div className="rounded-xl border bg-card p-3 space-y-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">
              Meus Layouts
            </h3>
            {layoutsLoading ? (
              <div className="text-sm text-muted-foreground py-4 text-center">Carregando...</div>
            ) : layouts.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
                Nenhum layout
              </div>
            ) : (
              layouts.map((layout) => (
                <div
                  key={layout.id}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                    selectedLayoutId === layout.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedLayoutId(layout.id)}
                >
                  <LayoutTemplate className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{layout.name}</span>
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      openLayoutForm(layout)
                    }}
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteLayout(layout.id)
                    }}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          {!selectedLayoutId ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border rounded-xl">
              <Monitor className="size-16 mb-4 opacity-30" />
              <p className="text-sm">Selecione um layout para editar</p>
              <p className="text-xs mt-1">ou crie um novo layout</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedLayout?.name}</h2>
                  {selectedLayout?.description && (
                    <p className="text-sm text-muted-foreground">{selectedLayout.description}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedLayout?.canvasWidth}×{selectedLayout?.canvasHeight}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                <div className="xl:col-span-3">
                  <div className="rounded-xl border bg-card">
                    <div className="flex items-center justify-between p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <Grid3x3 className="size-5 text-muted-foreground" />
                        <span className="text-sm font-medium">Editor Visual</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Arraste para mover · Use as alças para redimensionar
                      </span>
                    </div>
                    <div className="p-4 pt-2">
                      <LayoutEditor layoutId={selectedLayoutId} />
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-1">
                  <div className="rounded-xl border bg-card p-4">
                    <AreaList
                      layoutId={selectedLayoutId}
                      onEdit={handleEditArea}
                      onCreate={handleCreateArea}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AreaFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v)
          if (!v) setEditingArea(undefined)
        }}
        area={editingArea}
        layoutId={selectedLayoutId || "default"}
      />

      <Dialog open={layoutFormOpen} onOpenChange={setLayoutFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLayout ? "Editar Layout" : "Novo Layout"}</DialogTitle>
            <DialogDescription>
              {editingLayout ? "Altere as informações do layout" : "Defina o nome e descrição do novo layout"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveLayout} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder="Ex: Layout Principal"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={layoutDesc}
                onChange={(e) => setLayoutDesc(e.target.value)}
                placeholder="Descrição opcional"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setLayoutFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={layoutSaving}>
                {editingLayout ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
