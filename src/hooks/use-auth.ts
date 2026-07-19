"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface User {
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isLoggingIn: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  isLoading: false,
  isLoggingIn: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

function mapUser(supabaseUser: SupabaseUser): User {
  const metadata = supabaseUser.app_metadata || {}
  return {
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "Usuário",
    email: supabaseUser.email || "",
    role: metadata.role || "operacional",
  }
}

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapUser(session.user))
        setToken(session.access_token)
      }
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapUser(session.user))
        setToken(session.access_token)
      } else {
        setUser(null)
        setToken(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoggingIn(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (!data.session?.user) throw new Error("Erro ao obter sessão")
      setUser(mapUser(data.session.user))
      setToken(data.session.access_token)
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setToken(null)
  }, [])

  return { user, token, login, logout, isLoading, isLoggingIn }
}
