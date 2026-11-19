"use client"

import { useEffect, useRef, useState } from "react"
import { Button, Combobox } from "@cloudflare/kumo"
import { XIcon } from "@phosphor-icons/react"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { InstanceStatusBadge } from "../instance-controls"
import { APP_STATUS_OPTIONS, AppStateReference } from "./app-states"
import { DevChoices, DevPanel, DevReset, DevSection, IS_DEV } from "./dev-panel"

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

/** The current design's key, so an override set in either design shows in both. */
const OVERRIDES_KEY = "installed-app-dev-panel-overrides"
const COLLAPSED_KEY = "installed-app-dev-panel-collapsed"

function loadOverrides(key: string): OverridesMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveOverrides(key: string, o: OverridesMap) {
  try {
    localStorage.setItem(key, JSON.stringify(o))
  } catch {
    /* noop */
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Where the page keeps the apps this panel overrides: the query cache on a
 * live page, local state on a sample page.
 */
export interface AppStatesTarget {
  /** Show this status for one install. */
  setStatus: (appId: number, cyloId: number, status: string) => void
  /** Put the real data back for one install, or for all of them. */
  restore: (only?: { appId: number; cyloId: number }) => void
}

interface AppStatesPanelProps {
  /** The full loaded app list, so the panel can populate its picker. */
  apps: InstalledApp[]
  target: AppStatesTarget
  /** Sample pages keep their overrides apart from the real account's. */
  storageKey?: string
}

/** Forces any installed app in the list into any status. */
export function AppStatesPanel(props: AppStatesPanelProps) {
  if (!IS_DEV) return null
  return <PanelInner {...props} />
}

function PanelInner({
  apps,
  target,
  storageKey = OVERRIDES_KEY
}: AppStatesPanelProps) {
  const [selectedId, setSelectedId] = useState<number | "">("")
  const [overrides, setOverrides] = useState<OverridesMap>(() =>
    loadOverrides(storageKey)
  )
  const [search, setSearch] = useState("")

  /* Re-apply persisted overrides once the apps list is available */
  const appliedOnMount = useRef(false)
  useEffect(() => {
    if (appliedOnMount.current || !apps.length) return
    const saved = loadOverrides(storageKey)
    if (!Object.keys(saved).length) return
    appliedOnMount.current = true
    // Patch each saved override back into the page's data
    for (const [idStr, ov] of Object.entries(saved)) {
      const id = Number(idStr)
      target.setStatus(id, ov.cylo_id, ov.status)
    }
  }, [apps]) // eslint-disable-line react-hooks/exhaustive-deps

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
    saveOverrides(storageKey, next)
    target.setStatus(appId, app.cylo_id, status)
  }

  /* ---- Clear a single override ---- */
  function clearOverride(appId: number) {
    const { [appId]: removed, ...rest } = overrides
    setOverrides(rest)
    saveOverrides(storageKey, rest)
    if (removed) {
      // So the real data is shown again
      target.restore({ appId, cyloId: removed.cylo_id })
    }
  }

  /* ---- Reset all overrides ---- */
  function resetAll() {
    setOverrides({})
    saveOverrides(storageKey, {})
    setSelectedId("")
    target.restore()
  }

  /* ---- Derived state ---- */
  const overrideCount = Object.keys(overrides).length
  const selectedApp = apps.find((a) => a.id === Number(selectedId))
  const currentStatus = selectedApp
    ? (overrides[selectedApp.id]?.status ?? selectedApp.status)
    : null

  // Apps for the picker, Appbox by Appbox, filtered by search
  const pickerApps = [...apps].sort(
    (a, b) =>
      a.cylo_name.localeCompare(b.cylo_name) ||
      a.display_name.localeCompare(b.display_name)
  )
  const filteredApps = search.trim()
    ? pickerApps.filter(
        (a) =>
          a.display_name.toLowerCase().includes(search.toLowerCase()) ||
          a.cylo_name.toLowerCase().includes(search.toLowerCase())
      )
    : pickerApps

  const overriddenEntries = Object.entries(overrides) as [string, AppOverride][]

  return (
    <DevPanel
      title="Dev: app states"
      active={overrideCount > 0 && `${overrideCount} active`}
      collapsedKey={COLLAPSED_KEY}
    >
      <DevSection title="Target app">
        <Combobox<InstalledApp>
          items={pickerApps}
          filteredItems={filteredApps}
          inputValue={search}
          onInputValueChange={setSearch}
          value={selectedApp ?? null}
          itemToStringLabel={(app) => `${app.display_name} (${app.cylo_name})`}
          isItemEqualToValue={(item, selected) => item.id === selected.id}
          onValueChange={(app) => {
            if (!app) return
            setSelectedId(app.id)
            setSearch("")
          }}
        >
          <Combobox.TriggerValue
            className="w-full"
            placeholder="Choose an app"
          />
          <Combobox.Content>
            <Combobox.Input
              aria-label="Filter apps"
              placeholder="Filter apps"
            />
            {filteredApps.length === 0 ? (
              <p className="px-3.5 py-2 text-kumo-subtle">No apps match.</p>
            ) : (
              <Combobox.List>
                {(app: InstalledApp) => (
                  <Combobox.Item key={app.id} value={app}>
                    <span className="grid min-w-0">
                      <span className="truncate">
                        {app.display_name}
                        {overrides[app.id] && ` [${overrides[app.id].status}]`}
                      </span>
                      <span className="truncate text-xs text-kumo-subtle">
                        {app.cylo_name}
                        {app.domain ? ` · ${app.domain}` : ""}
                      </span>
                    </span>
                  </Combobox.Item>
                )}
              </Combobox.List>
            )}
          </Combobox.Content>
        </Combobox>
      </DevSection>

      {/* Status buttons */}
      {selectedApp && (
        <DevSection title={`Set status for ${selectedApp.display_name}`}>
          <DevChoices<string>
            options={APP_STATUS_OPTIONS}
            value={currentStatus}
            onChoose={(status) => applyStatus(selectedApp.id, status)}
          />

          {/* Current status label */}
          <p className="flex flex-wrap items-center gap-2 text-xs text-kumo-subtle">
            Current
            <InstanceStatusBadge status={currentStatus ?? "offline"} />
            {overrides[selectedApp.id] && (
              <span className="text-kumo-warning">overridden</span>
            )}
          </p>
        </DevSection>
      )}

      {/* Active overrides list */}
      {overriddenEntries.length > 0 && (
        <DevSection title={`Active overrides (${overriddenEntries.length})`}>
          <ul className="grid max-h-44 list-none gap-0.5 overflow-y-auto rounded-md ring ring-kumo-hairline">
            {overriddenEntries.map(([idStr, ov]) => {
              const appId = Number(idStr)
              return (
                <li
                  key={appId}
                  className="flex items-center gap-2 py-1 ps-3 pe-1"
                >
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate">{ov.display_name}</span>
                    <span className="truncate text-xs text-kumo-subtle">
                      {ov.cylo_name}
                    </span>
                  </span>
                  <InstanceStatusBadge status={ov.status} />
                  <Button
                    size="sm"
                    shape="square"
                    variant="ghost"
                    icon={XIcon}
                    aria-label={`Clear override for ${ov.display_name}`}
                    title="Clear override"
                    onClick={() => clearOverride(appId)}
                  />
                </li>
              )
            })}
          </ul>
        </DevSection>
      )}

      <DevReset onClick={resetAll} disabled={overrideCount === 0}>
        Reset all to real data
      </DevReset>

      <AppStateReference />
    </DevPanel>
  )
}
