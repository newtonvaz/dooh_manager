"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WithTooltip } from "@/components/ui/tooltip"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api-client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login, isLoggingIn } = useAuth()
  const router = useRouter()

  const { data: branding } = useQuery({
    queryKey: ["admin-branding"],
    queryFn: api.getBranding,
    staleTime: 60000,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success("Login realizado com sucesso!")
      router.push("/")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao fazer login")
    }
  }

  const logoUrl = branding?.loginLogoUrl || branding?.logoUrl || "/doohos.png"
  const bgUrl = branding?.loginBackgroundUrl

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 bg-cover bg-center"
      style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : {}}
    >
      <div className="absolute inset-0 bg-black/40" />
      <Card className="w-full max-w-sm relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            {logoUrl.endsWith(".svg") ? (
              <img src={logoUrl} alt={branding?.systemName || "DOOHOS"} className="h-[46px] w-auto" />
            ) : (
              <img src={logoUrl} alt={branding?.systemName || "DOOHOS"} className="h-[46px] w-auto" />
            )}
          </div>
          <CardTitle className="sr-only">{branding?.systemName || "DOOHOS"}</CardTitle>
          <CardDescription>
            {branding?.systemSubtitle || "Entre com suas credenciais"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@dooh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <WithTooltip content="Fazer login">
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn && <Loader2 className="mr-2 size-4 animate-spin" />}
                Entrar
              </Button>
            </WithTooltip>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
