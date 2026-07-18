"use client"

import { Grid3x3 } from "lucide-react"

export default function LayoutsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Layouts</h1>
        <p className="text-sm text-muted-foreground">
          Crie e gerencie layouts de tela
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Grid3x3 className="size-12 mb-4 opacity-50" />
        <p>Módulo em desenvolvimento</p>
      </div>
    </div>
  )
}
