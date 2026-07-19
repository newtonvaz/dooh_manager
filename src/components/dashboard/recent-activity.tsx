"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ArrowUp, ArrowDown, ListMusic, UserPlus, Trash2, Settings, type LucideIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
  user: string
}

const activityConfig: Record<string, { icon: LucideIcon; dot: string; bg: string }> = {
  online: {
    icon: ArrowUp,
    dot: "bg-green-500",
    bg: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  offline: {
    icon: ArrowDown,
    dot: "bg-red-500",
    bg: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  upload: {
    icon: Upload,
    dot: "bg-blue-500",
    bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  playlist: {
    icon: ListMusic,
    dot: "bg-purple-500",
    bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  player: {
    icon: UserPlus,
    dot: "bg-cyan-500",
    bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  delete: {
    icon: Trash2,
    dot: "bg-rose-500",
    bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  config: {
    icon: Settings,
    dot: "bg-amber-500",
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
}

export function RecentActivity({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <Card className="overflow-hidden border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <p className="text-sm">Nenhuma atividade recente</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />
          <div className="space-y-0">
            {activities.slice(0, 5).map((activity) => {
              const config = activityConfig[activity.type] || activityConfig.upload
              const Icon = config.icon

              return (
                <div key={activity.id} className="group relative flex items-start gap-4 py-2.5">
                  <div className="relative z-10 flex shrink-0 items-center justify-center">
                    <div className={`rounded-full p-2 transition-all duration-200 group-hover:scale-110 ${config.bg}`}>
                      <Icon className="size-3.5" />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col pt-1">
                    <p className="text-sm leading-snug text-foreground/90 group-hover:text-foreground transition-colors">
                      {activity.description}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground/60">
                      <span className="font-medium text-muted-foreground/80">{activity.user}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
