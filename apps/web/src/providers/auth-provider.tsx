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
    try {
      const response = await fetch("/api/auth/logout?debug=1", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        keepalive: true
      })
      const data = await response.json().catch(() => null)
      if (data?.debug) {
        const pretty = JSON.stringify(data.debug, null, 2)
        console.debug(`[logout debug json]\n${pretty}`)
        Object.entries(data.debug as Record<string, unknown>).forEach(
          ([key, value]) => {
            const rendered =
              typeof value === "string" ? value : JSON.stringify(value)
            console.debug(`[logout debug] ${key}: ${rendered}`)
          }
        )
      }
    } catch {
      // Ignore errors
    }
    // Force a full navigation so middleware/session checks use fresh cookies.
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
