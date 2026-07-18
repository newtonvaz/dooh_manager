"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
        <Header onMenuClick={() => setCollapsed(!collapsed)} />
        <main className="relative flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-muted)_0%,_transparent_60%)]" />
          <div className="relative p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
