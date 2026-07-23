"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { Card } from "@/components/ui/card"
import { ScrollText, Loader2 } from "lucide-react"

const ACTION_LABELS: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  config_update: "Alteração de Configuração",
  user_create: "Criação de Usuário",
  user_update: "Alteração de Usuário",
  user_delete: "Exclusão de Usuário",
  content_delete: "Exclusão de Conteúdo",
  layout_change: "Alteração de Layout",
  programming_change: "Alteração de Programação",
  branding_update: "Alteração de Identidade Visual",
  theme_change: "Alteração de Tema",
}

export default function AuditPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => api.getAuditLogs(500, 0),
    refetchInterval: 10000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-sm text-muted-foreground">Registro de todas as ações administrativas</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                  <th className="p-3 font-medium">Data/Hora</th>
                  <th className="p-3 font-medium">Usuário</th>
                  <th className="p-3 font-medium">Ação</th>
                  <th className="p-3 font-medium">Descrição</th>
                  <th className="p-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      <ScrollText className="size-8 mx-auto mb-2 opacity-50" />
                      Nenhum registro de auditoria encontrado
                    </td>
                  </tr>
                )}
                {logs?.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{log.userName}</div>
                      <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{log.description}</td>
                    <td className="p-3 text-xs text-muted-foreground font-mono">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
