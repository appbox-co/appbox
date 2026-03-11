"use client"

import { createContext, useCallback, useContext, type ReactNode } from "react"
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
  const logout = useCallback(async () => {
    let cleared = false
    for (let attempt = 0; attempt < 2 && !cleared; attempt++) {
      try {
        const res = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
          cache: "no-store"
        })
        // Consume the body so the browser fully processes the response
        // (including Set-Cookie) before we navigate away.
        await res.json().catch(() => {})
        cleared = res.ok
      } catch {
        // Network error — retry once.
      }
    }
    window.location.assign("/login")
  }, [])

  const value: AuthContextValue = {
    user,
    cylos,
    isAdmin: user.roles === "admin" || user.roles === "superadmin",
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
