"use client"

import { useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
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

function inferLabel(
  pathname: string,
  labels: {
    appStore: string
    installedApps: string
    appboxes: string
    abuseReports: string
    dashboard: string
    back: string
  }
): string {
  if (pathname.includes("/appstore")) return labels.appStore
  if (pathname.includes("/appboxmanager/installedapps")) {
    return labels.installedApps
  }
  if (pathname.includes("/appboxmanager/appboxes")) return labels.appboxes
  if (pathname.includes("/account/abuse")) return labels.abuseReports
  if (pathname.includes("/dashboard")) return labels.dashboard
  return labels.back
}

export function RouteHistoryTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const sidebarT = useTranslations("dashboard.sidebar")
  const appDetailT = useTranslations("appboxmanager.appDetail")

  const href = useMemo(() => {
    const query = searchParams?.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  const labels = useMemo(
    () => ({
      appStore: sidebarT("appstore"),
      installedApps: appDetailT("backToInstalledApps"),
      appboxes: sidebarT("appboxes"),
      abuseReports: sidebarT("abuse_reports"),
      dashboard: sidebarT("dashboard"),
      back: appDetailT("backToDashboard")
    }),
    [appDetailT, sidebarT]
  )

  useEffect(() => {
    if (!href) return

    const history = readHistory()
    const last = history[history.length - 1]
    const label = inferLabel(pathname, labels)
    if (last?.href === href) {
      if (last.label !== label) {
        last.label = label
        last.ts = Date.now()
        writeHistory(history)
      }
      return
    }

    history.push({
      href,
      label,
      ts: Date.now()
    })
    writeHistory(history)
  }, [href, labels, pathname])

  return null
}
