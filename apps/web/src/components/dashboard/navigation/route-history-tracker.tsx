"use client"

import { useEffect, useMemo } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const HISTORY_KEY = "appbox.backHistory.v1"
const MAX_ENTRIES = 50

interface HistoryEntry {
  href: string
  label: string
  ts: number
}

function readHistory(): HistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry) =>
        entry &&
        typeof entry.href === "string" &&
        typeof entry.label === "string" &&
        typeof entry.ts === "number"
    )
  } catch {
    return []
  }
}

function writeHistory(entries: HistoryEntry[]) {
  sessionStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(entries.slice(-MAX_ENTRIES))
  )
}

function inferLabel(pathname: string): string {
  if (pathname.includes("/appstore")) return "App Store"
  if (pathname.includes("/appboxmanager/installedapps")) return "Installed Apps"
  if (pathname.includes("/appboxmanager/appboxes")) return "Appboxes"
  if (pathname.includes("/account/abuse")) return "Abuse Reports"
  if (pathname.includes("/dashboard")) return "Dashboard"
  return "Back"
}

export function RouteHistoryTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const href = useMemo(() => {
    const query = searchParams?.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  useEffect(() => {
    if (!href) return

    const history = readHistory()
    const last = history[history.length - 1]
    if (last?.href === href) return

    history.push({
      href,
      label: inferLabel(pathname),
      ts: Date.now()
    })
    writeHistory(history)
  }, [href, pathname])

  return null
}
