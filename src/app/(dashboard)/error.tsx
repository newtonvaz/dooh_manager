"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3 text-destructive">
        <AlertTriangle className="size-8" />
        <p className="text-sm font-medium">Erro ao carregar o dashboard</p>
        <p className="max-w-md text-center text-xs text-muted-foreground">
          {error.message || "Ocorreu um erro inesperado. Verifique se as variáveis de ambiente do Supabase estão configuradas no Vercel."}
        </p>
        <button
          onClick={reset}
          className="mt-2 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors hover:bg-accent"
        >
          <RefreshCw className="size-3" />
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
