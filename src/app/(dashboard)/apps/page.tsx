"use client"

import { AppWindow } from "lucide-react"

export default function AppsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Apps</h1>
        <p className="text-sm text-muted-foreground">
          Aplicativos integrados
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <AppWindow className="size-12 mb-4 opacity-50" />
        <p className="text-sm">Em breve</p>
      </div>
    </div>
  )
}
