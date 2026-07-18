"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password")

  useEffect(() => {
    if (!isLoading && !user && !isAuthPage) {
      router.replace("/login")
    }
  }, [user, isLoading, isAuthPage, router])

  if (isAuthPage) return <>{children}</>

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <DashboardShell>{children}</DashboardShell>
}
