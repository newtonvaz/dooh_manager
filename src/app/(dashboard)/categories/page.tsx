"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import dynamic from "next/dynamic"

const CategoryFormDialog = dynamic(() => import("@/components/categories/category-form-dialog").then((m) => ({ default: m.CategoryFormDialog })), { ssr: false })
const DeleteCategoryDialog = dynamic(() => import("@/components/categories/delete-category-dialog").then((m) => ({ default: m.DeleteCategoryDialog })), { ssr: false })
const BulkDeleteCategoriesDialog = dynamic(() => import("@/components/categories/bulk-delete-categories-dialog").then((m) => ({ default: m.BulkDeleteCategoriesDialog })), { ssr: false })
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Tags,
  CheckSquare,
  X,
  Trash,
} from "lucide-react"
import { WithTooltip } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Category {
  id: string
  name: string
  createdAt: string
}

export default function CategoriesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | undefined>()
  const [deletingCategory, setDeletingCategory] = useState<Category | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<"selected" | "all">("selected")

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: api.getCategories,
  })

  const categoryList = categories ?? []
  const allSelected = categoryList.length > 0 && categoryList.every((c: Category) => selectedIds.has(c.id))
  const showCheckboxes = selectionMode || selectedIds.size > 0

  function handleEdit(cat: Category) {
    setEditingCategory(cat)
    setFormOpen(true)
  }

  function handleNew() {
    setEditingCategory(undefined)
    setFormOpen(true)
  }

  function confirmDelete(cat: Category) {
    setDeletingCategory(cat)
    setDeleteOpen(true)
  }

  function toggleSelect(id: string) {
    if (!selectionMode) setSelectionMode(true)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(categoryList.map((c: Category) => c.id)))
    }
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  function openBulk(mode: "selected" | "all") {
    setBulkMode(mode)
    setBulkOpen(true)
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as categorias para organizar seus conteúdos
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 size-4" />
          Nova Categoria
        </Button>
      </div>

      {showCheckboxes && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{selectedIds.size}</span>
            <span className="text-muted-foreground">de {categoryList.length} selecionado(s)</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={exitSelectionMode}>
              <X className="mr-1 size-3" />
              Cancelar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => openBulk("selected")}
              disabled={selectedIds.size === 0}
            >
              <Trash2 className="mr-1 size-3" />
              Remover Selecionadas
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => openBulk("all")}
            >
              <Trash className="mr-1 size-3" />
              Remover Todas
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {showCheckboxes && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos"
                    disabled={categoryList.length === 0}
                  />
                </TableHead>
              )}
              <TableHead>
                <div className="flex items-center gap-2">
                  <span>Nome</span>
                  {!showCheckboxes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs font-normal text-muted-foreground"
                      onClick={() => setSelectionMode(true)}
                    >
                      <CheckSquare className="mr-1 size-3" />
                      Selecionar
                    </Button>
                  )}
                </div>
              </TableHead>
              <TableHead>Criada em</TableHead>
              {!showCheckboxes && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showCheckboxes ? 4 : 3} className="text-center text-muted-foreground py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Tags className="size-8 opacity-50" />
                    <p>Nenhuma categoria encontrada</p>
                    <Button variant="outline" size="sm" onClick={handleNew}>
                      <Plus className="mr-1 size-3" />
                      Criar primeira categoria
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categoryList.map((cat: Category) => (
                <TableRow
                  key={cat.id}
                  data-state={selectedIds.has(cat.id) ? "selected" : undefined}
                >
                  {showCheckboxes && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(cat.id)}
                        onCheckedChange={() => toggleSelect(cat.id)}
                        aria-label={`Selecionar ${cat.name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(cat.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  {!showCheckboxes && (
                    <TableCell>
                      <DropdownMenu>
                        <WithTooltip content="Ações da categoria">
                          <DropdownMenuTrigger className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none">
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                        </WithTooltip>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(cat)}>
                            <Edit className="mr-2 size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => confirmDelete(cat)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
      />

      {deletingCategory && (
        <DeleteCategoryDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) setDeletingCategory(undefined)
          }}
          categoryId={deletingCategory.id}
          categoryName={deletingCategory.name}
        />
      )}

      <BulkDeleteCategoriesDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        mode={bulkMode}
        selectedCount={selectedIds.size}
        selectedIds={Array.from(selectedIds)}
        totalCount={categoryList.length}
      />
    </div>
  )
}
