"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { WithTooltip } from "@/components/ui/tooltip"
import { Plus, Trash2, Calendar, FileImage, Video, Globe } from "lucide-react"
import type { MediaContent, ContentTimeSlot } from "@/types/content"

function toLocalDatetimeString(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const typeIcons = { image: FileImage, video: Video, web: Globe }
const typeLabels = { image: "Imagem", video: "Vídeo", web: "URL" }

interface ContentScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedContent: MediaContent[]
  initialTimeSlots?: ContentTimeSlot[]
  isEditing?: boolean
  onConfirm: (timeSlots: ContentTimeSlot[]) => void
}

export function ContentScheduleDialog({
  open,
  onOpenChange,
  selectedContent,
  initialTimeSlots,
  isEditing = false,
  onConfirm,
}: ContentScheduleDialogProps) {
  const [timeSlots, setTimeSlots] = useState<ContentTimeSlot[]>([])

  useEffect(() => {
    if (open) {
      setTimeSlots(
        initialTimeSlots && initialTimeSlots.length > 0
          ? initialTimeSlots.map((s) => ({
              startDate: toLocalDatetimeString(s.startDate),
              endDate: toLocalDatetimeString(s.endDate),
            }))
          : [{ startDate: "", endDate: "" }]
      )
    }
  }, [open, initialTimeSlots])

  function handleAddSlot() {
    setTimeSlots((prev) => [...prev, { startDate: "", endDate: "" }])
  }

  function handleRemoveSlot(index: number) {
    setTimeSlots((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSlotChange(
    index: number,
    field: "startDate" | "endDate",
    value: string
  ) {
    setTimeSlots((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      )
    )
  }

  function handleConfirm() {
    const filled = timeSlots.filter((s) => s.startDate && s.endDate)
    onConfirm(filled.length > 0 ? filled.map((s) => ({
      startDate: new Date(s.startDate).toISOString(),
      endDate: new Date(s.endDate).toISOString(),
    })) : [])
    onOpenChange(false)
  }

  function handleSkip() {
    onConfirm(isEditing ? initialTimeSlots ?? [] : [])
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setTimeSlots([{ startDate: "", endDate: "" }])
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Agendamento" : "Agendar Conteúdo"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Altere as datas e horários de exibição deste conteúdo" : "Defina as datas e horários em que este conteúdo será exibido"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Conteúdo selecionado ({selectedContent.length})
            </p>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
              {selectedContent.map((c) => {
                const Icon = typeIcons[c.type]
                return (
                  <div key={c.id} className="flex items-center gap-2 text-sm">
                    <Icon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {typeLabels[c.type]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Períodos de Exibição
              </Label>
              <WithTooltip content="Adicionar período"><Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSlot}
              >
                <Plus className="size-3 mr-1" />
                Adicionar Período
              </Button></WithTooltip>
            </div>

            {timeSlots.map((slot, idx) => (
              <div
                key={idx}
                className="rounded-lg border p-3 space-y-3 relative"
              >
                {timeSlots.length > 1 && (
                  <WithTooltip content="Remover período"><Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 size-6 text-destructive"
                    onClick={() => handleRemoveSlot(idx)}
                  >
                    <Trash2 className="size-3" />
                  </Button></WithTooltip>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data Início</Label>
                    <Input
                      type="datetime-local"
                      value={slot.startDate}
                      onChange={(e) =>
                        handleSlotChange(idx, "startDate", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data Fim</Label>
                    <Input
                      type="datetime-local"
                      value={slot.endDate}
                      onChange={(e) =>
                        handleSlotChange(idx, "endDate", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <WithTooltip content="Cancelar"><Button type="button" variant="outline" onClick={handleSkip}>
            {isEditing ? "Cancelar" : "Sem agendamento"}
          </Button></WithTooltip>
          <WithTooltip content="Confirmar"><Button type="button" onClick={handleConfirm}>
            {isEditing ? "Salvar Agendamento" : "Adicionar com Agendamento"}
          </Button></WithTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
