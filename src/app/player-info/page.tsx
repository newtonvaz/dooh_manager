"use client"

import { DeviceInfoSection } from "@/components/players/device-info-section"
import { Monitor } from "lucide-react"

export default function PlayerInfoPage() {
  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <Monitor className="size-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Informações do Player</h1>
            <p className="text-sm text-muted-foreground">Dados coletados do dispositivo</p>
          </div>
        </div>

        <DeviceInfoSection />
      </div>
    </div>
  )
}
