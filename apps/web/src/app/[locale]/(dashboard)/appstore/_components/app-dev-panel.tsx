"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Bug, ChevronDown, ChevronUp, RotateCcw } from "lucide-react"
import type { AppStoreItem } from "@/api/apps/app-store"
import { queryKeys } from "@/constants/query-keys"
import { useAuth } from "@/providers/auth-provider"
import { notifyAppDevFlagsChanged } from "./app-dev-flags"

/* -------------------------------------------------------------------------- */
/*  Only render in development                                                 */
/* -------------------------------------------------------------------------- */

const IS_DEV = process.env.NODE_ENV === "development"

/* -------------------------------------------------------------------------- */
/*  State flags — each maps to a guard scenario from the legacy getFreeSlots   */
/* -------------------------------------------------------------------------- */

interface DevFlags {
  /** app.enabled = 0 → "This app is temporarily disabled for maintenance" */
  appDisabled: boolean
  /** cylos = [] → "You need an Appbox before you can install apps" */
  noCylos: boolean
  /** Single cylo + restricted → blocking banner with upgrade link */
  singleRestricted: boolean
  /** All cylos restricted → dropdown (multi) with per-appbox upgrade */
  allRestricted: boolean
  /** All but last cylo restricted → dropdown with some available */
  mostRestricted: boolean
  /** First cylo restricted, rest eligible → dropdown with hint */
  someRestricted: boolean
  /** Single cylo + no slots → blocking banner with upgrade link */
  singleNoSlots: boolean
  /** All cylos have no free slots → dropdown (multi) with per-appbox upgrade */
  noSlots: boolean
  /** All but last cylo has no slots → dropdown with some available */
  mostNoSlots: boolean
  /** First cylo has no slots, rest have slots → dropdown with hint */
  someNoSlots: boolean
  /** Single cylo + allow_multiple=0 + already installed → blocking banner */
  singleNoMulti: boolean
  /** allow_multiple=0 & all cylos have instance → dropdown (multi) */
  noMulti: boolean
  /** allow_multiple=0 & all but last cylo has instance → dropdown with some available */
  mostNoMulti: boolean
  /** allow_multiple=0 & first cylo has instance, rest don't → dropdown with hint */
  someNoMulti: boolean
  /** Simulate non-admin user (overrides admin role to trigger guards) */
  simulateUser: boolean
}

const DEFAULT_FLAGS: DevFlags = {
  appDisabled: false,
  noCylos: false,
  singleRestricted: false,
  allRestricted: false,
  mostRestricted: false,
  someRestricted: false,
  singleNoSlots: false,
  noSlots: false,
  mostNoSlots: false,
  someNoSlots: false,
  singleNoMulti: false,
  noMulti: false,
  mostNoMulti: false,
  someNoMulti: false,
  simulateUser: false
}

/** Guard info for each flag */
interface GuardMeta {
  label: string
  description: string
  color: string
  group?: string
}

const GUARD_INFO: Record<keyof Omit<DevFlags, "simulateUser">, GuardMeta> = {
  appDisabled: {
    label: "App Disabled",
    description: "app.enabled=0 → blocks install",
    color: "accent-red-500"
  },
  noCylos: {
    label: "No Appboxes",
    description: "User has 0 Appboxes → order prompt",
    color: "accent-amber-500"
  },
  singleRestricted: {
    label: "Single Appbox — Restricted",
    description: "1 Appbox, restricted → banner with upgrade",
    color: "accent-orange-600",
    group: "Restrictions"
  },
  allRestricted: {
    label: "All Restricted (multi)",
    description: "Multiple Appboxes, all restricted → dropdown",
    color: "accent-orange-500",
    group: "Restrictions"
  },
  mostRestricted: {
    label: "Most Restricted (multi)",
    description: "All but last Appbox restricted → dropdown + hint",
    color: "accent-orange-450",
    group: "Restrictions"
  },
  someRestricted: {
    label: "Some Restricted (1, multi)",
    description: "First Appbox restricted, rest eligible → hint",
    color: "accent-orange-400",
    group: "Restrictions"
  },
  singleNoSlots: {
    label: "Single Appbox — No Slots",
    description: "1 Appbox, no free slots → banner with upgrade",
    color: "accent-yellow-600",
    group: "Slots"
  },
  noSlots: {
    label: "No Free Slots (all, multi)",
    description: "Multiple Appboxes, none have slots → dropdown",
    color: "accent-yellow-500",
    group: "Slots"
  },
  mostNoSlots: {
    label: "Most No Slots (multi)",
    description: "All but last Appbox 0 slots → dropdown + hint",
    color: "accent-yellow-450",
    group: "Slots"
  },
  someNoSlots: {
    label: "No Free Slots (1, multi)",
    description: "First Appbox 0 slots, rest have slots → hint",
    color: "accent-yellow-400",
    group: "Slots"
  },
  singleNoMulti: {
    label: "Single Appbox — Already Installed",
    description: "1 Appbox, app already installed → banner",
    color: "accent-purple-600",
    group: "Multi-install"
  },
  noMulti: {
    label: "No Multi-install (all, multi)",
    description: "Multiple Appboxes, all have app → dropdown",
    color: "accent-purple-500",
    group: "Multi-install"
  },
  mostNoMulti: {
    label: "Most Installed (multi)",
    description: "All but last Appbox has app → dropdown + hint",
    color: "accent-purple-450",
    group: "Multi-install"
  },
  someNoMulti: {
    label: "No Multi-install (1, multi)",
    description: "App on first Appbox, rest available → hint",
    color: "accent-purple-400",
    group: "Multi-install"
  }
}

const STORAGE_KEY = (id: number) => `app-dev-panel-${id}`

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
/*  Guard flags are mutually exclusive (same as legacy — priority order)       */
/* -------------------------------------------------------------------------- */

type GuardFlag = keyof Omit<DevFlags, "simulateUser">
const GUARD_FLAGS: GuardFlag[] = [
  "appDisabled",
  "noCylos",
  "singleRestricted",
  "allRestricted",
  "mostRestricted",
  "someRestricted",
  "singleNoSlots",
  "noSlots",
  "mostNoSlots",
  "someNoSlots",
  "singleNoMulti",
  "noMulti",
  "mostNoMulti",
  "someNoMulti"
]

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface AppDevPanelProps {
  appId: number
}

export function AppDevPanel({ appId }: AppDevPanelProps) {
  if (!IS_DEV) return null
  return <AppDevPanelInner appId={appId} />
}

function AppDevPanelInner({ appId }: AppDevPanelProps) {
  const queryClient = useQueryClient()
  const { cylos: realCylos, user } = useAuth()
  const originalAppRef = useRef<AppStoreItem | null>(null)
  const [originalAppForDisplay, setOriginalAppForDisplay] =
    useState<AppStoreItem | null>(null)

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("app-dev-panel-collapsed") === "true"
  })

  const [flags, setFlags] = useState<DevFlags>(() => loadFlags(appId))

  // Capture the original app data on first render
  useEffect(() => {
    const data = queryClient.getQueryData<AppStoreItem>(
      queryKeys.apps.detail(appId)
    )
    if (data && !originalAppRef.current) {
      const snapshot = { ...data }
      originalAppRef.current = snapshot
      queueMicrotask(() => setOriginalAppForDisplay(snapshot))
    }
  }, [appId, queryClient])

  // Apply flags to the query cache
  const applyFlags = useCallback(
    (f: DevFlags) => {
      const original = originalAppRef.current
      if (!original) return

      const patched = { ...original }

      if (f.appDisabled) {
        patched.enabled = 0
      }

      if (f.noSlots || f.singleNoSlots) {
        // Require more slots than any cylo could have
        patched.app_slots = 9999
        if (patched.default_version) {
          patched.default_version = {
            ...patched.default_version,
            app_slots: 9999
          }
        }
      }
      // someNoSlots and mostNoSlots are handled in install-dialog by
      // overriding which cylos appear to have no slots

      if (f.noMulti || f.mostNoMulti || f.someNoMulti || f.singleNoMulti) {
        patched.allow_multiple = 0
      }

      queryClient.setQueryData<AppStoreItem>(
        queryKeys.apps.detail(appId),
        patched
      )
    },
    [appId, queryClient]
  )

  // Re-apply on mount if flags were persisted
  useEffect(() => {
    const hasAnyGuard = GUARD_FLAGS.some((k) => flags[k])
    if (hasAnyGuard) {
      const timer = setTimeout(() => applyFlags(flags), 100)
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function updateFlags(patch: Partial<DevFlags>) {
    setFlags((prev) => {
      const next = { ...prev, ...patch }
      saveFlags(appId, next)
      applyFlags(next)
      // Defer the event so it fires after React finishes rendering this component
      setTimeout(notifyAppDevFlagsChanged, 0)
      return next
    })
  }

  function toggleGuard(flag: GuardFlag) {
    const wasActive = flags[flag]
    const reset: Partial<DevFlags> = {}
    for (const f of GUARD_FLAGS) reset[f] = false
    if (!wasActive) reset[flag] = true
    updateFlags(reset)
  }

  function handleReset() {
    const resetFlags = { ...DEFAULT_FLAGS }
    setFlags(resetFlags)
    saveFlags(appId, resetFlags)
    setTimeout(notifyAppDevFlagsChanged, 0)
    // Refetch real data and update the original ref so subsequent flag
    // applications have an accurate baseline to patch from.
    queryClient
      .refetchQueries({ queryKey: queryKeys.apps.detail(appId) })
      .then(() => {
        const fresh = queryClient.getQueryData<AppStoreItem>(
          queryKeys.apps.detail(appId)
        )
        if (fresh) {
          originalAppRef.current = { ...fresh }
          setOriginalAppForDisplay({ ...fresh })
        }
      })
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("app-dev-panel-collapsed", String(next))
      return next
    })
  }

  const hasAnyFlag = GUARD_FLAGS.some((k) => flags[k]) || flags.simulateUser

  const isAdmin = user?.roles === "admin"

  return (
    <div className="fixed bottom-4 right-4 z-9999 w-80 rounded-lg border border-amber-500/40 bg-card shadow-xl">
      {/* Header */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex w-full items-center justify-between gap-2 rounded-t-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400"
      >
        <span className="flex items-center gap-1.5">
          <Bug className="size-3.5" />
          Dev: Install Guards
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
        <div className="space-y-1 px-3 py-2 max-h-[70vh] overflow-y-auto">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Guard states (mutually exclusive)
          </p>

          {(() => {
            let lastGroup: string | undefined
            return GUARD_FLAGS.map((flag) => {
              const info = GUARD_INFO[flag]
              const showGroup = info.group && info.group !== lastGroup
              lastGroup = info.group
              return (
                <div key={flag}>
                  {showGroup && (
                    <p className="mt-1.5 mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {info.group}
                    </p>
                  )}
                  <label className="flex items-start gap-2 text-xs cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={flags[flag]}
                      onChange={() => toggleGuard(flag)}
                      className={`mt-0.5 size-3.5 rounded border-muted-foreground ${info.color}`}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{info.label}</span>
                      <p className="text-[10px] text-muted-foreground leading-tight truncate">
                        {info.description}
                      </p>
                    </div>
                  </label>
                </div>
              )
            })
          })()}

          {/* Simulate user toggle */}
          {isAdmin && (
            <>
              <div className="my-1.5 border-t border-border" />
              <label className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={flags.simulateUser}
                  onChange={() =>
                    updateFlags({ simulateUser: !flags.simulateUser })
                  }
                  className="size-3.5 rounded border-muted-foreground accent-blue-500"
                />
                <div>
                  <span className="font-medium">Simulate non-admin</span>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Guards are bypassed for admins — enable to test
                  </p>
                </div>
              </label>
            </>
          )}

          {/* Live state info */}
          <div className="my-1.5 border-t border-border" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Current context
          </p>
          <div className="space-y-0.5 text-[10px] text-muted-foreground">
            <p>
              Role: <span className="font-mono">{user?.roles ?? "?"}</span>
              {flags.simulateUser && (
                <span className="ml-1 text-blue-500">(overridden → user)</span>
              )}
            </p>
            <p>
              Appboxes: <span className="font-mono">{realCylos.length}</span>
              {flags.noCylos && (
                <span className="ml-1 text-amber-500">(overridden → 0)</span>
              )}
            </p>
            <p>
              App enabled:{" "}
              <span className="font-mono">
                {originalAppForDisplay?.enabled ?? "?"}
              </span>
              {flags.appDisabled && (
                <span className="ml-1 text-red-500">(overridden → 0)</span>
              )}
            </p>
          </div>

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
