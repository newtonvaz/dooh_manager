export type MediaType = "image" | "video" | "web"

export interface MediaContent {
  id: string
  name: string
  type: MediaType
  url: string
  thumbnailUrl?: string
  size: number
  duration?: number
  category: string
  tags: string[]
  createdAt: string
}

export interface PlaylistItem {
  type: "content" | "playlist"
  contentId?: string
  playlistId?: string
  duration: number
}

export interface Playlist {
  id: string
  name: string
  category: string
  description: string
  items: PlaylistItem[]
  totalDuration: number
  order: number
  createdAt: string
  updatedAt: string
  isSubplaylist?: boolean
}
