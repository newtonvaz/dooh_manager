"use client"

import { useState } from "react"
import { Grid3x3 } from "lucide-react"
import { LayoutEditor } from "@/components/layouts/layout-editor"
import { AreaList } from "@/components/layouts/area-list"
import { AreaFormDialog } from "@/components/layouts/area-form-dialog"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { WithTooltip } from "@/components/ui/tooltip"
import type { LayoutArea } from "@/types/layout"

export default function LayoutsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<LayoutArea | undefined>(undefined)
  const [showList, setShowList] = useState(true)

  function handleEdit(area: LayoutArea) {
    setEditingArea(area)
    setFormOpen(true)
  }

  function handleCreate() {
    setEditingArea(undefined)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Layouts</h1>
        <p className="text-sm text-muted-foreground">
          Crie e gerencie áreas de conteúdo e apps no layout da tela
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2">
                <Grid3x3 className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium">Editor Visual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Arraste para mover · Use as alças para redimensionar
                </span>
              </div>
            </div>
            <div className="p-4 pt-2">
              <LayoutEditor />
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="rounded-xl border bg-card p-4">
            <AreaList onEdit={handleEdit} onCreate={handleCreate} />
          </div>
        </div>
      </div>

      <AreaFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v)
          if (!v) setEditingArea(undefined)
        }}
        area={editingArea}
      />
    </div>
  )
}
