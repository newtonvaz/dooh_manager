"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Palette, Plus, Trash2, Check, Loader2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

const COLOR_FIELDS = [
  { key: "primary", label: "Primária", default: "#2563eb" },
  { key: "secondary", label: "Secundária", default: "#64748b" },
  { key: "accent", label: "Destaque (Accent)", default: "#f59e0b" },
  { key: "success", label: "Sucesso", default: "#22c55e" },
  { key: "warning", label: "Aviso", default: "#eab308" },
  { key: "error", label: "Erro", default: "#ef4444" },
  { key: "info", label: "Informação", default: "#3b82f6" },
  { key: "background", label: "Fundo", default: "#ffffff" },
  { key: "card", label: "Cards", default: "#f8fafc" },
  { key: "sidebar", label: "Barra Lateral", default: "#1e293b" },
  { key: "sidebarForeground", label: "Sidebar (texto)", default: "#f8fafc" },
  { key: "header", label: "Barra Superior", default: "#ffffff" },
  { key: "button", label: "Botões", default: "#2563eb" },
  { key: "link", label: "Links", default: "#2563eb" },
  { key: "text", label: "Textos", default: "#0f172a" },
  { key: "icon", label: "Ícones", default: "#64748b" },
  { key: "border", label: "Bordas", default: "#e2e8f0" },
]

export default function ThemesPage() {
  const queryClient = useQueryClient()
  const { data: themes, isLoading } = useQuery({
    queryKey: ["admin-themes"],
    queryFn: api.getThemes,
  })

  const [showForm, setShowForm] = useState(false)
  const [themeName, setThemeName] = useState("")
  const [themeMode, setThemeMode] = useState("custom")
  const [colors, setColors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function handleColorChange(key: string, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreate() {
    if (!themeName.trim()) {
      toast.error("Defina um nome para o tema")
      return
    }
    setSaving(true)
    try {
      await api.createTheme({ name: themeName, mode: themeMode, colors })
      queryClient.invalidateQueries({ queryKey: ["admin-themes"] })
      api.recordAuditLog({ action: "create_theme", description: `Tema: ${themeName}` }).catch(() => {})
      setShowForm(false)
      setThemeName("")
      setColors({})
      toast.success("Tema criado")
    } catch {
      toast.error("Erro ao criar tema")
    } finally {
      setSaving(false)
    }
  }

  async function handleSetActive(id: string | null) {
    try {
      await api.setActiveTheme(id)
      queryClient.invalidateQueries({ queryKey: ["admin-themes"] })
      api.recordAuditLog({ action: id ? "activate_theme" : "reset_theme", description: id || "Padrão" }).catch(() => {})
      toast.success(id ? "Tema ativado" : "Tema padrão restaurado")
    } catch {
      toast.error("Erro ao ativar tema")
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteTheme(id)
      queryClient.invalidateQueries({ queryKey: ["admin-themes"] })
      api.recordAuditLog({ action: "delete_theme", description: `ID: ${id}` }).catch(() => {})
      toast.success("Tema excluído")
    } catch {
      toast.error("Erro ao excluir tema")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Temas e Cores</h1>
          <p className="text-sm text-muted-foreground">Gerencie a paleta de cores do sistema</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="size-3 mr-1" />
          Novo Tema
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Criar Novo Tema</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Tema</Label>
                <Input value={themeName} onChange={(e) => setThemeName(e.target.value)} placeholder="Ex: Tema Escuro" />
              </div>
              <div className="space-y-2">
                <Label>Modo</Label>
                <Select value={themeMode} onValueChange={(v) => v && setThemeMode(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="auto">Automático</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {COLOR_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors[field.key] || field.default}
                      onChange={(e) => handleColorChange(field.key, e.target.value)}
                      className="size-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={colors[field.key] || field.default}
                      onChange={(e) => handleColorChange(field.key, e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="size-3 animate-spin mr-1" />}
                Criar Tema
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary/50", !themes?.some((t) => t.isActive) && "ring-2 ring-primary")}
          onClick={() => handleSetActive(null)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 flex items-center justify-center">
              <Eye className="size-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Tema Padrão</p>
              <p className="text-xs text-muted-foreground">Tema original do sistema</p>
            </div>
            {!themes?.some((t) => t.isActive) && (
              <Check className="size-4 text-primary" />
            )}
          </CardContent>
        </Card>

        {themes?.map((theme) => {
          const c = (theme.colors || {}) as Record<string, string>
          return (
            <Card
              key={theme.id}
              className={cn("transition-all", theme.isActive && "ring-2 ring-primary")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="size-10 rounded-lg flex items-center justify-center"
                    style={{ background: c.primary || "#2563eb" }}
                  >
                    <Palette className="size-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{theme.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{theme.mode}</p>
                  </div>
                  {theme.isActive && <Check className="size-4 text-primary shrink-0" />}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {COLOR_FIELDS.slice(0, 6).map((f) => (
                    <div
                      key={f.key}
                      className="size-4 rounded-full border"
                      style={{ background: c[f.key] || f.default }}
                      title={f.label}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={theme.isActive ? "outline" : "default"}
                    className="flex-1 h-8 text-xs"
                    onClick={() => handleSetActive(theme.isActive ? null : theme.id)}
                  >
                    {theme.isActive ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => handleDelete(theme.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
