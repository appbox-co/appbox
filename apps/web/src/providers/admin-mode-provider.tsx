"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode
} from "react"
import { usePathname } from "@/i18n/routing"

const STORAGE_KEY = "admin-mode-preferred"
const ADMIN_PATH_PREFIX = "/dashboard/admin"
const PREFERENCE_EVENT = "admin-mode-preference-change"

interface AdminModeContextValue {
  isAdminMode: boolean
  toggleAdminMode: () => void
}

const AdminModeContext = createContext<AdminModeContextValue>({
  isAdminMode: false,
  toggleAdminMode: () => {}
})

export function useAdminMode() {
  return useContext(AdminModeContext)
}

function subscribeToPreferenceChanges(callback: () => void) {
  const onChange = () => callback()
  window.addEventListener("storage", onChange)
  window.addEventListener(PREFERENCE_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(PREFERENCE_EVENT, onChange)
  }
}

function readPreferredAdminMode() {
  return localStorage.getItem(STORAGE_KEY) === "true"
}

function readPreferredAdminModeServer() {
  return false
}

function writePreferredAdminMode(next: boolean) {
  localStorage.setItem(STORAGE_KEY, String(next))
  window.dispatchEvent(new Event(PREFERENCE_EVENT))
}

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith(ADMIN_PATH_PREFIX)

  const preferAdmin = useSyncExternalStore(
    subscribeToPreferenceChanges,
    readPreferredAdminMode,
    readPreferredAdminModeServer
  )

  useEffect(() => {
    if (isAdminRoute && !preferAdmin) {
      writePreferredAdminMode(true)
    }
  }, [isAdminRoute, preferAdmin])

  const isAdminMode = isAdminRoute || preferAdmin

  const toggleAdminMode = useCallback(() => {
    const next = !preferAdmin
    writePreferredAdminMode(next)
    if (next) {
      window.location.assign("/dashboard/admin")
    } else {
      window.location.assign("/dashboard")
    }
  }, [preferAdmin])

  const value = useMemo(
    () => ({ isAdminMode, toggleAdminMode }),
    [isAdminMode, toggleAdminMode]
  )

  return (
    <AdminModeContext.Provider value={value}>
      {children}
    </AdminModeContext.Provider>
  )
}
