"use client"

import { useBranding } from "@/hooks/use-branding"

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  useBranding()
  return <>{children}</>
}
