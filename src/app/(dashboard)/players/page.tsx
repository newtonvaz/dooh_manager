"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { usePlayers } from "@/hooks/use-players"
import { PlayersTable } from "@/components/players/players-table"
import dynamic from "next/dynamic"

const PlayerFormDialog = dynamic(() => import("@/components/players/player-form-dialog").then((m) => ({ default: m.PlayerFormDialog })), { ssr: false })
import { Button } from "@/components/ui/button"
import { WithTooltip } from "@/components/ui/tooltip"
import { Plus, LayoutGrid, List } from "lucide-react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"

interface Group {
  id: string
  name: string
}

type ViewMode = "grid" | "list"

export default function PlayersPage() {
  const { data: players, isLoading } = usePlayers()
  const [formOpen, setFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  const { data: dbGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: api.getGroups,
  })

  const groups = ["Todos os grupos", ...(dbGroups?.map((g: Group) => g.name) ?? [])]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Players</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todos os pontos de exibição
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border">
            <WithTooltip content="Visualizar como lista">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-3.5" />
                Lista
              </button>
            </WithTooltip>
            <WithTooltip content="Visualizar como grade">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-3.5" />
                Grid
              </button>
            </WithTooltip>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 size-4" />
            Novo Player
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : (
        <PlayersTable players={players ?? []} groups={groups} viewMode={viewMode} />
      )}

      <PlayerFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
