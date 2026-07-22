import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WithTooltip } from "@/components/ui/tooltip"
import { Monitor } from "lucide-react"

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-xl bg-primary/10 p-3">
              <Monitor className="size-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Recuperar Senha</CardTitle>
          <CardDescription>Recuperação disponível em breve</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            O módulo de recuperação de senha está sendo implementado.
          </p>
          <WithTooltip content="Voltar para a página de login">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background hover:bg-muted hover:text-foreground h-9 px-4 text-sm font-medium whitespace-nowrap transition-colors w-full"
            >
              Voltar ao login
            </Link>
          </WithTooltip>
        </CardContent>
      </Card>
    </div>
  )
}
