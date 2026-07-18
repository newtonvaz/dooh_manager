"use client"

import { useState } from "react"
import { Search, Bell, Menu, LogOut, User, ChevronDown, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useAuth } from "@/hooks/use-auth"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-xl px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="shrink-0 size-9 rounded-lg hover:bg-muted transition-all duration-200 active:scale-95"
      >
        <Menu className="size-5" />
      </Button>

      <div
        className={cn(
          "relative flex-1 max-w-md transition-all duration-200",
          searchFocused && "max-w-lg"
        )}
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200" />
        <Input
          placeholder="Buscar players, conteúdos, playlists..."
          className="h-9 rounded-xl border-muted bg-muted/50 pl-9 text-sm transition-all duration-200 placeholder:text-muted-foreground/60 focus-visible:bg-background focus-visible:shadow-sm"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {searchFocused && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 md:inline-flex">
            <span>⌘</span>K
          </kbd>
        )}
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 rounded-lg hover:bg-muted transition-all duration-200 active:scale-95"
        >
          <Bell className="size-5" />
          <span className="absolute -top-0.5 -right-0.5 flex size-4.5 animate-pulse items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer outline-none">
            <div className="flex items-center gap-2 rounded-xl border border-transparent bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-muted-foreground/20 active:scale-[0.98]">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase() ?? "A"}
              </div>
              <span className="hidden sm:inline">{user?.name ?? "Admin"}</span>
              <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-200 ui-open:rotate-180" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1.5">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3 py-1">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {user?.name?.charAt(0).toUpperCase() ?? "A"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.name ?? "Admin"}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {user?.email ?? "admin@dooh.com"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 size-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 size-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              variant="destructive"
              className="cursor-pointer"
            >
              <LogOut className="mr-2 size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}


