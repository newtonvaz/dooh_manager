"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Loader2, Plus, Trash2, Clock, ToggleLeft, ToggleRight, Users } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { useQueryClient } from "@tanstack/react-query"
import type { OperatingSchedule, TimeSlot } from "@/types/schedule"
import { DAY_LABELS } from "@/types/schedule"
import { cn } from "@/lib/utils"

interface ScheduleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: OperatingSchedule
  type: "player" | "group"
  targetId: string
  targetName: string
  playerGroup?: string
}

interface EntrySlot {
  startTime: string
  endTime: string
}

interface ScheduleEntry {
  id: string
  days: number[]
  slots: EntrySlot[]
}

let entryCounter = 0
function newEntryId() {
  return `entry-${++entryCounter}`
}

const DAYS = DAY_LABELS.map((label, day) => ({ day, label }))

function timeSlotsToEntries(slots: TimeSlot[]): ScheduleEntry[] {
  if (slots.length === 0) return []
  const grouped = new Map<number, EntrySlot[]>()
  for (const s of slots) {
    if (!grouped.has(s.dayOfWeek)) grouped.set(s.dayOfWeek, [])
    grouped.get(s.dayOfWeek)!.push({ startTime: s.startTime, endTime: s.endTime })
  }

  const daySlotKeys = new Map<string, number[]>()
  for (const [day, daySlots] of grouped) {
    const key = JSON.stringify(daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime)))
    if (!daySlotKeys.has(key)) daySlotKeys.set(key, [])
    daySlotKeys.get(key)!.push(day)
  }

  const entries: ScheduleEntry[] = []
  for (const [, days] of daySlotKeys) {
    const key = JSON.stringify(grouped.get(days[0])!.sort((a, b) => a.startTime.localeCompare(b.startTime)))
    const slots = JSON.parse(key) as EntrySlot[]
    entries.push({ id: newEntryId(), days: days.sort(), slots })
  }
  return entries
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  schedule,
  type,
  targetId,
  targetName,
  playerGroup,
}: ScheduleFormDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(schedule?.name ?? `Horários - ${targetName}`)
  const [enabled, setEnabled] = useState(schedule?.enabled ?? true)
  const [entries, setEntries] = useState<ScheduleEntry[]>(
    () => schedule ? timeSlotsToEntries(schedule.timeSlots) : []
  )
  const [saving, setSaving] = useState(false)
  const [replicateToGroup, setReplicateToGroup] = useState(!!schedule?.replicatedFromGroup)
  const [selectedReplicateGroup, setSelectedReplicateGroup] = useState(schedule?.replicatedFromGroup ?? playerGroup ?? "")

  useEffect(() => {
    setName(schedule?.name ?? `Horários - ${targetName}`)
    setEnabled(schedule?.enabled ?? true)
    setEntries(schedule ? timeSlotsToEntries(schedule.timeSlots) : [])
    setReplicateToGroup(!!schedule?.replicatedFromGroup)
    setSelectedReplicateGroup(schedule?.replicatedFromGroup ?? playerGroup ?? "")
  }, [open, schedule, targetName, playerGroup])

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["players"],
    queryFn: api.getPlayers,
    enabled: open && (replicateToGroup || type === "group"),
  })

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: api.getGroups,
    enabled: open,
  })

  const { data: groupSchedules = [] } = useQuery({
    queryKey: ["schedules", "group", targetName],
    queryFn: () => api.getSchedulesByTarget("group", targetName),
    enabled: open && type === "group",
  })

  function addEntry() {
    setEntries((prev) => [...prev, { id: newEntryId(), days: [], slots: [{ startTime: "08:00", endTime: "18:00" }] }])
  }

  function removeEntry(entryId: string) {
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
  }

  function toggleEntryDay(entryId: string, day: number) {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e
        const days = e.days.includes(day)
          ? e.days.filter((d) => d !== day)
          : [...e.days, day].sort()
        return { ...e, days }
      })
    )
  }

  function addSlotToEntry(entryId: string) {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, slots: [...e.slots, { startTime: "08:00", endTime: "18:00" }] }
          : e
      )
    )
  }

  function removeSlotFromEntry(entryId: string, slotIndex: number) {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, slots: e.slots.filter((_, i) => i !== slotIndex) }
          : e
      )
    )
  }

  function updateEntrySlot(entryId: string, slotIndex: number, field: "startTime" | "endTime", value: string) {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              slots: e.slots.map((s, i) => (i === slotIndex ? { ...s, [field]: value } : s)),
            }
          : e
      )
    )
  }

  function buildTimeSlots(): TimeSlot[] {
    const result: TimeSlot[] = []
    for (const entry of entries) {
      for (const day of entry.days) {
        for (const slot of entry.slots) {
          if (slot.startTime && slot.endTime) {
            result.push({ dayOfWeek: day, startTime: slot.startTime, endTime: slot.endTime })
          }
        }
      }
    }
    return result
  }

  function buildData(
    saveType: "player" | "group",
    saveTargetId: string,
    saveTargetName: string,
    timeSlots: TimeSlot[]
  ) {
    return {
      name: name.trim(),
      type: saveType,
      targetId: saveTargetId,
      targetName: saveTargetName,
      timeSlots,
      enabled,
      ...(saveType === "player" && selectedReplicateGroup && replicateToGroup
        ? { replicatedFromGroup: selectedReplicateGroup }
        : {}),
    }
  }

  async function saveForTarget(
    saveType: "player" | "group",
    saveTargetId: string,
    saveTargetName: string,
    timeSlots: TimeSlot[]
  ) {
    const data = buildData(saveType, saveTargetId, saveTargetName, timeSlots)

    if (schedule && saveTargetId === targetId) {
      return api.updateSchedule(schedule.id, data)
    }
    return api.createSchedule(data)
  }

  async function handleSave() {
    const timeSlots = buildTimeSlots()
    const hasNoSlots = timeSlots.length === 0

    if (!name.trim() && !hasNoSlots) {
      toast.error("Informe um nome para a programação")
      return
    }

    setSaving(true)
    try {
      if (hasNoSlots) {
        if (schedule) {
          await api.deleteSchedule(schedule.id)
          queryClient.removeQueries({ queryKey: ["schedules", "player", targetId] })
          queryClient.invalidateQueries({ queryKey: ["schedules"] })
          toast.success("Programação removida. Player opera 24h por dia.")
        }
        onOpenChange(false)
        return
      }

      if (type === "player" && replicateToGroup && selectedReplicateGroup) {
        const groupPlayers = allPlayers.filter(
          (p: { id: string; group: string }) => p.group === selectedReplicateGroup
        )
        let saved = 0
        const targets = new Set<string>()
        targets.add(targetId)
        groupPlayers.forEach((p) => targets.add(p.id))
        for (const pid of targets) {
          const p = groupPlayers.find((g) => g.id === pid)
          const pName = pid === targetId ? targetName : (p?.name ?? targetName)
          await saveForTarget("player", pid, pName, timeSlots)
          saved++
        }
        toast.success(`Programação aplicada a ${saved} player(s) do grupo "${selectedReplicateGroup}"!`)
      } else if (type === "player") {
        await saveForTarget("player", targetId, targetName, timeSlots)
        toast.success(schedule ? "Programação atualizada!" : "Programação criada!")
      } else if (type === "group") {
        const existing = groupSchedules[0]
        const groupData = {
          name: name.trim(),
          type: "group" as const,
          targetId,
          targetName,
          timeSlots,
          enabled,
        }
        if (existing) {
          await api.updateSchedule(existing.id, groupData)
        } else {
          await api.createSchedule(groupData)
        }

        const groupPlayers = allPlayers.filter(
          (p: { id: string; group: string }) => p.group === targetName
        )
        let replicated = 0
        for (const p of groupPlayers) {
          const playerData = {
            name: name.trim(),
            type: "player" as const,
            targetId: p.id,
            targetName: p.name,
            timeSlots,
            enabled,
            replicatedFromGroup: targetName,
          }
          const existingPlayer = await api.getSchedulesByTarget("player", p.id)
          if (existingPlayer[0]) {
            await api.updateSchedule(existingPlayer[0].id, playerData)
          } else {
            await api.createSchedule(playerData)
          }
          replicated++
        }
        toast.success(`Programação do grupo salva e replicada para ${replicated} player(s)!`)
      }

      queryClient.invalidateQueries({ queryKey: ["schedules"] })
      onOpenChange(false)
    } catch {
      toast.error("Erro ao salvar programação")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Editar Programação" : "Programação"}
          </DialogTitle>
          <DialogDescription>
            {type === "player"
              ? `Defina os horários de funcionamento para ${targetName}`
              : `Defina os horários de funcionamento para o grupo ${targetName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Horário Comercial"
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

          {entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {entry.days.length > 0
                    ? entry.days.map((d) => DAY_LABELS[d].slice(0, 3)).join(", ")
                    : "Selecione os dias abaixo"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-destructive"
                  onClick={() => removeEntry(entry.id)}
                >
                  <Trash2 className="mr-1 size-3" />
                  Remover
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {DAYS.map(({ day, label }) => {
                  const isSelected = entry.days.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleEntryDay(entry.id, day)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
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

              <div className="space-y-1.5">
                {entry.slots.map((slot, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <Clock className="size-3 shrink-0 text-muted-foreground" />
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateEntrySlot(entry.id, si, "startTime", e.target.value)}
                      className="h-8 w-[110px] text-xs"
                    />
                    <span className="text-xs text-muted-foreground">—</span>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateEntrySlot(entry.id, si, "endTime", e.target.value)}
                      className="h-8 w-[110px] text-xs"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-destructive"
                      onClick={() => removeSlotFromEntry(entry.id, si)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => addSlotToEntry(entry.id)}
              >
                <Plus className="mr-1 size-3" />
                Adicionar horário
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" className="h-9 text-xs w-full" onClick={addEntry}>
            <Plus className="mr-1 size-3" />
            Adicionar
          </Button>

          {type === "player" && groups.length > 0 && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="replicateToGroup"
                  checked={replicateToGroup}
                  onCheckedChange={(v) => setReplicateToGroup(v === true)}
                />
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="replicateToGroup" className="text-sm font-medium cursor-pointer">
                    <Users className="mr-1 size-3 inline" />
                    Aplicar a todos os players de um grupo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Cria a mesma programação para todos os players do grupo selecionado
                  </p>
                </div>
              </div>
              {replicateToGroup && (
                <div className="pl-7">
                  <Select
                    value={selectedReplicateGroup}
                    onValueChange={(v) => {
                      if (v) setSelectedReplicateGroup(v)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((g: { id: string; name: string }) => (
                        <SelectItem key={g.id} value={g.name}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <div>
              {schedule && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive h-8 text-xs"
                  onClick={async () => {
                    setSaving(true)
                    try {
                      await api.deleteSchedule(schedule.id)
                      queryClient.removeQueries({ queryKey: ["schedules", "player", targetId] })
                      queryClient.invalidateQueries({ queryKey: ["schedules"] })
                      onOpenChange(false)
                      toast.success("Programação removida. Player opera 24h por dia.")
                    } catch {
                      toast.error("Erro ao remover programação")
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                >
                  <Trash2 className="mr-1 size-3" />
                  Remover programação
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
