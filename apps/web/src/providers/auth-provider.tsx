"use client"

import { createContext, useCallback, useContext, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { Cylo, User } from "@/lib/auth/session"

interface AuthContextValue {
  user: User
  cylos: Cylo[]
  isAdmin: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}

export function useOptionalAuth() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
  user: User
  cylos: Cylo[]
}

export function AuthProvider({ children, user, cylos }: AuthProviderProps) {
  const router = useRouter()

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Ignore errors
    }
    router.push("/login")
    router.refresh()
  }, [router])

  const value: AuthContextValue = {
    user,
    cylos,
    isAdmin: user.roles === "admin" || user.roles === "superadmin",
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
