"use client"

import { Card } from "@/components/ui/card"
import { type LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  variant?: "default" | "success" | "warning" | "danger"
}

const variantStyles = {
  default: {
    container: "from-primary/10 via-transparent to-transparent border-primary/10",
    icon: "bg-primary/15 text-primary group-hover:bg-primary/25",
    value: "text-foreground",
  },
  success: {
    container: "from-emerald-500/10 via-transparent to-transparent border-emerald-500/10",
    icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/25",
    value: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    container: "from-amber-500/10 via-transparent to-transparent border-amber-500/10",
    icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/25",
    value: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    container: "from-red-500/10 via-transparent to-transparent border-red-500/10",
    icon: "bg-red-500/15 text-red-600 dark:text-red-400 group-hover:bg-red-500/25",
    value: "text-red-600 dark:text-red-400",
  },
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
}: StatsCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className={`group relative overflow-hidden border bg-gradient-to-br ${styles.container} transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 dark:to-white/5" />
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground/80 tracking-wide uppercase">
              {title}
            </p>
            <p className={`text-3xl font-bold tracking-tight ${styles.value}`}>
              {value}
            </p>
          </div>
          <div className={`rounded-xl p-3 transition-all duration-300 ${styles.icon}`}>
            <Icon className="size-5" />
          </div>
        </div>
        {description && (
          <p className="mt-3 text-xs text-muted-foreground/70 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </Card>
  )
}
