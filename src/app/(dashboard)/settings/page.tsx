"use client"

import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Configure sua plataforma
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Settings className="size-12 mb-4 opacity-50" />
        <p>Módulo em desenvolvimento</p>
      </div>
    </div>
  )
}
