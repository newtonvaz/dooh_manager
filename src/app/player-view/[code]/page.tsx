"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { AreaContentPlayer } from "@/components/player/area-content-player"
import { AreaAppPlayer } from "@/components/player/area-app-player"
import { preloadAssets } from "@/services/asset-manager"
import type { PlaylistAsset } from "@/services/asset-manager"

interface PlaylistItem {
  type: string
  url: string
  name: string
  duration: number
  contentId: string
}

interface AreaData {
  id: string
  name: string
  type: "content" | "app"
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  config: Record<string, any>
  items: PlaylistItem[]
}

interface PlayerData {
  player: { id: string; name: string; code: string }
  areas: AreaData[]
  items?: PlaylistItem[]
}

export default function PlayerViewPage() {
  const params = useParams()
  const code = params.code as string
  const [data, setData] = useState<PlayerData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)
  const dataRef = useRef<PlayerData | null>(null)

  const fetchAndResolve = useCallback(async () => {
    try {
      const res = await fetch(`/api/player/${code}/playlist`)
      if (!res.ok) throw new Error("Falha ao carregar")
      const json: PlayerData = await res.json()

      const allAssets: PlaylistAsset[] = []
      if (json.items) {
        for (const item of json.items) {
          allAssets.push({ contentId: item.contentId, url: item.url, type: item.type, name: item.name })
        }
      }
      for (const area of json.areas) {
        for (const item of area.items) {
          allAssets.push({ contentId: item.contentId, url: item.url, type: item.type, name: item.name })
        }
      }

      if (allAssets.length > 0) {
        preloadAssets(allAssets).then((results) => {
          const map = new Map(results.map((r) => [r.contentId, r.localUrl]))

          if (json.items) {
            for (const item of json.items) {
              const local = map.get(item.contentId)
              if (local) item.url = local
            }
          }
          for (const area of json.areas) {
            for (const item of area.items) {
              const local = map.get(item.contentId)
              if (local) item.url = local
            }
          }

          if (mountedRef.current) {
            setData({ ...json })
          }
        })
      }

      if (mountedRef.current) {
        setData(json)
        dataRef.current = json
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) setError(String(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [code])

  useEffect(() => {
    if (!code) return
    mountedRef.current = true

    fetchAndResolve()

    const interval = setInterval(fetchAndResolve, 10_000)

    let eventSource: EventSource | null = null
    try {
      eventSource = new EventSource(`/api/player/${code}/events`)
      eventSource.onmessage = (event) => {
        if (event.data === "reload") {
          fetchAndResolve()
        }
      }
      eventSource.onerror = () => {
        eventSource?.close()
      }
    } catch {
      // SSE not available
    }

    return () => {
      mountedRef.current = false
      clearInterval(interval)
      eventSource?.close()
    }
  }, [code, fetchAndResolve])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white/40">
        <p className="text-sm">Carregando...</p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white/60">
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white/40">
        <p className="text-sm">Carregando...</p>
      </div>
    )
  }

  if (data.items && data.items.length > 0 && data.areas.length === 0) {
    return (
      <div className="h-screen w-full bg-black">
        <AreaContentPlayer items={data.items} />
      </div>
    )
  }

  if (data.areas.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white/40">
        <p className="text-sm">Nenhuma área configurada</p>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {data.areas.map((area) => (
        <div
          key={area.id}
          className="absolute overflow-hidden"
          style={{
            left: `${area.x}%`,
            top: `${area.y}%`,
            width: `${area.width}%`,
            height: `${area.height}%`,
            zIndex: area.zIndex,
          }}
        >
          {area.type === "content" ? (
            <AreaContentPlayer items={area.items} />
          ) : (
            <AreaAppPlayer area={area as any} />
          )}
        </div>
      ))}
    </div>
  )
}
