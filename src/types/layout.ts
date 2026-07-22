export type LayoutAreaType = "content" | "app"

export interface Layout {
  id: string
  name: string
  description: string
  canvasWidth: number
  canvasHeight: number
  createdAt: string
  updatedAt: string
  zones?: LayoutZone[]
}

export interface LayoutZone {
  id: string
  x: number
  y: number
  width: number
  height: number
  contentId?: string
  type?: LayoutAreaType
  zIndex?: number
  enabled?: boolean
  name?: string
  config?: LayoutAreaConfig
  playlistId?: string
}

export interface LayoutAreaConfig {
  playerId?: string
  appId?: string
  appConfig?: Record<string, unknown>
}

export interface LayoutArea {
  id: string
  name: string
  type: LayoutAreaType
  layoutId: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  enabled: boolean
  config: LayoutAreaConfig
  contentId?: string
  createdAt: string
  updatedAt: string
}

export interface AppDefinition {
  id: string
  name: string
  description: string
  icon: string
  url: string
  type: "system" | "external"
}
