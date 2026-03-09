"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Bug, ChevronDown, ChevronUp, RotateCcw, X } from "lucide-react"
import type { InstalledApp } from "@/api/installed-apps/hooks/use-installed-apps"
import { queryKeys } from "@/constants/query-keys"

/* -------------------------------------------------------------------------- */
/*  Dev-only guard                                                             */
/* -------------------------------------------------------------------------- */

const IS_DEV = process.env.NODE_ENV === "development"

/* -------------------------------------------------------------------------- */
/*  Status config                                                              */
/* -------------------------------------------------------------------------- */

interface StatusConfig {
  label: string
  color: string // hex, used for button/badge
  description: string
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  online: {
    label: "Online",
    color: "#22c55e",
    description: "state=1, enabled"
  },
  offline: {
    label: "Offline",
    color: "#ef4444",
    description: "state=0, enabled"
  },
  inactive: {
    label: "Inactive",
    color: "#71717a",
    description: "enabled=false"
  },
  installing: {
    label: "Installing",
    color: "#3b82f6",
    description: "installing=true"
  },
  updating: {
    label: "Updating",
    color: "#6366f1",
    description: "updating=true"
  },
  deleting: {
    label: "Deleting",
    color: "#dc2626",
    description: "deleting=true"
  }
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG)

/* -------------------------------------------------------------------------- */
/*  Persistence                                                                */
/* -------------------------------------------------------------------------- */

interface AppOverride {
  status: string
  cylo_id: number
  display_name: string
  cylo_name: string
}

type OverridesMap = Record<number, AppOverride> // appId → override

const OVERRIDES_KEY = "installed-app-dev-panel-overrides"
const COLLAPSED_KEY = "installed-app-dev-panel-collapsed"

function loadOverrides(): OverridesMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveOverrides(o: OverridesMap) {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o))
  } catch {
    /* noop */
  }
}

/* -------------------------------------------------------------------------- */
/*  Public export (dev-only guard)                                            */
/* -------------------------------------------------------------------------- */

interface InstalledAppDevPanelProps {
  /** Pass the full loaded app list so the panel can populate its picker. */
  apps: InstalledApp[]
}

export function InstalledAppDevPanel({ apps }: InstalledAppDevPanelProps) {
  if (!IS_DEV) return null
  return <PanelInner apps={apps} />
}

/* -------------------------------------------------------------------------- */
/*  Inner component                                                            */
/* -------------------------------------------------------------------------- */

function PanelInner({ apps }: InstalledAppDevPanelProps) {
  const queryClient = useQueryClient()

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(COLLAPSED_KEY) === "true"
  })

  const [selectedId, setSelectedId] = useState<number | "">("")
  const [overrides, setOverrides] = useState<OverridesMap>(loadOverrides)
  const [search, setSearch] = useState("")

  /* Re-apply persisted overrides once the apps list is available */
  const appliedOnMount = useRef(false)
  useEffect(() => {
    if (appliedOnMount.current || !apps.length) return
    const saved = loadOverrides()
    if (!Object.keys(saved).length) return
    appliedOnMount.current = true
    // Patch each saved override back into the cache
    for (const [idStr, ov] of Object.entries(saved)) {
      const id = Number(idStr)
      patchCaches(id, ov.cylo_id, ov.status)
    }
  }, [apps]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Cache patching ---- */
  const patchCaches = useCallback(
    (appId: number, cyloId: number, status: string) => {
      const patch = (app: InstalledApp) =>
        app.id === appId ? { ...app, status } : app

      queryClient.setQueryData<InstalledApp[]>(
        queryKeys.installedApps.all,
        (prev) => prev?.map(patch)
      )
      queryClient.setQueryData<InstalledApp[]>(
        queryKeys.installedApps.byCylo(cyloId),
        (prev) => prev?.map(patch)
      )
      // Also patch the detail cache if it exists
      queryClient.setQueryData<InstalledApp>(
        queryKeys.installedApps.detail(appId),
        (prev) => (prev ? { ...prev, status } : prev)
      )
    },
    [queryClient]
  )

  /* ---- Apply a status override to an app ---- */
  function applyStatus(appId: number, status: string) {
    const app = apps.find((a) => a.id === appId)
    if (!app) return

    const ov: AppOverride = {
      status,
      cylo_id: app.cylo_id,
      display_name: app.display_name,
      cylo_name: app.cylo_name
    }

    const next = { ...overrides, [appId]: ov }
    setOverrides(next)
    saveOverrides(next)
    patchCaches(appId, app.cylo_id, status)
  }

  /* ---- Clear a single override ---- */
  function clearOverride(appId: number) {
    const { [appId]: removed, ...rest } = overrides
    setOverrides(rest)
    saveOverrides(rest)
    if (removed) {
      // Invalidate so real data is re-fetched
      queryClient.invalidateQueries({ queryKey: queryKeys.installedApps.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.byCylo(removed.cylo_id)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.detail(appId)
      })
    }
  }

  /* ---- Reset all overrides ---- */
  function resetAll() {
    setOverrides({})
    saveOverrides({})
    setSelectedId("")
    queryClient.invalidateQueries({ queryKey: queryKeys.installedApps.all })
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSED_KEY, String(next))
      return next
    })
  }

  /* ---- Derived state ---- */
  const overrideCount = Object.keys(overrides).length
  const selectedApp = apps.find((a) => a.id === Number(selectedId))
  const currentStatus = selectedApp
    ? (overrides[selectedApp.id]?.status ?? selectedApp.status)
    : null

  // Group apps by cylo for the picker, filtered by search
  const filteredApps = search.trim()
    ? apps.filter(
        (a) =>
          a.display_name.toLowerCase().includes(search.toLowerCase()) ||
          a.cylo_name.toLowerCase().includes(search.toLowerCase())
      )
    : apps

  const grouped = filteredApps.reduce<Record<string, InstalledApp[]>>(
    (acc, app) => {
      ;(acc[app.cylo_name] ??= []).push(app)
      return acc
    },
    {}
  )

  const overriddenEntries = Object.entries(overrides) as [string, AppOverride][]

  return (
    <div className="fixed bottom-4 right-4 z-9999 w-80 rounded-lg border border-amber-500/40 bg-card shadow-xl">
      {/* ── Header ── */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex w-full items-center justify-between gap-2 rounded-t-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400"
      >
        <span className="flex items-center gap-1.5">
          <Bug className="size-3.5" />
          Dev: App States
          {overrideCount > 0 && (
            <span className="rounded-full bg-amber-500/25 px-1.5 py-0.5 text-[10px] tabular-nums">
              {overrideCount} active
            </span>
          )}
        </span>
        {collapsed ? (
          <ChevronUp className="size-3.5" />
        ) : (
          <ChevronDown className="size-3.5" />
        )}
      </button>

      {/* ── Body ── */}
      {!collapsed && (
        <div className="space-y-3 px-3 py-2.5">
          {/* Search + picker */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Target App
            </p>

            {/* Search filter */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter apps…"
              className="w-full rounded border border-border bg-muted/40 px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />

            {/* App select */}
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(Number(e.target.value) || "")}
              className="w-full rounded border border-border bg-muted/40 px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            >
              <option value="">— Choose an app —</option>
              {Object.entries(grouped).map(([cyloName, cyloApps]) => (
                <optgroup key={cyloName} label={cyloName}>
                  {cyloApps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.display_name}
                      {app.domain ? ` — ${app.domain}` : ""}
                      {overrides[app.id]
                        ? ` [${overrides[app.id].status}]`
                        : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Status buttons */}
          {selectedApp && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Set Status for{" "}
                <span className="text-amber-500">
                  {selectedApp.display_name}
                </span>
              </p>
              <div className="grid grid-cols-3 gap-1">
                {ALL_STATUSES.map((status) => {
                  const cfg = STATUS_CONFIG[status]
                  const isActive = currentStatus === status
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => applyStatus(selectedApp.id, status)}
                      title={cfg.description}
                      className="rounded px-2 py-1 text-[11px] font-medium transition-all"
                      style={
                        isActive
                          ? {
                              background: `${cfg.color}30`,
                              color: cfg.color,
                              outline: `1.5px solid ${cfg.color}60`
                            }
                          : {
                              background: "transparent",
                              color: "hsl(var(--muted-foreground))",
                              outline: "1px solid hsl(var(--border))"
                            }
                      }
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>

              {/* Current status label */}
              <p className="text-[10px] text-muted-foreground/60">
                Current:{" "}
                <span
                  className="font-semibold"
                  style={{
                    color: STATUS_CONFIG[currentStatus ?? "offline"]?.color
                  }}
                >
                  {currentStatus}
                </span>
                {overrides[selectedApp.id] && (
                  <span className="ml-1 text-amber-500">(overridden)</span>
                )}
              </p>
            </div>
          )}

          {/* Active overrides list */}
          {overriddenEntries.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Active Overrides ({overriddenEntries.length})
              </p>
              <div className="max-h-36 space-y-0.5 overflow-y-auto rounded border border-border/50 bg-muted/20 p-1.5">
                {overriddenEntries.map(([idStr, ov]) => {
                  const appId = Number(idStr)
                  const cfg = STATUS_CONFIG[ov.status]
                  return (
                    <div
                      key={appId}
                      className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-[11px] hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="truncate font-medium">
                          {ov.display_name}
                        </span>
                        <span className="ml-1 text-muted-foreground/60">
                          {ov.cylo_name}
                        </span>
                      </div>
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                        style={{
                          background: `${cfg?.color}25`,
                          color: cfg?.color
                        }}
                      >
                        {ov.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => clearOverride(appId)}
                        className="shrink-0 rounded p-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                        title="Clear override"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Reset */}
          <button
            type="button"
            onClick={resetAll}
            disabled={overrideCount === 0}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-muted px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="size-3" />
            Reset all to real data
          </button>

          {/* Status reference */}
          <details className="group">
            <summary className="cursor-pointer text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 hover:text-muted-foreground">
              State reference ▸
            </summary>
            <div className="mt-1.5 space-y-0.5">
              {ALL_STATUSES.map((status) => {
                const cfg = STATUS_CONFIG[status]
                return (
                  <div
                    key={status}
                    className="flex items-center gap-2 text-[10px]"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: cfg.color }}
                    />
                    <span className="font-medium" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="text-muted-foreground/50">
                      {cfg.description}
                    </span>
                  </div>
                )
              })}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
