"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Bug, ChevronDown, ChevronUp, RotateCcw } from "lucide-react"
import type { CyloDetail } from "@/api/cylos/cylos"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { queryKeys } from "@/constants/query-keys"
import type { JobProgressData } from "@/lib/websocket/types"

/* -------------------------------------------------------------------------- */
/*  Dev-only guard                                                             */
/* -------------------------------------------------------------------------- */

const IS_DEV = process.env.NODE_ENV === "development"

/* -------------------------------------------------------------------------- */
/*  Status config                                                              */
/* -------------------------------------------------------------------------- */

interface StatusConfig {
  label: string
  color: string
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
/*  Fake update version injected when hasUpdate flag is on                    */
/* -------------------------------------------------------------------------- */

const FAKE_UPDATE: InstalledApp["available_versions"][number] = {
  id: 99999,
  version: "999.9.9"
}

/* -------------------------------------------------------------------------- */
/*  Persistence                                                                */
/* -------------------------------------------------------------------------- */

interface SimulatedJob {
  status: string
}

interface DevFlags {
  status: string | null // null = use real status
  hasUpdate: boolean
  job: SimulatedJob | null
  cyloSuspended: boolean
}

const DEFAULT_FLAGS: DevFlags = {
  status: null,
  hasUpdate: false,
  job: null,
  cyloSuspended: false
}

const DEFAULT_JOB: SimulatedJob = {
  status: "Downloading Docker image..."
}

const DEFAULT_COMMAND_JOB: SimulatedJob = {
  status: "Running command..."
}

function storageKey(appId: number) {
  return `app-dev-panel-${appId}`
}
const COLLAPSED_KEY = "app-dev-panel-collapsed"

function loadFlags(appId: number): DevFlags {
  if (typeof window === "undefined") return DEFAULT_FLAGS
  try {
    const raw = localStorage.getItem(storageKey(appId))
    return raw ? { ...DEFAULT_FLAGS, ...JSON.parse(raw) } : DEFAULT_FLAGS
  } catch {
    return DEFAULT_FLAGS
  }
}

function saveFlags(appId: number, flags: DevFlags) {
  try {
    localStorage.setItem(storageKey(appId), JSON.stringify(flags))
  } catch {
    /* noop */
  }
}

/* -------------------------------------------------------------------------- */
/*  Public export                                                              */
/* -------------------------------------------------------------------------- */

interface AppDevPanelProps {
  appId: number
  onJobChange: (job: JobProgressData | undefined) => void
}

export function AppDevPanel({ appId, onJobChange }: AppDevPanelProps) {
  if (!IS_DEV) return null
  return <PanelInner appId={appId} onJobChange={onJobChange} />
}

/* -------------------------------------------------------------------------- */
/*  Inner component                                                            */
/* -------------------------------------------------------------------------- */

function PanelInner({ appId, onJobChange }: AppDevPanelProps) {
  const queryClient = useQueryClient()
  const originalRef = useRef<InstalledApp | null>(null)
  const originalCyloRef = useRef<CyloDetail | null>(null)
  const [originalForDisplay, setOriginalForDisplay] =
    useState<InstalledApp | null>(null)

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(COLLAPSED_KEY) === "true"
  })
  const [flags, setFlags] = useState<DevFlags>(() => loadFlags(appId))

  /* ── Capture originals on first render ── */
  useEffect(() => {
    const data = queryClient.getQueryData<InstalledApp>(
      queryKeys.installedApps.detail(appId)
    )
    if (data && !originalRef.current) {
      const snapshot = { ...data }
      originalRef.current = snapshot
      queueMicrotask(() => setOriginalForDisplay(snapshot))
      // Also capture the cylo at this point — it may or may not be cached yet
      const cylo = queryClient.getQueryData<CyloDetail>(
        queryKeys.cylos.detail(data.cylo_id)
      )
      if (cylo && !originalCyloRef.current) {
        originalCyloRef.current = { ...cylo }
      }
    }
  }, [appId, queryClient])

  /* ── Apply flags to cache ── */
  const applyFlags = useCallback(
    (f: DevFlags) => {
      const original = originalRef.current
      if (!original) return

      const patched: InstalledApp = {
        ...original,
        status: f.status ?? original.status,
        available_versions: f.hasUpdate
          ? [
              FAKE_UPDATE,
              ...original.available_versions.filter(
                (v) => v.id !== FAKE_UPDATE.id
              )
            ]
          : original.available_versions.filter((v) => v.id !== FAKE_UPDATE.id)
      }

      // Patch the detail cache (this page)
      queryClient.setQueryData<InstalledApp>(
        queryKeys.installedApps.detail(appId),
        patched
      )

      // Also patch the list and byCylo caches so the status badge is consistent
      const applyToList = (prev: InstalledApp[] | undefined) =>
        prev?.map((a) =>
          a.id === appId ? { ...a, status: patched.status } : a
        )

      queryClient.setQueryData<InstalledApp[]>(
        queryKeys.installedApps.all,
        applyToList
      )
      queryClient.setQueryData<InstalledApp[]>(
        queryKeys.installedApps.byCylo(original.cylo_id),
        applyToList
      )

      // Patch or restore the cylo suspended state
      const existingCylo = queryClient.getQueryData<CyloDetail>(
        queryKeys.cylos.detail(original.cylo_id)
      )
      if (existingCylo) {
        // Capture original cylo status the first time we see it
        if (!originalCyloRef.current) {
          originalCyloRef.current = { ...existingCylo }
        }
        queryClient.setQueryData<CyloDetail>(
          queryKeys.cylos.detail(original.cylo_id),
          {
            ...existingCylo,
            status: f.cyloSuspended
              ? "suspended"
              : (originalCyloRef.current?.status ?? existingCylo.status)
          }
        )
      }

      // Write or clear the simulated job progress via the page's state setter
      if (f.job) {
        onJobChange({
          job_id: 0,
          cylo_id: original.cylo_id,
          instance_id: appId,
          status: f.job.status
        })
      } else {
        onJobChange(undefined)
      }
    },
    [appId, queryClient, onJobChange]
  )

  /* ── Re-apply persisted flags on mount once original is captured ── */
  useEffect(() => {
    const hasOverride =
      flags.status !== null ||
      flags.hasUpdate ||
      flags.cyloSuspended ||
      flags.job !== null
    if (!hasOverride) return
    const timer = setTimeout(() => applyFlags(flags), 100)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function updateFlags(patch: Partial<DevFlags>) {
    setFlags((prev) => {
      const next = { ...prev, ...patch }
      saveFlags(appId, next)
      applyFlags(next)
      return next
    })
  }

  function handleReset() {
    const cyloId = originalRef.current?.cylo_id
    const next = { ...DEFAULT_FLAGS }
    setFlags(next)
    saveFlags(appId, next)
    originalRef.current = null
    originalCyloRef.current = null
    setOriginalForDisplay(null)
    onJobChange(undefined)
    queryClient.invalidateQueries({
      queryKey: queryKeys.installedApps.detail(appId)
    })
    queryClient.invalidateQueries({ queryKey: queryKeys.installedApps.all })
    if (cyloId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cylos.detail(cyloId)
      })
    }
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSED_KEY, String(next))
      return next
    })
  }

  /* ── Derived ── */
  const appName = originalForDisplay?.display_name ?? `App #${appId}`
  const hasOverride =
    flags.status !== null ||
    flags.hasUpdate ||
    flags.job !== null ||
    flags.cyloSuspended
  const isTransitionalStatus = flags.status
    ? ["installing", "updating", "deleting"].includes(flags.status)
    : false

  /* ── Determine what AppActions will see for each status ── */
  const buttonStates = (status: string) => {
    const isRunning = status === "online"
    const isStopped = status === "offline" || status === "inactive"
    const isTransitioning = ["installing", "updating", "deleting"].includes(
      status
    )
    return { isRunning, isStopped, isTransitioning }
  }

  return (
    <div className="fixed bottom-4 right-4 z-9999 w-72 rounded-lg border border-amber-500/40 bg-card shadow-xl">
      {/* ── Header ── */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex w-full items-center justify-between gap-2 rounded-t-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Bug className="size-3.5 shrink-0" />
          <span className="truncate">Dev: {appName}</span>
          {hasOverride && (
            <span className="shrink-0 rounded-full bg-amber-500/25 px-1.5 py-0.5 text-[10px]">
              active
            </span>
          )}
        </span>
        {collapsed ? (
          <ChevronUp className="size-3.5 shrink-0" />
        ) : (
          <ChevronDown className="size-3.5 shrink-0" />
        )}
      </button>

      {/* ── Body ── */}
      {!collapsed && (
        <div className="space-y-3 px-3 py-2.5">
          {/* ── Status section ── */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </p>

            <div className="grid grid-cols-3 gap-1">
              {ALL_STATUSES.map((status) => {
                const cfg = STATUS_CONFIG[status]
                const isActive = flags.status === status
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      updateFlags({ status: isActive ? null : status })
                    }
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

            {/* Effect preview */}
            {flags.status &&
              (() => {
                const { isRunning, isStopped, isTransitioning } = buttonStates(
                  flags.status
                )
                const cfg = STATUS_CONFIG[flags.status]
                return (
                  <div className="rounded bg-muted/40 px-2 py-1.5 text-[10px] space-y-0.5">
                    <p className="font-medium" style={{ color: cfg.color }}>
                      → {cfg.label}
                    </p>
                    <p className="text-muted-foreground">
                      Start:{" "}
                      {isRunning || isTransitioning ? "disabled" : "enabled"}
                      {" · "}
                      Stop:{" "}
                      {isStopped || isTransitioning ? "disabled" : "enabled"}
                      {" · "}
                      Restart:{" "}
                      {isStopped || isTransitioning ? "disabled" : "enabled"}
                    </p>
                  </div>
                )
              })()}
          </div>

          {/* ── Appbox section ── */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Appbox
            </p>

            <button
              type="button"
              onClick={() =>
                updateFlags({ cyloSuspended: !flags.cyloSuspended })
              }
              className="w-full rounded px-2 py-1 text-[11px] font-medium transition-all"
              style={
                flags.cyloSuspended
                  ? {
                      background: "#f59e0b30",
                      color: "#f59e0b",
                      outline: "1.5px solid #f59e0b60"
                    }
                  : {
                      background: "transparent",
                      color: "hsl(var(--muted-foreground))",
                      outline: "1px solid hsl(var(--border))"
                    }
              }
            >
              {flags.cyloSuspended ? "Suspended ✓" : "Suspended"}
            </button>

            {flags.cyloSuspended && (
              <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                Actions and version switch are hidden. Banner shown.
              </p>
            )}
          </div>

          {/* ── Flags section ── */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Flags
            </p>

            <label className="flex cursor-pointer items-center gap-2 py-0.5 text-xs">
              <input
                type="checkbox"
                checked={flags.hasUpdate}
                onChange={() => updateFlags({ hasUpdate: !flags.hasUpdate })}
                className="size-3.5 rounded accent-indigo-500"
              />
              <span>Has update available</span>
              <span className="text-muted-foreground">(v999.9.9)</span>
            </label>
          </div>

          {/* ── Job simulation ── */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Simulate Job
            </p>

            {/* Quick-start buttons */}
            <div className="grid grid-cols-2 gap-1">
              {/* Custom button job — app stays online, generic purple banner */}
              <button
                type="button"
                onClick={() =>
                  updateFlags({
                    status: flags.status,
                    job: flags.job ? null : { ...DEFAULT_COMMAND_JOB }
                  })
                }
                className="rounded px-2 py-1 text-[11px] font-medium transition-all"
                style={
                  flags.job && !isTransitionalStatus
                    ? {
                        background: "#8b5cf620",
                        color: "#8b5cf6",
                        outline: "1.5px solid #8b5cf660"
                      }
                    : {
                        background: "transparent",
                        color: "hsl(var(--muted-foreground))",
                        outline: "1px solid hsl(var(--border))"
                      }
                }
              >
                {flags.job && !isTransitionalStatus ? "✓ cmd job" : "+ cmd job"}
              </button>

              {/* Lifecycle job — sets installing + job */}
              <button
                type="button"
                onClick={() =>
                  isTransitionalStatus
                    ? updateFlags({
                        job: flags.job ? null : { ...DEFAULT_JOB }
                      })
                    : updateFlags({
                        status: "installing",
                        job: { ...DEFAULT_JOB }
                      })
                }
                className="rounded px-2 py-1 text-[11px] font-medium transition-all"
                style={
                  isTransitionalStatus && flags.job
                    ? {
                        background: "#3b82f620",
                        color: "#3b82f6",
                        outline: "1.5px solid #3b82f660"
                      }
                    : {
                        background: "transparent",
                        color: "hsl(var(--muted-foreground))",
                        outline: "1px solid hsl(var(--border))"
                      }
                }
              >
                {isTransitionalStatus && flags.job
                  ? "✓ install job"
                  : "+ install job"}
              </button>
            </div>

            {flags.job && (
              <div className="space-y-1.5 rounded bg-muted/40 px-2 py-2">
                <div>
                  <p className="mb-0.5 text-[9px] uppercase tracking-wider text-muted-foreground/60">
                    Status text
                  </p>
                  <input
                    type="text"
                    value={flags.job.status}
                    onChange={(e) =>
                      updateFlags({
                        job: { ...flags.job!, status: e.target.value }
                      })
                    }
                    className="w-full rounded border border-border/50 bg-background px-1.5 py-1 font-mono text-[10px] outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="relative h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 w-full animate-pulse rounded-full opacity-60"
                    style={{ background: "#3b82f6" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Reset ── */}
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasOverride}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-muted px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="size-3" />
            Reset to real data
          </button>

          {/* ── State reference ── */}
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
