"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { WithTooltip } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlayerStatusBadge } from "./player-status-badge"
import { PlayerFormDialog } from "./player-form-dialog"
import { DeletePlayerDialog } from "./delete-player-dialog"
import { BulkDeleteDialog } from "./bulk-delete-dialog"
import { MonitorDisplay } from "./monitor-display"
import { ScheduleFormDialog } from "@/components/schedule/schedule-form-dialog"

import {
  Pencil,
  Trash2,
  Eye,
  Trash,
  X,
  CheckSquare,
  MapPin,
  Monitor,
  Clock,
  CalendarClock,
  ListMusic,
} from "lucide-react"
import type { Player, PlayerStatus } from "@/types/player"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

interface PlayersTableProps {
  players: Player[]
  groups: string[]
  viewMode: "grid" | "list"
}

export function PlayersTable({ players, groups, viewMode }: PlayersTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [groupFilter, setGroupFilter] = useState("Todos os grupos")
  const [statusFilter, setStatusFilter] = useState<PlayerStatus | "Todos os status">("Todos os status")
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>()
  const [editOpen, setEditOpen] = useState(false)
  const [deletingPlayer, setDeletingPlayer] = useState<Player | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<"selected" | "all">("selected")

  const [schedulingPlayer, setSchedulingPlayer] = useState<Player | undefined>()
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const { data: existingPlayerSchedule } = useQuery({
    queryKey: ["schedules", "player", schedulingPlayer?.id],
    queryFn: () => api.getSchedulesByTarget("player", schedulingPlayer!.id),
    enabled: scheduleOpen && !!schedulingPlayer,
    select: (schedules) => schedules[0],
  })

  const [scheduleGroupOpen, setScheduleGroupOpen] = useState(false)
  const [scheduleGroupName, setScheduleGroupName] = useState("")

  const { data: allPlaylists = [] } = useQuery({
    queryKey: ["playlists"],
    queryFn: api.getPlaylists,
  })

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
      const matchGroup = groupFilter === "Todos os grupos" || p.group === groupFilter
      const matchStatus = statusFilter === "Todos os status" || p.status === statusFilter
      return matchSearch && matchGroup && matchStatus
    })
  }, [players, search, groupFilter, statusFilter])

  const filteredIds = useMemo(() => filtered.map((p) => p.id), [filtered])
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id))

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
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredIds))
    }
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  function openBulk(mode: "selected" | "all") {
    setBulkMode(mode)
    setBulkOpen(true)
  }

  function handleSchedulePlayer(player: Player) {
    setSchedulingPlayer(player)
    setScheduleOpen(true)
  }

  function handleScheduleGroup() {
    const group = groupFilter !== "Todos os grupos" ? groupFilter : "Todos"
    setScheduleGroupName(group)
    setScheduleGroupOpen(true)
  }

  const showCheckboxes = selectionMode || selectedIds.size > 0
  const isGroupFilterActive = groupFilter !== "Todos os grupos"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por nome ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        <Select value={groupFilter} onValueChange={(v) => v && setGroupFilter(v)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as PlayerStatus | "Todos os status")}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos os status">Todos os status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="never">Nunca acessado</SelectItem>
          </SelectContent>
        </Select>

        {isGroupFilterActive && (
          <WithTooltip content="Agendar horário para grupo">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={handleScheduleGroup}
            >
              <CalendarClock className="mr-1 size-3" />
              Horário do Grupo
            </Button>
          </WithTooltip>
        )}
      </div>

      {showCheckboxes && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{selectedIds.size}</span>
            <span className="text-muted-foreground">de {filtered.length} selecionado(s)</span>
            <WithTooltip content="Cancelar seleção">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={exitSelectionMode}>
                <X className="mr-1 size-3" />
                Cancelar
              </Button>
            </WithTooltip>
          </div>
          <div className="flex items-center gap-2">
            <WithTooltip content="Remover players selecionados">
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
            <WithTooltip content="Remover todos os players">
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

      {viewMode === "list" ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {showCheckboxes && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todos"
                      disabled={filtered.length === 0}
                    />
                  </TableHead>
                )}
                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>Nome</span>
                    {!showCheckboxes && (
                      <WithTooltip content="Selecionar players">
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
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Playlist</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showCheckboxes ? 8 : 7} className="text-center text-muted-foreground py-8">
                    Nenhum player encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((player) => {
                  const playlist = allPlaylists.find((p: { id: string }) => p.id === player.playlistId)
                  const isScheduling = scheduleOpen && schedulingPlayer?.id === player.id
                  return (
                    <TableRow
                      key={player.id}
                      data-state={selectedIds.has(player.id) ? "selected" : undefined}
                      className={isScheduling ? "opacity-40 pointer-events-none" : ""}
                    >
                      {showCheckboxes && (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(player.id)}
                            onCheckedChange={() => toggleSelect(player.id)}
                            aria-label={`Selecionar ${player.name}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        <WithTooltip content="Abrir detalhes do player">
                          <button
                            onClick={() => router.push(`/players/${player.id}`)}
                            className="text-left hover:underline cursor-pointer"
                          >
                            {player.name}
                          </button>
                        </WithTooltip>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{player.code}</TableCell>
                      <TableCell>
                        <PlayerStatusBadge status={player.status} />
                      </TableCell>
                      <TableCell>{player.group}</TableCell>
                      <TableCell className="text-muted-foreground">{player.location}</TableCell>
                      <TableCell className="text-xs">
                        {playlist ? (
                          <span className="flex items-center gap-1">
                            <ListMusic className="size-3" />
                            {playlist.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <WithTooltip content="Visualizar playlist">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => {
                                if (player.playlistId) {
                                  router.push(`/playlists/${player.playlistId}`)
                                } else {
                                  toast("Player sem playlist atribuída")
                                }
                              }}
                            >
                              <Eye className="size-4" />
                            </Button>
                          </WithTooltip>
                          <WithTooltip content="Agendar horário">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleSchedulePlayer(player)}
                              title="Horário de funcionamento"
                            >
                              <Clock className="size-4" />
                            </Button>
                          </WithTooltip>
                          <WithTooltip content="Editar player">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => {
                                setEditingPlayer(player)
                                setEditOpen(true)
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </WithTooltip>
                          <WithTooltip content="Excluir player">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive"
                              onClick={() => {
                                setDeletingPlayer(player)
                                setDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </WithTooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            {!showCheckboxes && (
              <WithTooltip content="Selecionar players">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-normal text-muted-foreground"
                  onClick={() => setSelectionMode(true)}
                >
                  <CheckSquare className="mr-1 size-3" />
                  Selecionar
                </Button>
              </WithTooltip>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Monitor className="mb-3 size-12 opacity-20" />
              <p className="text-sm">Nenhum player encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((player) => {
                const isSelected = selectedIds.has(player.id)
                const isScheduling = scheduleOpen && schedulingPlayer?.id === player.id
                const playlist = allPlaylists.find((p: { id: string }) => p.id === player.playlistId)
                return (
                  <Card
                    key={player.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={`group relative overflow-hidden border transition-all duration-200 hover:shadow-md ${
                      isSelected ? "ring-2 ring-primary border-primary" : ""
                    } ${isScheduling ? "opacity-40 pointer-events-none" : ""}`}
                  >
                    {(showCheckboxes) && (
                      <div className="absolute top-3 left-3 z-20">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(player.id)}
                          aria-label={`Selecionar ${player.name}`}
                        />
                      </div>
                    )}

                    <div className="absolute top-3 right-3 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <WithTooltip content="Visualizar playlist">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-7"
                          onClick={() => {
                            if (player.playlistId) {
                              router.push(`/playlists/${player.playlistId}`)
                            } else {
                              toast("Player sem playlist atribuída")
                            }
                          }}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </WithTooltip>
                      <WithTooltip content="Agendar horário">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-7"
                          onClick={() => handleSchedulePlayer(player)}
                          title="Horário de funcionamento"
                        >
                          <Clock className="size-3.5" />
                        </Button>
                      </WithTooltip>
                      <WithTooltip content="Editar player">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-7"
                          onClick={() => {
                            setEditingPlayer(player)
                            setEditOpen(true)
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </WithTooltip>
                      <WithTooltip content="Excluir player">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={() => {
                            setDeletingPlayer(player)
                            setDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </WithTooltip>
                    </div>

                    <div className="p-4 flex flex-col items-center text-center">
                      <div className="mb-3">
                        <MonitorDisplay player={player} size="sm" />
                      </div>
                      <WithTooltip content="Abrir detalhes do player">
                        <button
                          onClick={() => router.push(`/players/${player.id}`)}
                          className="text-sm font-medium leading-tight hover:underline cursor-pointer"
                        >
                          {player.name}
                        </button>
                      </WithTooltip>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{player.code}</p>
                      <div className="mt-2">
                        <PlayerStatusBadge status={player.status} />
                      </div>
                      {player.group && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <MapPin className="size-3" />
                          {player.group}
                        </p>
                      )}
                      {playlist && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <ListMusic className="size-3" />
                          {playlist.name}
                        </p>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {filtered.length === 0 && viewMode === "list" && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          Nenhum player encontrado
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filtered.length} de {players.length} players
        </p>
        {players.length > 0 && (
          <WithTooltip content="Remover todos os players">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive h-8 text-xs"
              onClick={() => openBulk("all")}
            >
              <Trash className="mr-1 size-3" />
              Remover Todos
            </Button>
          </WithTooltip>
        )}
      </div>

      {/* Player schedule dialog */}
      {schedulingPlayer && (
        <ScheduleFormDialog
          open={scheduleOpen}
          onOpenChange={(open) => {
            setScheduleOpen(open)
            if (!open) setSchedulingPlayer(undefined)
          }}
          schedule={existingPlayerSchedule}
          type="player"
          targetId={schedulingPlayer.id}
          targetName={schedulingPlayer.name}
          playerGroup={schedulingPlayer.group}
        />
      )}

      {/* Group schedule dialog */}
      <ScheduleFormDialog
        open={scheduleGroupOpen}
        onOpenChange={setScheduleGroupOpen}
        type="group"
        targetId={scheduleGroupName}
        targetName={scheduleGroupName}
      />

      <PlayerFormDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditingPlayer(undefined)
        }}
        player={editingPlayer}
      />

      {deletingPlayer && (
        <DeletePlayerDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) setDeletingPlayer(undefined)
          }}
          playerId={deletingPlayer.id}
          playerName={deletingPlayer.name}
        />
      )}

      <BulkDeleteDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        mode={bulkMode}
        selectedCount={selectedIds.size}
        selectedIds={Array.from(selectedIds)}
        totalCount={players.length}
      />
    </div>
  )
}
