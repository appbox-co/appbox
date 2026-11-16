"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Slider } from "@cloudflare/kumo"
import { useQueryClient } from "@tanstack/react-query"
import type {
  CyloDetail,
  CyloDiskQuota,
  LowQuotaDetails,
  MigrationProgress,
  ThrottleDetails
} from "@/api/cylos/cylos"
import { queryKeys } from "@/constants/query-keys"
import {
  DevCheck,
  DevPanel,
  DevReset,
  DevSection,
  IS_DEV
} from "../../_components/dev/dev-panel"

/*
 * State, storage and cache patching are the current design's Appbox panel,
 * kept under the same storage keys, so a state forced in either design shows
 * in both. What the panel looks like is new, and so is what Reset does once
 * the real data is back (see handleReset).
 */

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

function anyFlagOn(flags: DevFlags) {
  return Object.entries(flags).some(
    ([k, v]) => k !== "migrationPercent" && v === true
  )
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

interface AppboxDevPanelProps {
  cyloId: number
}

/**
 * Forces the states an Appbox can be in. Render it once the Appbox has
 * loaded: it takes its copy of the real one from the cache when it first
 * appears.
 */
export function AppboxDevPanel({ cyloId }: AppboxDevPanelProps) {
  if (!IS_DEV) return null
  return <AppboxDevPanelInner cyloId={cyloId} />
}

function AppboxDevPanelInner({ cyloId }: AppboxDevPanelProps) {
  const queryClient = useQueryClient()
  const originalCyloRef = useRef<CyloDetail | null>(null)

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
    if (anyFlagOn(flags)) {
      // Wait for original data to be captured
      const timer = setTimeout(() => applyFlags(flags), 100)
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function updateFlags(patch: Partial<DevFlags>) {
    const next = { ...flags, ...patch }
    setFlags(next)
    saveFlags(cyloId, next)
    applyFlags(next)
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

    // Invalidate to re-fetch real data, then take what arrives as the copy
    // the next override starts from. (The current design's panel drops its
    // copy here and never takes another, so after a reset its switches do
    // nothing until the page is reloaded.)
    const detailKey = queryKeys.cylos.detail(cyloId)
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: detailKey }),
      queryClient.invalidateQueries({ queryKey: queryKeys.cylos.quota(cyloId) })
    ]).then(() => {
      // A failed reload leaves the overridden Appbox in the cache.
      if (queryClient.getQueryState(detailKey)?.status !== "success") return
      const fresh = queryClient.getQueryData<CyloDetail>(detailKey)
      if (!fresh) return
      originalCyloRef.current = { ...fresh }
      // Anything switched on while the real data was loading
      const current = loadFlags(cyloId)
      if (anyFlagOn(current)) applyFlags(current)
    })
  }

  const hasAnyFlag = anyFlagOn(flags)

  const hint = (text: string) => (
    <span className="text-kumo-subtle"> ({text})</span>
  )

  return (
    <DevPanel
      title="Dev: Appbox states"
      active={hasAnyFlag && "active"}
      collapsedKey="cylo-dev-panel-collapsed"
    >
      {/* Status flags (mutually exclusive) */}
      <DevSection title="Status (one at a time)">
        <DevCheck
          checked={flags.offline}
          onToggle={() => toggleStatus("offline")}
          label={<>Offline{hint("state=0")}</>}
        />
        <DevCheck
          checked={flags.suspended}
          onToggle={() => toggleStatus("suspended")}
          label={<>Suspended{hint("enabled=0")}</>}
        />
        <DevCheck
          checked={flags.migrating}
          onToggle={() => toggleStatus("migrating")}
          label="Migrating"
        />
        <DevCheck
          checked={flags.liveMigrating}
          onToggle={() => toggleStatus("liveMigrating")}
          label="Live migrating"
        />

        {/* Migration slider */}
        {(flags.migrating || flags.liveMigrating) && (
          <div className="grid gap-1 ps-6.5">
            <div className="flex justify-between text-xs text-kumo-subtle">
              <span>Phase {phaseFromPercent(flags.migrationPercent)}</span>
              <span className="tabular-nums">{flags.migrationPercent}%</span>
            </div>
            <Slider<number>
              value={flags.migrationPercent}
              min={0}
              max={100}
              step={1}
              largeStep={10}
              getAriaLabel={() => "Migration progress"}
              onValueChange={(next) =>
                updateFlags({ migrationPercent: Number(next) })
              }
            />
          </div>
        )}
      </DevSection>

      {/* Additive flags */}
      <DevSection title="Flags (can be combined)">
        <DevCheck
          checked={flags.lowQuota}
          onToggle={() => toggleAdditiveFlag("lowQuota")}
          label={<>Low quota{hint("2 GiB free")}</>}
        />
        <DevCheck
          checked={flags.throttled}
          onToggle={() => toggleAdditiveFlag("throttled")}
          label={<>Throttled{hint("L2, 50 MB/s")}</>}
        />
      </DevSection>

      <DevReset onClick={handleReset} />
    </DevPanel>
  )
}
