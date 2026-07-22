"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
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

const GroupFormDialog = dynamic(() => import("@/components/groups/group-form-dialog").then((m) => ({ default: m.GroupFormDialog })), { ssr: false })
const DeleteGroupDialog = dynamic(() => import("@/components/groups/delete-group-dialog").then((m) => ({ default: m.DeleteGroupDialog })), { ssr: false })
const BulkDeleteGroupsDialog = dynamic(() => import("@/components/groups/bulk-delete-groups-dialog").then((m) => ({ default: m.BulkDeleteGroupsDialog })), { ssr: false })
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  CheckSquare,
  X,
  Trash,
} from "lucide-react"
import { WithTooltip } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Group {
  id: string
  name: string
  createdAt: string
}

export default function GroupsPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | undefined>()
  const [deletingGroup, setDeletingGroup] = useState<Group | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<"selected" | "all">("selected")

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: api.getGroups,
  })

  const groupList = groups ?? []
  const allSelected = groupList.length > 0 && groupList.every((g: Group) => selectedIds.has(g.id))
  const showCheckboxes = selectionMode || selectedIds.size > 0

  function handleEdit(group: Group) {
    setEditingGroup(group)
    setFormOpen(true)
  }

  function handleNew() {
    setEditingGroup(undefined)
    setFormOpen(true)
  }

  function confirmDelete(group: Group) {
    setDeletingGroup(group)
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
      setSelectedIds(new Set(groupList.map((g: Group) => g.id)))
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
          <h1 className="text-2xl font-bold tracking-tight">Grupos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os grupos para organizar seus players
          </p>
        </div>
        <WithTooltip content="Adicionar novo grupo">
          <Button onClick={handleNew}>
            <Plus className="mr-2 size-4" />
            Novo Grupo
          </Button>
        </WithTooltip>
      </div>

      {showCheckboxes && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{selectedIds.size}</span>
            <span className="text-muted-foreground">de {groupList.length} selecionado(s)</span>
            <WithTooltip content="Cancelar seleção">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={exitSelectionMode}>
                <X className="mr-1 size-3" />
                Cancelar
              </Button>
            </WithTooltip>
          </div>
          <div className="flex items-center gap-2">
            <WithTooltip content="Remover grupos selecionados">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => openBulk("selected")}
                disabled={selectedIds.size === 0}
              >
                <Trash2 className="mr-1 size-3" />
                Remover Selecionados
              </Button>
            </WithTooltip>
            <WithTooltip content="Remover todos os grupos">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => openBulk("all")}
              >
                <Trash className="mr-1 size-3" />
                Remover Todos
              </Button>
            </WithTooltip>
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
                    disabled={groupList.length === 0}
                  />
                </TableHead>
              )}
              <TableHead>
                <div className="flex items-center gap-2">
                  <span>Nome</span>
                  {!showCheckboxes && (
                    <WithTooltip content="Selecionar grupos">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs font-normal text-muted-foreground"
                        onClick={() => setSelectionMode(true)}
                      >
                        <CheckSquare className="mr-1 size-3" />
                        Selecionar
                      </Button>
                    </WithTooltip>
                  )}
                </div>
              </TableHead>
              <TableHead>Criado em</TableHead>
              {!showCheckboxes && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showCheckboxes ? 4 : 3} className="text-center text-muted-foreground py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="size-8 opacity-50" />
                    <p>Nenhum grupo encontrado</p>
                    <WithTooltip content="Adicionar novo grupo">
                      <Button variant="outline" size="sm" onClick={handleNew}>
                        <Plus className="mr-1 size-3" />
                        Criar primeiro grupo
                      </Button>
                    </WithTooltip>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              groupList.map((group: Group) => (
                <TableRow
                  key={group.id}
                  data-state={selectedIds.has(group.id) ? "selected" : undefined}
                >
                  {showCheckboxes && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(group.id)}
                        onCheckedChange={() => toggleSelect(group.id)}
                        aria-label={`Selecionar ${group.name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(group.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  {!showCheckboxes && (
                    <TableCell>
                      <DropdownMenu>
                        <WithTooltip content="Ações do grupo">
                          <DropdownMenuTrigger className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none">
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                        </WithTooltip>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(group)}>
                            <Edit className="mr-2 size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => confirmDelete(group)}
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

      <GroupFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        group={editingGroup}
      />

      {deletingGroup && (
        <DeleteGroupDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) setDeletingGroup(undefined)
          }}
          groupId={deletingGroup.id}
          groupName={deletingGroup.name}
        />
      )}

      <BulkDeleteGroupsDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        mode={bulkMode}
        selectedCount={selectedIds.size}
        selectedIds={Array.from(selectedIds)}
        totalCount={groupList.length}
      />
    </div>
  )
}
