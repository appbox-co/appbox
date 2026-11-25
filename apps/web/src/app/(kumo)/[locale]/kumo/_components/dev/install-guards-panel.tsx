"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Select } from "@cloudflare/kumo"
import { useQueryClient } from "@tanstack/react-query"
import type { AppStoreItem } from "@/api/apps/app-store"
import { queryKeys } from "@/constants/query-keys"
import { notifyAppDevFlagsChanged, type AppDevFlags } from "@/lib/app-dev-flags"
import { useAuth } from "@/providers/auth-provider"
import {
  DevCheck,
  DevNote,
  DevPanel,
  DevReset,
  DevSection,
  IS_DEV
} from "./dev-panel"

/* -------------------------------------------------------------------------- */
/*  Flags: each maps to a guard the install dialog can show                    */
/* -------------------------------------------------------------------------- */

/**
 * The same flags, stored under the same key, as the current design's panel:
 * the install dialog reads them from there, so a guard set in either design
 * shows in both.
 */
type DevFlags = AppDevFlags

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

type GuardFlag = keyof Omit<DevFlags, "simulateUser">

interface GuardMeta {
  flag: GuardFlag
  label: string
  description: string
}

/** Guards are mutually exclusive, in the install dialog's priority order. */
const GUARDS: GuardMeta[] = [
  {
    flag: "appDisabled",
    label: "App disabled",
    description: "app.enabled=0 → blocks install"
  },
  {
    flag: "noCylos",
    label: "No Appboxes",
    description: "User has 0 Appboxes → order prompt"
  },
  {
    flag: "singleRestricted",
    label: "Single Appbox, restricted",
    description: "1 Appbox, restricted → banner with upgrade"
  },
  {
    flag: "allRestricted",
    label: "All restricted (multi)",
    description: "Multiple Appboxes, all restricted → dropdown"
  },
  {
    flag: "mostRestricted",
    label: "Most restricted (multi)",
    description: "All but last Appbox restricted → dropdown + hint"
  },
  {
    flag: "someRestricted",
    label: "Some restricted (1, multi)",
    description: "First Appbox restricted, rest eligible → hint"
  },
  {
    flag: "singleNoSlots",
    label: "Single Appbox, no slots",
    description: "1 Appbox, no free slots → banner with upgrade"
  },
  {
    flag: "noSlots",
    label: "No free slots (all, multi)",
    description: "Multiple Appboxes, none have slots → dropdown"
  },
  {
    flag: "mostNoSlots",
    label: "Most no slots (multi)",
    description: "All but last Appbox 0 slots → dropdown + hint"
  },
  {
    flag: "someNoSlots",
    label: "No free slots (1, multi)",
    description: "First Appbox 0 slots, rest have slots → hint"
  },
  {
    flag: "singleNoMulti",
    label: "Single Appbox, already installed",
    description: "1 Appbox, app already installed → banner"
  },
  {
    flag: "noMulti",
    label: "No multi-install (all, multi)",
    description: "Multiple Appboxes, all have app → dropdown"
  },
  {
    flag: "mostNoMulti",
    label: "Most installed (multi)",
    description: "All but last Appbox has app → dropdown + hint"
  },
  {
    flag: "someNoMulti",
    label: "No multi-install (1, multi)",
    description: "App on first Appbox, rest available → hint"
  }
]

const GUARD_FLAGS: GuardFlag[] = GUARDS.map((guard) => guard.flag)

/** The dropdown's entry for no guard at all. */
const NO_GUARD = "none"
const COPY_NONE = "None (real data)"

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

/**
 * The app as the page should see it with these flags on. The flags not
 * handled here change which Appboxes look eligible, which the install dialog
 * does for itself.
 */
function withGuards(original: AppStoreItem, f: DevFlags): AppStoreItem {
  const patched = { ...original }

  if (f.appDisabled) {
    patched.enabled = 0
  }

  if (f.noSlots || f.singleNoSlots) {
    // Require more slots than any Appbox could have
    patched.app_slots = 9999
    if (patched.default_version) {
      patched.default_version = {
        ...patched.default_version,
        app_slots: 9999
      }
    }
    // The install dialog counts the chosen version's own slots ahead of the
    // app's, so the versions the app carries need the same number. (The
    // current design's panel leaves them alone, which is why its two "no
    // slots" guards for every Appbox no longer block anything.)
    if (patched.versions) {
      patched.versions = patched.versions.map((version) => ({
        ...version,
        app_slots: 9999
      }))
    }
  }

  if (f.noMulti || f.mostNoMulti || f.someNoMulti || f.singleNoMulti) {
    patched.allow_multiple = 0
  }

  return patched
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface InstallGuardsPanelProps {
  appId: number
}

/**
 * Forces each state the install dialog guards against, in the cached app.
 * Render it once the app has loaded: it takes its copy of the real app when it
 * first appears.
 */
export function InstallGuardsPanel(props: InstallGuardsPanelProps) {
  if (!IS_DEV) return null
  return <InstallGuardsPanelInner {...props} />
}

function InstallGuardsPanelInner({ appId }: InstallGuardsPanelProps) {
  const queryClient = useQueryClient()
  const { cylos, user } = useAuth()
  // The signed-in user's role; admins skip the guards unless told not to.
  const role = user?.roles
  // How many Appboxes the user really has.
  const appboxCount = (cylos ?? []).length

  const originalAppRef = useRef<AppStoreItem | null>(null)
  const [originalAppForDisplay, setOriginalAppForDisplay] =
    useState<AppStoreItem | null>(null)

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

  // Apply flags to the cached app the page reads
  const applyFlags = useCallback(
    (f: DevFlags) => {
      const original = originalAppRef.current
      if (!original) return
      queryClient.setQueryData<AppStoreItem>(
        queryKeys.apps.detail(appId),
        withGuards(original, f)
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
    const next = { ...flags, ...patch }
    setFlags(next)
    saveFlags(appId, next)
    applyFlags(next)
    // Defer the event so it fires after React finishes rendering this component
    setTimeout(notifyAppDevFlagsChanged, 0)
  }

  /** Guards are exclusive: choosing one clears the rest. */
  function chooseGuard(flag: GuardFlag | null) {
    const reset: Partial<DevFlags> = {}
    for (const f of GUARD_FLAGS) reset[f] = false
    if (flag) reset[flag] = true
    updateFlags(reset)
  }

  function handleReset() {
    const resetFlags = { ...DEFAULT_FLAGS }
    setFlags(resetFlags)
    saveFlags(appId, resetFlags)
    setTimeout(notifyAppDevFlagsChanged, 0)
    // Load the real data again and update the original ref so subsequent flag
    // applications have an accurate baseline to patch from.
    const key = queryKeys.apps.detail(appId)
    void queryClient
      .refetchQueries({ queryKey: key })
      .then(() => queryClient.getQueryData<AppStoreItem>(key))
      .then((fresh) => {
        if (fresh) {
          originalAppRef.current = { ...fresh }
          setOriginalAppForDisplay({ ...fresh })
        }
      })
  }

  const hasAnyFlag = GUARD_FLAGS.some((k) => flags[k]) || flags.simulateUser

  const activeGuard = GUARDS.find((guard) => flags[guard.flag])

  const isAdmin = role === "admin"

  return (
    <DevPanel
      title="Dev: install guards"
      active={hasAnyFlag && "active"}
      collapsedKey="app-dev-panel-collapsed"
    >
      {/* One dropdown, not a checkbox each: only one guard can be on, and a
          long list would cover the page's own Install button. */}
      <DevSection title="Guard state">
        <Select
          aria-label="Guard state"
          className="w-full"
          value={activeGuard?.flag ?? NO_GUARD}
          onValueChange={(value) =>
            chooseGuard(
              GUARDS.find((guard) => guard.flag === value)?.flag ?? null
            )
          }
          renderValue={(value) =>
            GUARDS.find((guard) => guard.flag === value)?.label ?? COPY_NONE
          }
        >
          <Select.Option value={NO_GUARD}>{COPY_NONE}</Select.Option>
          {GUARDS.map((guard) => (
            <Select.Option key={guard.flag} value={guard.flag}>
              <span className="grid gap-0.5">
                <span>{guard.label}</span>
                <span className="text-xs text-kumo-subtle">
                  {guard.description}
                </span>
              </span>
            </Select.Option>
          ))}
        </Select>
        {activeGuard && <DevNote>{activeGuard.description}</DevNote>}
      </DevSection>

      {/* Simulate user toggle */}
      {isAdmin && (
        <DevSection title="Role">
          <DevCheck
            checked={flags.simulateUser}
            onToggle={() => updateFlags({ simulateUser: !flags.simulateUser })}
            label="Simulate non-admin"
            hint="Guards are bypassed for admins. Turn this on to test them."
          />
        </DevSection>
      )}

      {/* Live state info */}
      <DevSection title="Current context">
        <DevNote>
          <p>
            Role: {role ?? "?"}
            {flags.simulateUser && (
              <span className="text-kumo-warning"> (overridden → user)</span>
            )}
          </p>
          <p>
            Appboxes: {appboxCount}
            {flags.noCylos && (
              <span className="text-kumo-warning"> (overridden → 0)</span>
            )}
          </p>
          <p>
            App enabled: {originalAppForDisplay?.enabled ?? "?"}
            {flags.appDisabled && (
              <span className="text-kumo-warning"> (overridden → 0)</span>
            )}
          </p>
        </DevNote>
      </DevSection>

      <DevReset onClick={handleReset} />
    </DevPanel>
  )
}
