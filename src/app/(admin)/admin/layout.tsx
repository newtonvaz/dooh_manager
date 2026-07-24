"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Palette, PaintBucket, Users,
  ScrollText, Activity, Shield, ChevronLeft, ChevronRight,
  Monitor, ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

const adminNav = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Identidade Visual", href: "/admin/branding", icon: Palette },
  { title: "Temas e Cores", href: "/admin/themes", icon: PaintBucket },
  { title: "Usuários", href: "/admin/users", icon: Users },
  { title: "Monitoramento", href: "/admin/monitoring", icon: Monitor },
  { title: "Auditoria", href: "/admin/audit", icon: ScrollText },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen">
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex items-center gap-2 border-b px-4 h-14">
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Administrativo</p>
              <p className="text-[10px] text-muted-foreground truncate">Painel de Controle</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {adminNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-2">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <ArrowLeft className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">Voltar ao CMS</span>}
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
