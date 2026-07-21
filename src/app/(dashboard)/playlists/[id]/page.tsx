"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ArrowLeft, Clock, Film, ListMusic, Play, LayoutList, Grid3X3, FileImage, Video, Globe, ListVideo } from "lucide-react"
import { api } from "@/lib/api-client"
import type { Playlist, PlaylistItem } from "@/types/content"
import { cn } from "@/lib/utils"

type ViewMode = "list" | "grid"

const typeIcons = { image: FileImage, video: Video, web: Globe }
const typeLabels = { image: "Imagem", video: "Vídeo", web: "URL" }

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatTotal(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

function isExpired(item: PlaylistItem): boolean {
  if (!item.timeSlots || item.timeSlots.length === 0) return false
  const now = new Date()
  return item.timeSlots.every((s) => new Date(s.endDate) < now)
}

function getRandomColor(name: string): string {
  const colors = [
    "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
    "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    "bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [view, setView] = useState<ViewMode>("list")

  const { data: playlists = [] } = useQuery({
    queryKey: ["playlists"],
    queryFn: api.getPlaylists,
  })

  const playlist = playlists.find((p: Playlist) => p.id === id) as Playlist | undefined

  const { data: contentItems = [] } = useQuery({
    queryKey: ["content"],
    queryFn: api.getContent,
  })

  function getItemName(item: PlaylistItem): string {
    if (item.type === "playlist") {
      const sub = playlists.find((p: Playlist) => p.id === item.playlistId)
      return sub?.name ?? "Subplaylist"
    }
    if (item.type === "url") return item.name || item.url || "URL"
    const c = contentItems.find((c: { id: string }) => c.id === item.contentId)
    return c?.name ?? item.contentId ?? "Conteúdo"
  }

  function getItemType(item: PlaylistItem): string {
    if (item.type === "playlist") return "playlist"
    if (item.type === "url") return "web"
    const c = contentItems.find((c: { id: string }) => c.id === item.contentId)
    return c?.type ?? "image"
  }

  if (!playlist) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/playlists")}>
          <ArrowLeft className="mr-1 size-4" />
          Voltar
        </Button>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p>Playlist não encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/playlists")}>
          <ArrowLeft className="mr-1 size-4" />
          Voltar
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{playlist.name}</h1>
            <Badge variant="secondary" className="text-xs">
              <ListMusic className="mr-1 size-3" />
              {playlist.items.length} {playlist.items.length === 1 ? "item" : "itens"}
            </Badge>
          </div>
          {playlist.description && (
            <p className="text-sm text-muted-foreground">{playlist.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatTotal(playlist.totalDuration)}
            </span>
            <span>Categoria: {playlist.category}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Conteúdo da Playlist</h2>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ViewMode)}>
            <ToggleGroupItem value="list" aria-label="Visualização em lista" size="sm">
              <LayoutList className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Visualização em grade" size="sm">
              <Grid3X3 className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {playlist.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Film className="size-8 mb-2 opacity-30" />
            <p className="text-sm">Nenhum conteúdo nesta playlist</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
            {playlist.items.map((item, index) => {
              const name = getItemName(item)
              const type = getItemType(item)
              const Icon = type === "playlist" ? ListVideo : typeIcons[type as keyof typeof typeIcons] || FileImage
              const color = type === "playlist"
                ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                : getRandomColor(name)
              return (
                <div
                  key={index}
                  title={name}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors ${
                    isExpired(item)
                      ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                      : "bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className={cn("flex size-10 items-center justify-center rounded-lg", color)}>
                    <Icon className="size-5" />
                  </div>
                  <span className="text-[10px] font-medium text-center w-full truncate">
                    {isExpired(item) && "⚠️ "}{name}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-1.5">
            {playlist.items.map((item, index) => {
              const name = getItemName(item)
              const type = getItemType(item)
              if (type === "playlist") {
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-medium text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                      {index + 1}
                    </span>
                    <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-1.5">
                      <ListMusic className="size-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">Subplaylist</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 border-violet-200 text-violet-600 dark:border-violet-800 dark:text-violet-400">
                      <ListMusic className="mr-0.5 size-2.5" />
                      Playlist
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
                      {formatDuration(item.duration)}
                    </span>
                  </div>
                )
              }
              const Icon = typeIcons[type as keyof typeof typeIcons] || FileImage
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </span>
                  <div className="rounded-lg bg-muted p-1.5">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{typeLabels[type as keyof typeof typeLabels] || type}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400">
                    <Play className="mr-0.5 size-2.5" />
                    Conteúdo
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
                    {formatDuration(item.duration)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
