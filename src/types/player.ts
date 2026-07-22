export type PlayerStatus = "online" | "offline" | "never"

export interface Player {
  id: string
  name: string
  code: string
  status: PlayerStatus
  group: string
  location: string
  lastSeen: string
  storageUsed: number
  totalStorage: number
  version: string
  ip: string
  createdAt: string
  playlistId?: string
  layoutId?: string
  electronVersion?: string
  publicIp?: string
  storageFree?: number
}
