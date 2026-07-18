"use client"

import { Calendar } from "lucide-react"

export default function SchedulingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Programação</h1>
        <p className="text-sm text-muted-foreground">
          Agende conteúdos nos players
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Calendar className="size-12 mb-4 opacity-50" />
        <p>Módulo em desenvolvimento</p>
      </div>
    </div>
  )
}
