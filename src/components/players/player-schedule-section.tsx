"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScheduleFormDialog } from "@/components/schedule/schedule-form-dialog"
import { api } from "@/lib/api-client"
import { Clock, Plus, Pencil, Power, PowerOff, CalendarClock, Trash2 } from "lucide-react"
import type { OperatingSchedule } from "@/types/schedule"
import { DAY_LABELS } from "@/types/schedule"
import type { Player } from "@/types/player"
import { toast } from "sonner"

interface PlayerScheduleSectionProps {
  player: Player
}

export function PlayerScheduleSection({ player }: PlayerScheduleSectionProps) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<OperatingSchedule | undefined>()
  const [removing, setRemoving] = useState(false)

  const { data: playerSchedules = [] } = useQuery({
    queryKey: ["schedules", "player", player.id],
    queryFn: () => api.getSchedulesByTarget("player", player.id),
  })

  const schedule = playerSchedules[0]

  function handleEdit() {
    setEditingSchedule(schedule)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditingSchedule(undefined)
    setDialogOpen(true)
  }

  async function handleRemove() {
    if (!schedule) return
    setRemoving(true)
    try {
      await api.deleteSchedule(schedule.id)
      queryClient.removeQueries({ queryKey: ["schedules", "player", player.id] })
      queryClient.invalidateQueries({ queryKey: ["schedules"] })
      toast.success("Programação removida. Player opera 24h por dia, 7 dias por semana.")
    } catch {
      toast.error("Erro ao remover programação")
    } finally {
      setRemoving(false)
    }
  }

  const daysWithSlots = schedule
    ? [...new Set(schedule.timeSlots.map((s) => s.dayOfWeek))].sort()
    : []

  function formatDaySlots(day: number) {
    const slots = schedule!.timeSlots.filter((s) => s.dayOfWeek === day)
    if (slots.length === 0) return null
    return slots.map((s) => `${s.startTime} - ${s.endTime}`)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarClock className="size-4" />
            Programação de Funcionamento
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={schedule ? handleEdit : handleCreate}
            >
              {schedule ? (
                <>
                  <Pencil className="mr-1 size-3" />
                  Editar
                </>
              ) : (
                <>
                  <Plus className="mr-1 size-3" />
                  Adicionar
                </>
              )}
            </Button>
            {schedule && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={handleRemove}
                disabled={removing}
              >
                <Trash2 className="mr-1 size-3" />
                Remover
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {schedule ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{schedule.name}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      schedule.enabled
                        ? "border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {schedule.enabled ? (
                      <>
                        <Power className="mr-0.5 size-2.5" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <PowerOff className="mr-0.5 size-2.5" />
                        Inativo
                      </>
                    )}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {daysWithSlots.length} dia(s) · {schedule.timeSlots.length} faixa(s)
                </span>
              </div>

              <div className="space-y-1">
                {daysWithSlots.map((day) => {
                  const ranges = formatDaySlots(day)
                  if (!ranges) return null
                  return (
                    <div
                      key={day}
                      className="flex items-start gap-3 rounded-lg bg-primary/5 px-3 py-2"
                    >
                      <span className="min-w-[80px] text-sm font-medium">
                        {DAY_LABELS[day]}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ranges.map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            <Clock className="size-3" />
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Clock className="size-8 mb-2 opacity-30" />
              <p className="text-sm font-medium text-foreground/80">24h por dia, 7 dias por semana</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Clique em &ldquo;Adicionar&rdquo; para definir horários de funcionamento
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingSchedule(undefined)
        }}
        schedule={editingSchedule}
        type="player"
        targetId={player.id}
        targetName={player.name}
        playerGroup={player.group}
      />
    </>
  )
}
