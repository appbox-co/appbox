"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button, Input } from "@cloudflare/kumo"
import { useQueryClient } from "@tanstack/react-query"
import type { CyloDetail } from "@/api/cylos/cylos"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { queryKeys } from "@/constants/query-keys"
import type { JobProgressData } from "@/lib/websocket/types"
import {
  APP_STATUS_OPTIONS,
  AppStateReference
} from "../../_components/dev/app-states"
import {
  DevCheck,
  DevChoices,
  DevNote,
  DevPanel,
  DevReset,
  DevSection,
  IS_DEV,
  loadFlags,
  saveFlags
} from "../../_components/dev/dev-panel"
import { InstanceStatusBadge } from "../../_components/instance-controls"

/*
 * State, storage and cache patching are the current design's installed app
 * panel, kept under the same storage keys, so a state forced in either design
 * shows in both. What the panel looks like is new, and so is what Reset does
 * once the real data is back (see handleReset).
 */

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

function anyOverride(flags: DevFlags) {
  return (
    flags.status !== null ||
    flags.hasUpdate ||
    flags.job !== null ||
    flags.cyloSuspended
  )
}

/* -------------------------------------------------------------------------- */
/*  Public export                                                              */
/* -------------------------------------------------------------------------- */

interface InstalledAppDevPanelProps {
  appId: number
  onJobChange: (job: JobProgressData | undefined) => void
}

/**
 * Forces the states one installed app's page has to handle. Render it once
 * the app has loaded: it takes its copy of the real one from the cache when it
 * first appears.
 */
export function InstalledAppDevPanel({
  appId,
  onJobChange
}: InstalledAppDevPanelProps) {
  if (!IS_DEV) return null
  return <PanelInner appId={appId} onJobChange={onJobChange} />
}

/* -------------------------------------------------------------------------- */
/*  Inner component                                                            */
/* -------------------------------------------------------------------------- */

function PanelInner({ appId, onJobChange }: InstalledAppDevPanelProps) {
  const queryClient = useQueryClient()
  const originalRef = useRef<InstalledApp | null>(null)
  const originalCyloRef = useRef<CyloDetail | null>(null)
  const [originalForDisplay, setOriginalForDisplay] =
    useState<InstalledApp | null>(null)

  const [flags, setFlags] = useState<DevFlags>(() =>
    loadFlags(storageKey(appId), DEFAULT_FLAGS)
  )

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
    if (!anyOverride(flags)) return
    const timer = setTimeout(() => applyFlags(flags), 100)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function updateFlags(patch: Partial<DevFlags>) {
    const next = { ...flags, ...patch }
    setFlags(next)
    saveFlags(storageKey(appId), next)
    applyFlags(next)
  }

  function handleReset() {
    const cyloId = originalRef.current?.cylo_id
    const next = { ...DEFAULT_FLAGS }
    setFlags(next)
    saveFlags(storageKey(appId), next)
    onJobChange(undefined)

    // Re-fetch real data, then take what arrives as the copy the next
    // override starts from. (The current design's panel drops its copy here
    // and never takes another, so after a reset its switches do nothing until
    // the page is reloaded.)
    const detailKey = queryKeys.installedApps.detail(appId)
    const reloads = [
      queryClient.invalidateQueries({ queryKey: detailKey }),
      queryClient.invalidateQueries({ queryKey: queryKeys.installedApps.all })
    ]
    if (cyloId) {
      reloads.push(
        queryClient.invalidateQueries({
          queryKey: queryKeys.cylos.detail(cyloId)
        })
      )
    }
    void Promise.all(reloads).then(() => {
      // A failed reload leaves the overridden app in the cache.
      if (queryClient.getQueryState(detailKey)?.status !== "success") return
      const fresh = queryClient.getQueryData<InstalledApp>(detailKey)
      if (!fresh) return
      originalRef.current = { ...fresh }
      setOriginalForDisplay({ ...fresh })
      const cyloKey = queryKeys.cylos.detail(fresh.cylo_id)
      const cylo = queryClient.getQueryData<CyloDetail>(cyloKey)
      originalCyloRef.current =
        cylo && queryClient.getQueryState(cyloKey)?.status === "success"
          ? { ...cylo }
          : null
      // Anything switched on while the real data was loading
      const current = loadFlags(storageKey(appId), DEFAULT_FLAGS)
      if (anyOverride(current)) applyFlags(current)
    })
  }

  /* ── Derived ── */
  const appName = originalForDisplay?.display_name ?? `App #${appId}`
  const hasOverride = anyOverride(flags)
  const isTransitionalStatus = flags.status
    ? ["installing", "updating", "deleting"].includes(flags.status)
    : false

  /* ── Determine what the page's actions will see for each status ── */
  const buttonStates = (status: string) => {
    const isRunning = status === "online"
    const isStopped = status === "offline" || status === "inactive"
    const isTransitioning = ["installing", "updating", "deleting"].includes(
      status
    )
    return { isRunning, isStopped, isTransitioning }
  }
  const forced = flags.status ? buttonStates(flags.status) : null

  const commandJobOn = Boolean(flags.job) && !isTransitionalStatus
  const installJobOn = isTransitionalStatus && Boolean(flags.job)

  return (
    <DevPanel
      title={`Dev: ${appName}`}
      active={hasOverride && "active"}
      collapsedKey={COLLAPSED_KEY}
    >
      {/* ── Status section ── */}
      <DevSection title="Status">
        <DevChoices<string>
          options={APP_STATUS_OPTIONS}
          value={flags.status}
          onChoose={(status) =>
            updateFlags({ status: flags.status === status ? null : status })
          }
        />

        {/* Effect preview */}
        {flags.status && forced && (
          <DevNote>
            <p>
              <InstanceStatusBadge status={flags.status} />
            </p>
            <p>
              Start:{" "}
              {forced.isRunning || forced.isTransitioning
                ? "disabled"
                : "enabled"}
              {" · "}
              Stop:{" "}
              {forced.isStopped || forced.isTransitioning
                ? "disabled"
                : "enabled"}
              {" · "}
              Restart:{" "}
              {forced.isStopped || forced.isTransitioning
                ? "disabled"
                : "enabled"}
            </p>
          </DevNote>
        )}
      </DevSection>

      {/* ── Appbox section ── */}
      <DevSection title="Appbox">
        <DevCheck
          checked={flags.cyloSuspended}
          onToggle={() => updateFlags({ cyloSuspended: !flags.cyloSuspended })}
          label="Suspended"
          hint={
            flags.cyloSuspended
              ? "Actions and version switch are hidden. Banner shown."
              : undefined
          }
        />
      </DevSection>

      {/* ── Flags section ── */}
      <DevSection title="Flags">
        <DevCheck
          checked={flags.hasUpdate}
          onToggle={() => updateFlags({ hasUpdate: !flags.hasUpdate })}
          label={
            <>
              Has update available
              <span className="text-kumo-subtle"> (v999.9.9)</span>
            </>
          }
        />
      </DevSection>

      {/* ── Job simulation ── */}
      <DevSection title="Simulate a job">
        <div className="grid grid-cols-2 gap-1.5">
          {/* Custom button job: app stays online, generic banner */}
          <Button
            size="sm"
            variant={commandJobOn ? "primary" : "secondary"}
            aria-pressed={commandJobOn}
            onClick={() =>
              updateFlags({
                status: flags.status,
                job: flags.job ? null : { ...DEFAULT_COMMAND_JOB }
              })
            }
            className="w-full justify-center"
          >
            Command job
          </Button>

          {/* Lifecycle job: sets installing + job */}
          <Button
            size="sm"
            variant={installJobOn ? "primary" : "secondary"}
            aria-pressed={installJobOn}
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
            className="w-full justify-center"
          >
            Install job
          </Button>
        </div>

        {flags.job && (
          <Input
            aria-label="Job status text"
            size="sm"
            value={flags.job.status}
            onChange={(e) => updateFlags({ job: { status: e.target.value } })}
          />
        )}
      </DevSection>

      <DevReset onClick={handleReset} disabled={!hasOverride} />

      <AppStateReference />
    </DevPanel>
  )
}
