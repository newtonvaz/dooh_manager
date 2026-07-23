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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Plus, Shield, Ban, UserCheck, Trash2, KeyRound } from "lucide-react"

const ROLES = [
  { value: "admin", label: "Super Administrador" },
  { value: "gestor_projeto", label: "Administrador" },
  { value: "operacional", label: "Operador" },
]

interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  lastSignIn: string | null
  banned: boolean
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState("operacional")
  const [creating, setCreating] = useState(false)

  const { isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const list = await api.getAdminUsers()
      const mapped = list.map((u: any) => ({
        id: u.id,
        email: u.email || "",
        name: u.user_metadata?.name || u.email || "",
        role: u.app_metadata?.role || "operacional",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        banned: u.banned_until && new Date(u.banned_until) > new Date(),
      }))
      setUsers(mapped)
      return mapped
    },
  })

  async function handleCreate() {
    if (!newEmail || !newPassword || !newName) {
      toast.error("Preencha todos os campos")
      return
    }
    setCreating(true)
    try {
      await api.createAdminUser({ email: newEmail, password: newPassword, name: newName, role: newRole })
      api.recordAuditLog({ action: "create_user", description: `Usuário: ${newEmail} (${newRole})` }).catch(() => {})
      toast.success(`Usuário ${newEmail} criado`)
      setShowCreate(false)
      setNewEmail("")
      setNewPassword("")
      setNewName("")
      setNewRole("operacional")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar usuário")
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdateRole(userId: string, role: string) {
    try {
      await api.updateAdminUser(userId, {
        app_metadata: { role },
        user_metadata: { role },
      })
      api.recordAuditLog({ action: "update_user_role", description: `Usuário: ${userId} → ${role}` }).catch(() => {})
      toast.success("Permissão atualizada")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar")
    }
  }

  async function handleToggleBan(userId: string, banned: boolean) {
    try {
      await api.updateAdminUser(userId, {
        ban_duration: banned ? "0" : "87600h",
      })
      api.recordAuditLog({
        action: banned ? "unban_user" : "ban_user",
        description: `Usuário: ${userId}`,
      }).catch(() => {})
      toast.success(banned ? "Usuário desbloqueado" : "Usuário bloqueado")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch (e: any) {
      toast.error(e.message || "Erro")
    }
  }

  async function handleResetPassword(userId: string) {
    const password = prompt("Nova senha (mín. 6 caracteres):")
    if (!password || password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres")
      return
    }
    try {
      await api.updateAdminUser(userId, { password })
      api.recordAuditLog({ action: "reset_password", description: `Usuário: ${userId}` }).catch(() => {})
      toast.success("Senha alterada")
    } catch (e: any) {
      toast.error(e.message || "Erro ao alterar senha")
    }
  }

  async function handleDelete(userId: string, email: string) {
    if (!confirm(`Excluir usuário ${email}? Esta ação não pode ser desfeita.`)) return
    try {
      await api.deleteAdminUser(userId)
      api.recordAuditLog({ action: "delete_user", description: `Usuário: ${email}` }).catch(() => {})
      toast.success("Usuário excluído")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerenciar usuários e permissões</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-3 mr-1" />
          Novo Usuário
        </Button>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mín. 6 caracteres" />
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={newRole} onValueChange={(v) => v && setNewRole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="size-3 animate-spin mr-1" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                <th className="p-3 font-medium">Usuário</th>
                <th className="p-3 font-medium">E-mail</th>
                <th className="p-3 font-medium">Perfil</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Criado em</th>
                <th className="p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    <Shield className="size-8 mx-auto mb-2 opacity-50" />
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : null}
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    <Select
                      value={u.role}
                      onValueChange={(v) => v && handleUpdateRole(u.id, v)}
                    >
                      <SelectTrigger className="h-7 text-xs w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    {u.banned ? (
                      <span className="text-destructive text-xs font-medium">Bloqueado</span>
                    ) : (
                      <span className="text-emerald-600 text-xs font-medium">Ativo</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                        title="Redefinir senha"
                        onClick={() => handleResetPassword(u.id)}
                      >
                        <KeyRound className="size-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-md hover:bg-accent"
                        title={u.banned ? "Desbloquear" : "Bloquear"}
                        onClick={() => handleToggleBan(u.id, u.banned)}
                      >
                        {u.banned ? (
                          <UserCheck className="size-3.5 text-emerald-600" />
                        ) : (
                          <Ban className="size-3.5 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-destructive"
                        title="Excluir usuário"
                        onClick={() => handleDelete(u.id, u.email)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
