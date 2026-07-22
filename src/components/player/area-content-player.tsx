"use client"

import { useEffect, useState, useRef, useCallback } from "react"

interface PlaylistItem {
  type: string
  url: string
  name: string
  duration: number
  contentId: string
}

interface AreaContentPlayerProps {
  items: PlaylistItem[]
}

export function AreaContentPlayer({ items }: AreaContentPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const item = items[currentIndex]

  const advance = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1 >= items.length ? 0 : prev + 1))
  }, [items.length])

  useEffect(() => {
    if (!item || items.length === 0) return
    timerRef.current = setTimeout(advance, item.duration * 1000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentIndex, item, items.length, advance])

  if (items.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-card">
        <span className="text-xs text-muted-foreground">Sem conteúdo</span>
      </div>
    )
  }

  if (!item) return null

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {item.type === "video" ? (
        <video
          key={item.contentId}
          src={item.url}
          className="size-full object-contain"
          autoPlay
          muted
          playsInline
          onEnded={advance}
        />
      ) : item.type === "image" ? (
        <img
          key={item.contentId}
          src={item.url}
          alt={item.name}
          className="size-full object-contain"
        />
      ) : (
        <iframe
          key={item.contentId}
          src={item.url}
          className="size-full border-0"
          title={item.name}
          sandbox="allow-scripts allow-same-origin"
        />
      )}
    </div>
  )
}
