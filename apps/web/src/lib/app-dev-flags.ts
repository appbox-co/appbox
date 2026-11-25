/**
 * Shared dev-only flag communication between AppDevPanel and InstallDialog.
 * Uses localStorage + a custom DOM event so the install dialog can react
 * when the dev panel toggles a guard state.
 */

import { useEffect, useState } from "react"

const IS_DEV = process.env.NODE_ENV === "development"
const EVENT_NAME = "app-dev-flags-changed"

export interface AppDevFlags {
  appDisabled: boolean
  noCylos: boolean
  singleRestricted: boolean
  allRestricted: boolean
  mostRestricted: boolean
  someRestricted: boolean
  singleNoSlots: boolean
  noSlots: boolean
  mostNoSlots: boolean
  someNoSlots: boolean
  singleNoMulti: boolean
  noMulti: boolean
  mostNoMulti: boolean
  someNoMulti: boolean
  simulateUser: boolean
}

function storageKey(appId: number) {
  return `app-dev-panel-${appId}`
}

export function readAppDevFlags(appId: number): AppDevFlags | null {
  if (!IS_DEV || typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(storageKey(appId))
    if (!raw) return null
    return JSON.parse(raw) as AppDevFlags
  } catch {
    return null
  }
}

/** Called by the dev panel after saving flags */
export function notifyAppDevFlagsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME))
  }
}

/**
 * Hook for consumers (e.g. InstallDialog) to reactively read dev flags.
 * Returns null in production or when no flags are set.
 */
export function useAppDevFlags(appId: number): AppDevFlags | null {
  const [flags, setFlags] = useState<AppDevFlags | null>(() =>
    readAppDevFlags(appId)
  )

  useEffect(() => {
    if (!IS_DEV) return

    const handler = () => setFlags(readAppDevFlags(appId))
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [appId])

  return IS_DEV ? flags : null
}
