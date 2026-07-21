import type { TimeSlot } from "./schedule"
import type { Player } from "./player"

export interface ProgrammingGroup {
  id: string
  name: string
  enabled: boolean
  timeSlots: TimeSlot[]
  createdAt: string
  updatedAt: string
  playerCount?: number
  players?: Player[]
}
