"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AreaContentPlayer } from "@/components/player/area-content-player"
import { AreaAppPlayer } from "@/components/player/area-app-player"

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
}

export default function PlayerViewPage() {
  const params = useParams()
  const code = params.code as string
  const [data, setData] = useState<PlayerData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return
    fetch(`/api/player/${code}/playlist`)
      .then((res) => (res.ok ? res.json() : Promise.reject("Falha ao carregar")))
      .then(setData)
      .catch((err) => setError(String(err)))
  }, [code])

  if (error) {
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

  if (data.areas.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white/40">
        <p className="text-sm">Nenhuma área configurada</p>
      </div>
    )
  }

  return (
    <div className="relative size-full min-h-screen overflow-hidden bg-black">
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
