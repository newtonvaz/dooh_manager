"use client"

import { AppWindow, Newspaper, CloudSun, Clock, Share2, Car, Monitor } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const APPS = [
  {
    id: "noticias",
    name: "Notícias",
    description: "Feed de notícias em tempo real com atualização automática",
    icon: Newspaper,
    type: "external" as const,
    status: "disponivel" as const,
  },
  {
    id: "clima",
    name: "Clima",
    description: "Previsão do tempo atualizada com dados meteorológicos em tempo real",
    icon: CloudSun,
    type: "external" as const,
    status: "disponivel" as const,
  },
  {
    id: "relogio",
    name: "Relógio",
    description: "Relógio digital personalizável com data e hora",
    icon: Clock,
    type: "system" as const,
    status: "disponivel" as const,
  },
  {
    id: "redes-sociais",
    name: "Redes Sociais",
    description: "Feed de redes sociais para exibição em tempo real",
    icon: Share2,
    type: "external" as const,
    status: "disponivel" as const,
  },
  {
    id: "transito",
    name: "Trânsito",
    description: "Informações de trânsito ao vivo com mapa",
    icon: Car,
    type: "external" as const,
    status: "disponivel" as const,
  },
  {
    id: "doohos-instance",
    name: "Instância do Sistema",
    description: "Outra instância do sistema DOOHOS rodando simultaneamente",
    icon: Monitor,
    type: "system" as const,
    status: "disponivel" as const,
  },
]

const statusConfig = {
  disponivel: { label: "Disponível", variant: "default" as const },
  desenvolvimento: { label: "Em desenvolvimento", variant: "secondary" as const },
}

export default function AppsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Apps</h1>
          <p className="text-sm text-muted-foreground">
            Aplicativos disponíveis para uso nas áreas do layout
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {APPS.length} apps
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((app) => {
          const Icon = app.icon
          const status = statusConfig[app.status]
          return (
            <Card key={app.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant={status.variant} className="text-[10px]">
                    {status.label}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-base">{app.name}</CardTitle>
                <CardDescription className="text-xs">
                  {app.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {app.type === "system" ? "Sistema" : "Externo"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    ID: {app.id}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AppWindow className="size-4" />
          <span>
            Os apps podem ser utilizados nas <strong>áreas do layout</strong>.
            Acesse a aba <strong>Layouts</strong> para configurar.
          </span>
        </div>
      </div>
    </div>
  )
}
