"use client"

import { useMemo, useState } from "react"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { ROUTES } from "@/constants/routes"
import { AppShell } from "../../_components/app-shell"
import {
  AppStatesPanel,
  type AppStatesTarget
} from "../../_components/dev/app-states-panel"
import { InstalledAppsView } from "../../_components/installed-apps-view"
import type { InstanceAction } from "../../_components/instance-controls"
import { buildSearchGroups } from "../../_components/quick-search"
import {
  appsByCylo,
  cylos,
  demoInstalledApps,
  demoPinned,
  demoUser,
  RESULTING_STATUS
} from "../fixtures"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** The installed apps page on sample data. Actions and pins change local state only. */
export function DemoInstalledApps() {
  const [apps, setApps] = useState(demoInstalledApps)
  const [pinned, setPinned] = useState<ReadonlyMap<number, number>>(demoPinned)

  // Pretend the request takes a moment, then show the state it would lead to.
  const runAction = async (action: InstanceAction, ids: number[]) => {
    await wait(700)
    setApps((current) =>
      current.map((app) =>
        ids.includes(app.id)
          ? { ...app, status: RESULTING_STATUS[action] }
          : app
      )
    )
  }

  // The developer panel overrides the statuses held in state above, and gets
  // the sample's own back when an override is cleared.
  const statesTarget = useMemo<AppStatesTarget>(
    () => ({
      setStatus: (appId, _cyloId, status) =>
        setApps((current) =>
          current.map((app) => (app.id === appId ? { ...app, status } : app))
        ),
      restore: (only) =>
        setApps((current) =>
          only
            ? current.map((app) =>
                app.id === only.appId
                  ? (demoInstalledApps.find((real) => real.id === app.id) ??
                    app)
                  : app
              )
            : demoInstalledApps
        )
    }),
    []
  )

  const togglePin = async (app: InstalledApp, pin: boolean) => {
    await wait(400)
    setPinned((current) => {
      const next = new Map(current)
      if (pin) next.set(app.id, Math.max(-1, ...next.values()) + 1)
      else next.delete(app.id)
      return next
    })
  }

  return (
    <AppShell
      demo
      width="wide"
      title="Installed apps"
      currentDesignHref={ROUTES.INSTALLED_APPS}
      user={demoUser}
      search={buildSearchGroups(cylos, appsByCylo, true)}
    >
      <InstalledAppsView
        apps={{ status: "ready", data: apps }}
        cylos={{ status: "ready", data: cylos }}
        pinned={pinned}
        onAction={runAction}
        onTogglePin={togglePin}
      />

      {/* Force any app into any status. Kept apart from the overrides set on
          the real account's list. */}
      <AppStatesPanel
        apps={apps}
        target={statesTarget}
        storageKey="installed-app-dev-panel-overrides-sample"
      />
    </AppShell>
  )
}
