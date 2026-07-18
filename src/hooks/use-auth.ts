"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { api } from "@/lib/api-client"

const STORAGE_KEY = "dooh-auth"
const SESSION_DURATION = 24 * 60 * 60 * 1000

interface StoredAuth {
  user: User
  token: string
  timestamp: number
}

interface User {
  name: string
  email: string
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

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: StoredAuth = JSON.parse(stored)
        const elapsed = Date.now() - parsed.timestamp
        if (elapsed < SESSION_DURATION) {
          setUser(parsed.user)
          setToken(parsed.token)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoggingIn(true)
    try {
      const result = await api.login(email, password)
      setUser(result.user)
      setToken(result.token)
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: result.user, token: result.token, timestamp: Date.now() })
      )
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { user, token, login, logout, isLoading, isLoggingIn }
}
