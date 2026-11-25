"use client"

import { createContext, useCallback, useContext, type ReactNode } from "react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/routing"
import { isAdminRole } from "@/lib/auth/roles"
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
  /** Where signing out lands. The Kumo prototype passes its own sign-in page. */
  signInPath?: string
}

export function AuthProvider({
  children,
  user,
  cylos,
  signInPath = "/login"
}: AuthProviderProps) {
  const router = useRouter()

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
    if (!cleared) {
      // The session cookie is HttpOnly, so only the server can clear it.
      // Leaving the page would look like a logout while the session stays
      // live in this browser.
      toast.error("Couldn't log you out. Check your connection and try again.")
      return
    }
    router.replace(signInPath)
  }, [router, signInPath])

  const value: AuthContextValue = {
    user,
    cylos,
    isAdmin: isAdminRole(user.roles),
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
