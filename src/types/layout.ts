export type LayoutAreaType = "content" | "app"

export interface LayoutAreaConfig {
  playlistId?: string
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
