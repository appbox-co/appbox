"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { usePinApp } from "@/api/pinned-apps/hooks/use-pinned-apps"
import { unpinApp } from "@/api/pinned-apps/pinned-apps"
import { queryKeys } from "@/constants/query-keys"
import { ROUTES } from "@/constants/routes"
import { toLoadable } from "../_lib/use-account-apps"
import { useAccountShell } from "../_lib/use-account-shell"
import { useInstanceActions } from "../_lib/use-instance-actions"
import { AppShell } from "../../_components/app-shell"
import { AppStatesPanel } from "../../_components/dev/app-states-panel"
import { InstalledAppsView } from "../../_components/installed/installed-apps-view"

const TITLE = "Installed apps"

/** Kumo prototype of the installed apps list, on live account data. */
export default function KumoInstalledAppsPage() {
  const { shell, cylosSummary, installedApps, pinnedOrder } = useAccountShell({
    watchVmControl: true
  })
  const runAction = useInstanceActions()
  const queryClient = useQueryClient()
  const pinMutation = usePinApp()
  const unpinMutation = useMutation({ mutationFn: unpinApp })

  // Apps on an Appbox that is being migrated show as migrating, as in the
  // current design.
  const migrating = new Set(
    (cylosSummary.data ?? [])
      .filter((cylo) => cylo.is_migrating)
      .map((cylo) => cylo.id)
  )
  const apps = (installedApps.data ?? []).map((app) =>
    migrating.has(app.cylo_id) ? { ...app, status: "migrating" } : app
  )

  const togglePin = async (app: InstalledApp, pin: boolean) => {
    if (pin) {
      await pinMutation.mutateAsync({
        app_instance_id: app.id,
        cylo_id: app.cylo_id
      })
      return
    }
    await unpinMutation.mutateAsync(app.id)
    await queryClient.invalidateQueries({
      queryKey: queryKeys.pinnedApps.byCylo(app.cylo_id)
    })
  }

  return (
    <AppShell
      width="wide"
      title={TITLE}
      currentDesignHref={ROUTES.INSTALLED_APPS}
      {...shell}
    >
      <InstalledAppsView
        apps={toLoadable(installedApps, () => apps)}
        cylos={toLoadable(cylosSummary, (data) => data ?? [])}
        pinned={pinnedOrder}
        onAction={runAction}
        onTogglePin={togglePin}
      />

      {/* Development server only. */}
      <AppStatesPanel apps={apps} />
    </AppShell>
  )
}
