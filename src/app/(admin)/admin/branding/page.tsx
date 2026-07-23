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
import { ImagePlus, RotateCcw, Loader2 } from "lucide-react"

export default function BrandingPage() {
  const queryClient = useQueryClient()
  const { data: branding, isLoading } = useQuery({
    queryKey: ["admin-branding"],
    queryFn: api.getBranding,
  })

  const [systemName, setSystemName] = useState("")
  const [systemSubtitle, setSystemSubtitle] = useState("")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoSmalPreview, setLogoSmalPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [loginLogoPreview, setLoginLogoPreview] = useState<string | null>(null)
  const [loginBgPreview, setLoginBgPreview] = useState<string | null>(null)
  const [reportLogoPreview, setReportLogoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  useEffect(() => {
    if (branding) {
      setSystemName(branding.systemName || "")
      setSystemSubtitle(branding.systemSubtitle || "")
      setLogoPreview(branding.logoUrl)
      setLogoSmalPreview(branding.logoSmalUrl)
      setFaviconPreview(branding.faviconUrl)
      setLoginLogoPreview(branding.loginLogoUrl)
      setLoginBgPreview(branding.loginBackgroundUrl)
      setReportLogoPreview(branding.reportLogoUrl)
    }
  }, [branding])

  async function handleUpload(field: string) {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/png,image/jpeg,image/webp,image/svg+xml"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploadingField(field)
      try {
        const token = (await import("@supabase/ssr")).createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const safeName = `branding/${field}_${Date.now()}.${file.name.split(".").pop()}`
        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "presign", path: safeName }),
        })
        const presignJson = await presignRes.json()
        if (!presignRes.ok) throw new Error(presignJson.error)
        await fetch(presignJson.url, { method: "PUT", body: file })
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${safeName}`
        const updateData: Record<string, string> = {}
        updateData[field] = publicUrl
        await api.updateBranding(updateData)
        queryClient.invalidateQueries({ queryKey: ["admin-branding"] })
        api.recordAuditLog({ action: "update_branding", description: `Imagem ${field} atualizada` }).catch(() => {})
        toast.success("Imagem atualizada")
      } catch (e) {
        toast.error("Erro ao fazer upload")
      } finally {
        setUploadingField(null)
      }
    }
    input.click()
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.updateBranding({ systemName, systemSubtitle })
      queryClient.invalidateQueries({ queryKey: ["admin-branding"] })
      api.recordAuditLog({ action: "update_branding", description: `Sistema: ${systemName}` }).catch(() => {})
      toast.success("Identidade visual atualizada")
    } catch {
      toast.error("Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setResetting(true)
    try {
      await api.resetBranding()
      queryClient.invalidateQueries({ queryKey: ["admin-branding"] })
      api.recordAuditLog({ action: "reset_branding", description: "Restaurado para padrão" }).catch(() => {})
      toast.success("Identidade visual restaurada")
    } catch {
      toast.error("Erro ao restaurar")
    } finally {
      setResetting(false)
    }
  }

  function ImageField({ label, field, preview, onUpload }: {
    label: string; field: string; preview: string | null; onUpload: () => void
  }) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-4">
          <div className="size-20 rounded-lg border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {preview ? (
              <img src={preview} alt={label} className="size-full object-contain" />
            ) : (
              <ImagePlus className="size-6 text-muted-foreground/50" />
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onUpload} disabled={uploadingField === field}>
            {uploadingField === field ? (
              <Loader2 className="size-3 animate-spin mr-1" />
            ) : null}
            {preview ? "Alterar" : "Upload"}
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Identidade Visual</h1>
          <p className="text-sm text-muted-foreground">Personalize a aparência do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={resetting}>
            <RotateCcw className="size-3 mr-1" />
            Restaurar Padrão
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-3 animate-spin mr-1" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Informações do Sistema</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">Nome do Sistema</Label>
              <Input id="systemName" value={systemName} onChange={(e) => setSystemName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="systemSubtitle">Subtítulo do Sistema</Label>
              <Input id="systemSubtitle" value={systemSubtitle} onChange={(e) => setSystemSubtitle(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Logomarcas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ImageField label="Logomarca Principal" field="logoUrl" preview={logoPreview} onUpload={() => handleUpload("logoUrl")} />
            <Separator />
            <ImageField label="Logomarca Reduzida" field="logoSmalUrl" preview={logoSmalPreview} onUpload={() => handleUpload("logoSmalUrl")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Favicon</CardTitle></CardHeader>
          <CardContent>
            <ImageField label="Favicon (ícone da aba)" field="faviconUrl" preview={faviconPreview} onUpload={() => handleUpload("faviconUrl")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Tela de Login</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ImageField label="Logomarca da Tela de Login" field="loginLogoUrl" preview={loginLogoPreview} onUpload={() => handleUpload("loginLogoUrl")} />
            <Separator />
            <ImageField label="Imagem de Fundo da Autenticação" field="loginBackgroundUrl" preview={loginBgPreview} onUpload={() => handleUpload("loginBackgroundUrl")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Relatórios</CardTitle></CardHeader>
          <CardContent>
            <ImageField label="Logomarca para Relatórios" field="reportLogoUrl" preview={reportLogoPreview} onUpload={() => handleUpload("reportLogoUrl")} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
