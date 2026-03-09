"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Bug, ChevronDown, ChevronUp, RotateCcw } from "lucide-react"
import type {
  CyloDetail,
  CyloDiskQuota,
  LowQuotaDetails,
  MigrationProgress,
  ThrottleDetails
} from "@/api/cylos/cylos"
import { queryKeys } from "@/constants/query-keys"

/* -------------------------------------------------------------------------- */
/*  Only render in development                                                 */
/* -------------------------------------------------------------------------- */

const IS_DEV = process.env.NODE_ENV === "development"

/* -------------------------------------------------------------------------- */
/*  Mock data generators (realistic values matching backend APIs)               */
/* -------------------------------------------------------------------------- */

function isoFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString()
}

/** Derive migration phase from progress percentage */
function phaseFromPercent(pct: number): number {
  if (pct < 5) return 1
  if (pct < 10) return 2
  if (pct < 15) return 3
  if (pct < 20) return 4
  if (pct < 75) return 5
  if (pct < 85) return 6
  if (pct < 95) return 7
  return 8
}

function makeMigrationProgress(
  complete: number,
  live: boolean
): MigrationProgress {
  const phase = phaseFromPercent(complete)
  const preMigrationBytes = 1073741824000 // ~1000 GiB
  const totalSent = Math.round((complete / 100) * preMigrationBytes)

  return {
    phase,
    complete,
    live_migration: live ? 1 : 0,
    total_sent: totalSent,
    pre_migration_space_used: String(preMigrationBytes),
    reason: "Server hardware upgrade scheduled",
    ETA: isoFromNow(Math.max(5, Math.round((100 - complete) * 0.5))),
    avg_speed: "45.20 MB/s",
    old_server_name: "cylo06.ata.ams3.nl",
    new_server_name: "cylo09.ata.ams3.nl",
    transferred_percent: complete
  }
}

function makeThrottleDetails(): ThrottleDetails {
  return {
    throttle_level: 2,
    throttle_rate_mbps: 50.0,
    throttle_iops: 500,
    expires_at: isoFromNow(240),
    app_instance_domain: "plex.user123.appboxes.co",
    top_process_name: "rclone",
    disk_util_percent: 87,
    duration_minutes: 120
  }
}

function makeLowQuotaDetails(): LowQuotaDetails {
  return {
    available_kib: 2097152 // 2 GiB in KiB
  }
}

function makeLowQuotaQuota(storageTotal: number): CyloDiskQuota {
  // Near-full: total minus ~2 GB
  return { used_gb: Math.max(0, storageTotal - 2) }
}

/* -------------------------------------------------------------------------- */
/*  State flags                                                                */
/* -------------------------------------------------------------------------- */

interface DevFlags {
  offline: boolean
  suspended: boolean
  migrating: boolean
  liveMigrating: boolean
  lowQuota: boolean
  throttled: boolean
  migrationPercent: number
}

const DEFAULT_FLAGS: DevFlags = {
  offline: false,
  suspended: false,
  migrating: false,
  liveMigrating: false,
  lowQuota: false,
  throttled: false,
  migrationPercent: 65
}

const STORAGE_KEY = (id: number) => `cylo-dev-panel-${id}`

function loadFlags(id: number): DevFlags {
  if (typeof window === "undefined") return DEFAULT_FLAGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY(id))
    if (!raw) return DEFAULT_FLAGS
    return { ...DEFAULT_FLAGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_FLAGS
  }
}

function saveFlags(id: number, flags: DevFlags) {
  try {
    localStorage.setItem(STORAGE_KEY(id), JSON.stringify(flags))
  } catch {
    // ignore
  }
}

/* -------------------------------------------------------------------------- */
/*  Status flags are mutually exclusive                                        */
/* -------------------------------------------------------------------------- */

type StatusFlag = "offline" | "suspended" | "migrating" | "liveMigrating"
const STATUS_FLAGS: StatusFlag[] = [
  "offline",
  "suspended",
  "migrating",
  "liveMigrating"
]

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface CyloDevPanelProps {
  cyloId: number
}

export function CyloDevPanel({ cyloId }: CyloDevPanelProps) {
  if (!IS_DEV) return null
  return <CyloDevPanelInner cyloId={cyloId} />
}

function CyloDevPanelInner({ cyloId }: CyloDevPanelProps) {
  const queryClient = useQueryClient()
  const originalCyloRef = useRef<CyloDetail | null>(null)

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("cylo-dev-panel-collapsed") === "true"
  })

  const [flags, setFlags] = useState<DevFlags>(() => loadFlags(cyloId))

  // Capture the original cylo data on first render
  useEffect(() => {
    const data = queryClient.getQueryData<CyloDetail>(
      queryKeys.cylos.detail(cyloId)
    )
    if (data && !originalCyloRef.current) {
      originalCyloRef.current = { ...data }
    }
  }, [cyloId, queryClient])

  // Apply flags to cache whenever they change
  const applyFlags = useCallback(
    (f: DevFlags) => {
      const original = originalCyloRef.current
      if (!original) return

      const patched = { ...original }

      // Clear all state flags first
      patched.is_migrating = false
      patched.is_throttled = false
      patched.is_low_quota = false
      patched.migration_progress = undefined
      patched.throttle_details = undefined
      patched.low_quota_details = undefined
      patched.status = original.status

      // Apply status flags (mutually exclusive)
      if (f.offline) {
        patched.status = "offline"
      } else if (f.suspended) {
        patched.status = "suspended"
      } else if (f.migrating) {
        patched.status = "migrating"
        patched.is_migrating = true
        patched.migration_progress = makeMigrationProgress(
          f.migrationPercent,
          false
        )
      } else if (f.liveMigrating) {
        patched.status = "migrating"
        patched.is_migrating = true
        patched.migration_progress = makeMigrationProgress(
          f.migrationPercent,
          true
        )
      }

      // Apply additive flags
      if (f.lowQuota) {
        patched.is_low_quota = true
        patched.low_quota_details = makeLowQuotaDetails()
        // Also inject near-full quota into the quota cache
        queryClient.setQueryData<CyloDiskQuota>(
          queryKeys.cylos.quota(cyloId),
          makeLowQuotaQuota(original.storage_total)
        )
      }

      if (f.throttled) {
        patched.is_throttled = true
        patched.throttle_details = makeThrottleDetails()
      }

      queryClient.setQueryData<CyloDetail>(
        queryKeys.cylos.detail(cyloId),
        patched
      )
    },
    [cyloId, queryClient]
  )

  // Re-apply on mount if flags were persisted
  useEffect(() => {
    const hasAnyFlag = Object.entries(flags).some(
      ([k, v]) => k !== "migrationPercent" && v === true
    )
    if (hasAnyFlag) {
      // Wait for original data to be captured
      const timer = setTimeout(() => applyFlags(flags), 100)
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function updateFlags(patch: Partial<DevFlags>) {
    setFlags((prev) => {
      const next = { ...prev, ...patch }
      saveFlags(cyloId, next)
      applyFlags(next)
      return next
    })
  }

  function toggleStatus(flag: StatusFlag) {
    const wasActive = flags[flag]
    const reset: Partial<DevFlags> = {}
    for (const f of STATUS_FLAGS) reset[f] = false
    if (!wasActive) reset[flag] = true
    updateFlags(reset)
  }

  function toggleAdditiveFlag(flag: "lowQuota" | "throttled") {
    updateFlags({ [flag]: !flags[flag] })
  }

  function handleReset() {
    const resetFlags = { ...DEFAULT_FLAGS }
    setFlags(resetFlags)
    saveFlags(cyloId, resetFlags)

    // Invalidate to re-fetch real data
    queryClient.invalidateQueries({ queryKey: queryKeys.cylos.detail(cyloId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.cylos.quota(cyloId) })
    originalCyloRef.current = null
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("cylo-dev-panel-collapsed", String(next))
      return next
    })
  }

  const hasAnyFlag = Object.entries(flags).some(
    ([k, v]) => k !== "migrationPercent" && v === true
  )

  return (
    <div className="fixed bottom-4 right-4 z-9999 w-72 rounded-lg border border-amber-500/40 bg-card shadow-xl">
      {/* Header */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex w-full items-center justify-between gap-2 rounded-t-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400"
      >
        <span className="flex items-center gap-1.5">
          <Bug className="size-3.5" />
          Dev: Cylo States
          {hasAnyFlag && (
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px]">
              active
            </span>
          )}
        </span>
        {collapsed ? (
          <ChevronUp className="size-3.5" />
        ) : (
          <ChevronDown className="size-3.5" />
        )}
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="space-y-1 px-3 py-2">
          {/* Status flags (mutually exclusive) */}
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Status (exclusive)
          </p>

          <label className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
            <input
              type="checkbox"
              checked={flags.offline}
              onChange={() => toggleStatus("offline")}
              className="size-3.5 rounded border-muted-foreground accent-red-500"
            />
            <span>Offline</span>
            <span className="text-muted-foreground">(state=0)</span>
          </label>

          <label className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
            <input
              type="checkbox"
              checked={flags.suspended}
              onChange={() => toggleStatus("suspended")}
              className="size-3.5 rounded border-muted-foreground accent-amber-500"
            />
            <span>Suspended</span>
            <span className="text-muted-foreground">(enabled=0)</span>
          </label>

          <label className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
            <input
              type="checkbox"
              checked={flags.migrating}
              onChange={() => toggleStatus("migrating")}
              className="size-3.5 rounded border-muted-foreground accent-blue-500"
            />
            <span>Migrating</span>
          </label>

          {/* Migration slider */}
          {(flags.migrating || flags.liveMigrating) && (
            <div className="pl-5 pb-1">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>Phase {phaseFromPercent(flags.migrationPercent)}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={flags.migrationPercent}
                  onChange={(e) =>
                    updateFlags({ migrationPercent: Number(e.target.value) })
                  }
                  className="h-1.5 flex-1 cursor-pointer accent-blue-500"
                />
                <span className="w-7 text-right">
                  {flags.migrationPercent}%
                </span>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
            <input
              type="checkbox"
              checked={flags.liveMigrating}
              onChange={() => toggleStatus("liveMigrating")}
              className="size-3.5 rounded border-muted-foreground accent-blue-500"
            />
            <span>Live Migrating</span>
          </label>

          {/* Additive flags */}
          <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Flags (additive)
          </p>

          <label className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
            <input
              type="checkbox"
              checked={flags.lowQuota}
              onChange={() => toggleAdditiveFlag("lowQuota")}
              className="size-3.5 rounded border-muted-foreground accent-amber-500"
            />
            <span>Low Quota</span>
            <span className="text-muted-foreground">(2 GiB free)</span>
          </label>

          <label className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
            <input
              type="checkbox"
              checked={flags.throttled}
              onChange={() => toggleAdditiveFlag("throttled")}
              className="size-3.5 rounded border-muted-foreground accent-red-500"
            />
            <span>Throttled</span>
            <span className="text-muted-foreground">(L2, 50 MB/s)</span>
          </label>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-muted px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Reset to real data
          </button>
        </div>
      )}
    </div>
  )
}
