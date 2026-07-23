"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

function SettingField({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: any; onChange: (v: any) => void; type?: string; placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  )
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: api.getAdminSettings,
    staleTime: 60000,
    retry: 1,
  })

  const [platform, setPlatform] = useState<Record<string, any>>({})
  const [email, setEmail] = useState<Record<string, any>>({})
  const [security, setSecurity] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (settings && !initialized) {
      setPlatform(settings.platform || {})
      setEmail(settings.email || {})
      setSecurity(settings.security || {})
      setInitialized(true)
    }
  }, [settings, initialized])

  async function handleSave(section: string, data: Record<string, any>) {
    setSaving(section)
    try {
      await api.updateAdminSetting(section, data)
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] })
      api.recordAuditLog({ action: "update_settings", description: `Seção: ${section}` }).catch(() => {})
      toast.success("Configuração salva")
    } catch {
      toast.error("Erro ao salvar")
    } finally {
      setSaving(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">Configurações globais da plataforma</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>Erro ao carregar configurações.</p>
            <p className="text-xs mt-1">Certifique-se de que a migration 009_admin_panel.sql foi executada no Supabase.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Configurações globais da plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Plataforma</CardTitle>
            <Button size="sm" onClick={() => handleSave("platform", platform)} disabled={saving === "platform"}>
              {saving === "platform" ? <Loader2 className="size-3 animate-spin mr-1" /> : <Save className="size-3 mr-1" />}
              Salvar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SettingField label="Nome da Empresa" value={platform.companyName} onChange={(v) => setPlatform((p: any) => ({ ...p, companyName: v }))} />
            <SettingField label="URL do CMS" value={platform.cmsUrl} onChange={(v) => setPlatform((p: any) => ({ ...p, cmsUrl: v }))} />
            <SettingField label="Idioma" value={platform.language} onChange={(v) => setPlatform((p: any) => ({ ...p, language: v }))} />
            <SettingField label="Fuso Horário" value={platform.timezone} onChange={(v) => setPlatform((p: any) => ({ ...p, timezone: v }))} />
            <SettingField label="Formato de Data" value={platform.dateFormat} onChange={(v) => setPlatform((p: any) => ({ ...p, dateFormat: v }))} />
            <SettingField label="Formato de Hora" value={platform.timeFormat} onChange={(v) => setPlatform((p: any) => ({ ...p, timeFormat: v }))} />
            <SettingField label="Limite de Upload (MB)" type="number" value={platform.uploadMaxSize} onChange={(v) => setPlatform((p: any) => ({ ...p, uploadMaxSize: v }))} />
            <SettingField label="Tipos de Arquivo" value={platform.uploadAllowedTypes} onChange={(v) => setPlatform((p: any) => ({ ...p, uploadAllowedTypes: v }))} />
            <SettingField label="Tempo de Cache (s)" type="number" value={platform.cacheTime} onChange={(v) => setPlatform((p: any) => ({ ...p, cacheTime: v }))} />
            <SettingField label="Sincronização (s)" type="number" value={platform.syncInterval} onChange={(v) => setPlatform((p: any) => ({ ...p, syncInterval: v }))} />
            <SettingField label="Heartbeat Timeout (s)" type="number" value={platform.heartbeatTimeout} onChange={(v) => setPlatform((p: any) => ({ ...p, heartbeatTimeout: v }))} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">E-mail</CardTitle>
            <Button size="sm" onClick={() => handleSave("email", email)} disabled={saving === "email"}>
              {saving === "email" ? <Loader2 className="size-3 animate-spin mr-1" /> : <Save className="size-3 mr-1" />}
              Salvar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SettingField label="SMTP Host" value={email.smtpHost} onChange={(v) => setEmail((p: any) => ({ ...p, smtpHost: v }))} />
            <SettingField label="SMTP Porta" type="number" value={email.smtpPort} onChange={(v) => setEmail((p: any) => ({ ...p, smtpPort: v }))} />
            <SettingField label="SMTP Usuário" value={email.smtpUser} onChange={(v) => setEmail((p: any) => ({ ...p, smtpUser: v }))} />
            <SettingField label="SMTP Senha" type="password" value={email.smtpPass} onChange={(v) => setEmail((p: any) => ({ ...p, smtpPass: v }))} />
            <SettingField label="Nome do Remetente" value={email.fromName} onChange={(v) => setEmail((p: any) => ({ ...p, fromName: v }))} />
            <SettingField label="E-mail do Remetente" value={email.fromEmail} onChange={(v) => setEmail((p: any) => ({ ...p, fromEmail: v }))} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Segurança</CardTitle>
            <Button size="sm" onClick={() => handleSave("security", security)} disabled={saving === "security"}>
              {saving === "security" ? <Loader2 className="size-3 animate-spin mr-1" /> : <Save className="size-3 mr-1" />}
              Salvar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SettingField label="Timeout Sessão (min)" type="number" value={security.sessionTimeout} onChange={(v) => setSecurity((p: any) => ({ ...p, sessionTimeout: v }))} />
            <SettingField label="Máx. Tentativas Login" type="number" value={security.maxLoginAttempts} onChange={(v) => setSecurity((p: any) => ({ ...p, maxLoginAttempts: v }))} />
            <SettingField label="Senha Mínima (caracteres)" type="number" value={security.passwordMinLength} onChange={(v) => setSecurity((p: any) => ({ ...p, passwordMinLength: v }))} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
