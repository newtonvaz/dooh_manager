"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navItems } from "./nav-items"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import { Monitor, LogOut, ChevronDown } from "lucide-react"
import { WithTooltip } from "@/components/ui/tooltip"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set()
    try {
      const stored = localStorage.getItem("sidebar-expanded")
      return stored ? new Set(JSON.parse(stored)) : new Set(["players"])
    } catch {
      return new Set(["players"])
    }
  })

  const toggleExpanded = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebar-expanded", JSON.stringify(Array.from(next)))
      }
      return next
    })
  }, [])

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href)
  }

  function NavLink({
    href,
    icon: Icon,
    title,
    collapsed: isCollapsed,
    subItems,
  }: {
    href: string
    icon: typeof Monitor
    title: string
    collapsed: boolean
    subItems?: { title: string; href: string; icon: typeof Monitor }[]
  }) {
    const active = isActive(href)
    const hasChildren = !!subItems?.length
    const isExpanded = expanded.has(href)
    const link = (
      <WithTooltip content={title}>
        <Link
          href={href}
          className={cn(
            "group/nav-link relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
            "hover:translate-x-0.5",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          {active && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-sidebar-primary" />
          )}
          <Icon
            className={cn(
              "size-5 shrink-0 transition-transform duration-200",
              "group-hover/nav-link:scale-110"
            )}
          />
          {!isCollapsed && <span className="flex-1 truncate">{title}</span>}
        </Link>
      </WithTooltip>
    )

    if (isCollapsed) {
      return (
        <WithTooltip content={title}>
          <Link
            href={href}
            className={cn(
              "group/nav-link relative flex items-center justify-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
              "hover:translate-x-0.5",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
            title={title}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-sidebar-primary" />
            )}
            <Icon className="size-5 shrink-0 transition-transform duration-200 group-hover/nav-link:scale-110" />
          </Link>
        </WithTooltip>
      )
    }

    return (
      <>
        <div className="relative">
          {link}
          {hasChildren && (
            <WithTooltip content={isExpanded ? "Recolher" : "Expandir"}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  toggleExpanded(href)
                }}
                className={cn(
                  "absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center size-7 rounded-md text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 cursor-pointer"
                )}
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>
            </WithTooltip>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-sidebar-border pl-2.5">
            {subItems!.map((child) => {
              const childActive = isActive(child.href)
              return (
                <WithTooltip key={child.href} content={child.title}>
                  <Link
                    href={child.href}
                    className={cn(
                      "sidebar-child-link group/child-link relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                      "hover:translate-x-0.5",
                      childActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    {childActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-sidebar-primary" />
                    )}
                    <child.icon className="size-4 shrink-0 transition-transform duration-200 group-hover/child-link:scale-110" />
                    <span className="truncate">{child.title}</span>
                  </Link>
                </WithTooltip>
              )
            })}
          </div>
        )}
      </>
    )
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        "relative overflow-hidden",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-2.5 border-b border-sidebar-border transition-all duration-300",
          "justify-center px-4"
        )}
      >
        {collapsed ? (
          <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary/10 ring-1 ring-sidebar-primary/20">
            <Image
              src="/doohos.png"
              alt="D"
              fill
              className="object-cover object-left"
            />
          </div>
        ) : (
          <Image
            src="/doohos.png"
            alt="DOOHOS"
            width={164}
            height={40}
            className="h-10 w-auto object-contain"
          />
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            title={item.title}
            collapsed={collapsed}
            subItems={item.children}
          />
        ))}

        <div className="pt-3">
          <WithTooltip content="Sair">
            <button
              type="button"
              onClick={logout}
              className={cn(
                "group/logout flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer",
                "hover:translate-x-0.5",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? "Sair" : undefined}
            >
              <LogOut className="size-5 shrink-0 transition-transform duration-200 group-hover/logout:scale-110" />
              {!collapsed && <span>Sair</span>}
            </button>
          </WithTooltip>
        </div>
      </nav>

      <div
        className={cn(
          "border-t border-sidebar-border bg-sidebar-accent/30 px-4 py-3 transition-all duration-300",
          collapsed && "flex justify-center px-0"
        )}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-sidebar-primary/10 text-[10px] font-bold text-sidebar-primary">
              D
            </div>
            <div className="text-[11px] leading-tight">
              <p className="font-medium text-sidebar-foreground/80">v1.0.0</p>
              <p className="text-sidebar-foreground/40">DOOHOS</p>
            </div>
          </div>
        ) : (
          <div className="flex size-6 items-center justify-center rounded-full bg-sidebar-primary/10 text-[10px] font-bold text-sidebar-primary">
            D
          </div>
        )}
      </div>
    </aside>
  )
}
