"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { useEffect } from "react"

export function useBranding() {
  const { data: branding } = useQuery({
    queryKey: ["admin-branding"],
    queryFn: api.getBranding,
    refetchInterval: 60000,
    staleTime: 30000,
  })

  useEffect(() => {
    if (!branding) return

    const name = branding.systemName || "DOOH Manager"
    const subtitle = branding.systemSubtitle || "Sistema de Gerenciamento DOOH"

    document.title = name

    const titleMeta = document.querySelector('meta[name="application-name"]')
    if (titleMeta) titleMeta.setAttribute("content", name)

    if (branding.logoUrl) {
      const logo = document.getElementById("brand-logo") as HTMLImageElement | null
      if (logo) logo.src = branding.logoUrl
    }

    if (branding.logoSmalUrl) {
      const logoSmall = document.getElementById("brand-logo-small") as HTMLImageElement | null
      if (logoSmall) logoSmall.src = branding.logoSmalUrl
    }

    if (branding.faviconUrl) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
      if (!link) {
        link = document.createElement("link")
        link.rel = "icon"
        document.head.appendChild(link)
      }
      link.href = branding.faviconUrl
    }
  }, [branding])

  return branding
}
