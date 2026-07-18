"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Film, ListMusic, Play } from "lucide-react"
import { api } from "@/lib/api-client"
import type { Playlist, PlaylistItem } from "@/types/content"
import { cn } from "@/lib/utils"

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

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

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
    const c = contentItems.find((c: { id: string }) => c.id === item.contentId)
    return c?.name ?? item.contentId ?? "Conteúdo"
  }

  function getItemDescription(item: PlaylistItem): string {
    if (item.type === "playlist") return "Subplaylist"
    const c = contentItems.find((c: { id: string }) => c.id === item.contentId)
    return c?.type ?? ""
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
        <h2 className="text-sm font-medium">Conteúdo da Playlist</h2>
        {playlist.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Film className="size-8 mb-2 opacity-30" />
            <p className="text-sm">Nenhum conteúdo nesta playlist</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {playlist.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getItemName(item)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{getItemDescription(item)}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] shrink-0",
                    item.type === "playlist"
                      ? "border-violet-200 text-violet-600 dark:border-violet-800 dark:text-violet-400"
                      : "border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400"
                  )}
                >
                  {item.type === "playlist" ? (
                    <ListMusic className="mr-0.5 size-2.5" />
                  ) : (
                    <Play className="mr-0.5 size-2.5" />
                  )}
                  {item.type === "playlist" ? "Playlist" : "Conteúdo"}
                </Badge>
                <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
                  {formatDuration(item.duration)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
