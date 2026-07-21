"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import dynamic from "next/dynamic"
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  Clock,
} from "lucide-react"
import type { ProgrammingGroup } from "@/types/programming-group"
import { DAY_LABELS_SHORT } from "@/types/schedule"
import { cn } from "@/lib/utils"

const ProgrammingGroupFormDialog = dynamic(
  () =>
    import("@/components/scheduling/programming-group-form-dialog").then(
      (m) => ({ default: m.ProgrammingGroupFormDialog })
    ),
  { ssr: false }
)

const DeleteProgrammingGroupDialog = dynamic(
  () =>
    import("@/components/scheduling/delete-programming-group-dialog").then(
      (m) => ({ default: m.DeleteProgrammingGroupDialog })
    ),
  { ssr: false }
)

function formatDays(days: number[]): string {
  if (days.length === 0) return "—"
  if (days.length === 7) return "Todos os dias"
  return days.map((d) => DAY_LABELS_SHORT[d]).join(", ")
}

function getStatusLabel(group: ProgrammingGroup): {
  label: string
  variant: "default" | "secondary" | "outline"
} {
  if (!group.enabled) {
    return { label: "Inativo", variant: "secondary" }
  }
  if (group.timeSlots.length === 0) {
    return { label: "Sem horários", variant: "outline" }
  }
  return { label: "Ativo", variant: "default" }
}

function ViewProgrammingGroupDialog({
  open,
  onOpenChange,
  group,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: ProgrammingGroup
}) {
  if (!group) return null

  const days = [...new Set(group.timeSlots.map((s) => s.dayOfWeek))].sort()
  const startTime = group.timeSlots[0]?.startTime ?? "—"
  const endTime = group.timeSlots[0]?.endTime ?? "—"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{group.name}</DialogTitle>
          <DialogDescription>Detalhes do grupo de programação</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={group.enabled && group.timeSlots.length > 0 ? "default" : "secondary"}>
                {group.enabled && group.timeSlots.length > 0 ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Players</p>
              <p className="text-sm font-medium">{group.playerCount ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Dias de Funcionamento</p>
              <p className="text-sm font-medium">
                {days.length === 7
                  ? "Todos os dias"
                  : days.length > 0
                  ? days.map((d) => DAY_LABELS_SHORT[d]).join(", ")
                  : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Horário</p>
              <p className="text-sm font-medium">
                {group.timeSlots.length > 0 ? `${startTime} — ${endTime}` : "—"}
              </p>
            </div>
          </div>

          {group.players && group.players.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Players no grupo</p>
              <div className="max-h-40 overflow-y-auto rounded-lg border divide-y">
                {group.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.code}</div>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded font-medium",
                        player.status === "online"
                          ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
                          : "text-muted-foreground bg-muted"
                      )}
                    >
                      {player.status === "online" ? "Online" : player.status === "offline" ? "Offline" : "Nunca"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!group.players || group.players.length === 0) && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Nenhum player associado a este grupo
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SchedulingPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ProgrammingGroup | undefined>()
  const [viewingGroup, setViewingGroup] = useState<ProgrammingGroup | undefined>()
  const [viewOpen, setViewOpen] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState<ProgrammingGroup | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: groups, isLoading } = useQuery({
    queryKey: ["programming-groups"],
    queryFn: api.getProgrammingGroups,
  })

  const groupList = groups ?? []

  function handleNew() {
    setEditingGroup(undefined)
    setFormOpen(true)
  }

  function handleEdit(group: ProgrammingGroup) {
    setEditingGroup(group)
    setFormOpen(true)
  }

  function handleView(group: ProgrammingGroup) {
    setViewingGroup(group)
    setViewOpen(true)
  }

  function confirmDelete(group: ProgrammingGroup) {
    setDeletingGroup(group)
    setDeleteOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programação</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os horários de funcionamento dos grupos de players
          </p>
        </div>
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programação</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os horários de funcionamento dos grupos de players
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 size-4" />
          Novo Grupo de Programação
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Grupo</TableHead>
              <TableHead>Players</TableHead>
              <TableHead>Dias de Funcionamento</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Calendar className="size-10 opacity-50" />
                    <div>
                      <p className="font-medium">Nenhum grupo de programação</p>
                      <p className="text-sm">
                        Crie grupos para programar horários de funcionamento
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleNew}>
                      <Plus className="mr-1 size-3" />
                      Criar primeiro grupo
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              groupList.map((group: ProgrammingGroup) => {
                const days = [...new Set(group.timeSlots.map((s) => s.dayOfWeek))].sort()
                const startTime = group.timeSlots[0]?.startTime ?? "—"
                const endTime = group.timeSlots[0]?.endTime ?? "—"
                const status = getStatusLabel(group)

                return (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span>{group.playerCount ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDays(days)}
                    </TableCell>
                    <TableCell>
                      {group.timeSlots.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className="size-3.5 text-muted-foreground" />
                          <span>
                            {startTime} — {endTime}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none">
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(group)}>
                            <Eye className="mr-2 size-4" />
                            Visualizar
                          </DropdownMenuItem>
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
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ProgrammingGroupFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        group={editingGroup}
      />

      {deletingGroup && (
        <DeleteProgrammingGroupDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) setDeletingGroup(undefined)
          }}
          groupId={deletingGroup.id}
          groupName={deletingGroup.name}
        />
      )}

      <ViewProgrammingGroupDialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewingGroup(undefined)
        }}
        group={viewingGroup}
      />
    </div>
  )
}
