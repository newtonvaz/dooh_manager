"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  Search,
  ToggleRight,
  ToggleLeft,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQueryClient } from "@tanstack/react-query"
import type { ProgrammingGroup } from "@/types/programming-group"
import type { TimeSlot } from "@/types/schedule"
import { DAY_LABELS } from "@/types/schedule"
import { cn } from "@/lib/utils"

interface ProgrammingGroupFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: ProgrammingGroup
}

const DAYS = DAY_LABELS.map((label, day) => ({ day, label }))

export function ProgrammingGroupFormDialog({
  open,
  onOpenChange,
  group,
}: ProgrammingGroupFormDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(group?.name ?? "")
  const [enabled, setEnabled] = useState(group?.enabled ?? true)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("18:00")
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: api.getPlayers,
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      setName(group?.name ?? "")
      setEnabled(group?.enabled ?? true)
      setSelectedPlayerIds(new Set(group?.players?.map((p) => p.id) ?? []))
      setSearch("")

      if (group && group.timeSlots.length > 0) {
        const days = [...new Set(group.timeSlots.map((s) => s.dayOfWeek))]
        setSelectedDays(days.sort())
        setStartTime(group.timeSlots[0].startTime)
        setEndTime(group.timeSlots[0].endTime)
      } else {
        setSelectedDays([])
        setStartTime("08:00")
        setEndTime("18:00")
      }
    }
  }, [open, group])

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return players
    const q = search.toLowerCase()
    return players.filter(
      (p: any) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
    )
  }, [players, search])

  function togglePlayer(id: string) {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  function buildTimeSlots(): TimeSlot[] {
    return selectedDays.map((day) => ({
      dayOfWeek: day,
      startTime,
      endTime,
    }))
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Informe um nome para o grupo")
      return
    }
    if (selectedPlayerIds.size === 0) {
      toast.error("Selecione pelo menos um player")
      return
    }
    if (selectedDays.length === 0) {
      toast.error("Selecione pelo menos um dia da semana")
      return
    }
    if (!startTime || !endTime) {
      toast.error("Informe o horário de início e término")
      return
    }

    setSaving(true)
    try {
      const data = {
        name: name.trim(),
        enabled,
        timeSlots: buildTimeSlots(),
        playerIds: Array.from(selectedPlayerIds),
      }

      if (group) {
        await api.updateProgrammingGroup(group.id, data)
        toast.success("Grupo de programação atualizado!")
      } else {
        await api.createProgrammingGroup(data)
        toast.success("Grupo de programação criado!")
      }

      queryClient.invalidateQueries({ queryKey: ["programming-groups"] })
      onOpenChange(false)
    } catch {
      toast.error("Erro ao salvar grupo de programação")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {group ? "Editar Grupo de Programação" : "Novo Grupo de Programação"}
          </DialogTitle>
          <DialogDescription>
            {group
              ? "Altere as configurações do grupo de programação"
              : "Crie um grupo de players com horários de funcionamento programados"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Nome do Grupo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Shopping - Noturno"
              />
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors shrink-0",
                enabled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-muted bg-muted/30 text-muted-foreground"
              )}
            >
              {enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
              {enabled ? "Ativo" : "Inativo"}
            </button>
          </div>

          <div className="space-y-3">
            <Label>Selecionar Players</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar players por nome, código ou local..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
              {filteredPlayers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhum player encontrado
                </div>
              ) : (
                filteredPlayers.map((player: any) => (
                  <label
                    key={player.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedPlayerIds.has(player.id)}
                      onCheckedChange={() => togglePlayer(player.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{player.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {player.code} {player.location ? `- ${player.location}` : ""}
                      </div>
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
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPlayerIds.size} player(s) selecionado(s)
            </p>
          </div>

          <div className="space-y-3">
            <Label>Dias da Semana</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map(({ day, label }) => {
                const isSelected = selectedDays.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-muted bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Horário de Funcionamento</Label>
            <div className="flex items-center gap-2">
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-8 w-[130px] text-xs"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-8 w-[130px] text-xs"
              />
            </div>
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
