"use client"

import type { LayoutArea } from "@/types/layout"

const APP_URLS: Record<string, string> = {
  noticias: "https://www.google.com/search?q=noticias&tbm=nws",
  clima: "https://weather.com",
  relogio: "about:blank",
  "redes-sociais": "https://www.facebook.com",
  transito: "https://www.google.com/maps",
  "doohos-instance": "about:blank",
}

interface AreaAppPlayerProps {
  area: LayoutArea
}

export function AreaAppPlayer({ area }: AreaAppPlayerProps) {
  const appId = area.config.appId
  const appUrl = appId ? APP_URLS[appId] : null

  if (!appUrl || appId === "relogio" || appId === "doohos-instance") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-2 text-white/60">
          <div className="text-6xl font-light tabular-nums">
            {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-xs opacity-50">
            {appId === "relogio" ? "Relógio" : appId === "doohos-instance" ? "Instância do Sistema" : appId || "Sem app"}
          </div>
        </div>
      </div>
    )
  }

  return (
    <iframe
      src={appUrl}
      className="absolute inset-0 size-full border-0"
      title={appId || "app"}
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  )
}
