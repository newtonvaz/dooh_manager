"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
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
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState("operacional")
  const [creating, setCreating] = useState(false)

  useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: { users: list }, error } = await supabase.auth.admin.listUsers()
      if (error) throw error
      const mapped = list.map((u: any) => ({
        id: u.id,
        email: u.email || "",
        name: u.user_metadata?.name || u.email || "",
        role: u.app_metadata?.role || "operacional",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        banned: false,
      }))
      setUsers(mapped)
      setLoading(false)
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
      const { data, error } = await supabase.auth.admin.createUser({
        email: newEmail,
        password: newPassword,
        user_metadata: { name: newName, role: newRole },
        app_metadata: { role: newRole },
        email_confirm: true,
      })
      if (error) throw error
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
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { role },
        user_metadata: { role },
      })
      if (error) throw error
      toast.success("Permissão atualizada")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar")
    }
  }

  async function handleToggleBan(userId: string, banned: boolean) {
    try {
      if (banned) {
        const { error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: "0" })
        if (error) throw error
        toast.success("Usuário desbloqueado")
      } else {
        const { error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: "87600h" })
        if (error) throw error
        toast.success("Usuário bloqueado")
      }
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
      const { error } = await supabase.auth.admin.updateUserById(userId, { password })
      if (error) throw error
      toast.success("Senha alterada")
    } catch (e: any) {
      toast.error(e.message || "Erro ao alterar senha")
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
              {loading ? (
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
