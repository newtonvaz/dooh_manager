export interface TimeSlot {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface OperatingSchedule {
  id: string
  name: string
  type: "player" | "group"
  targetId: string
  targetName: string
  timeSlots: TimeSlot[]
  enabled: boolean
  createdAt: string
  updatedAt: string
  replicatedFromGroup?: string
}

export const DAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
]

export const DAY_LABELS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
