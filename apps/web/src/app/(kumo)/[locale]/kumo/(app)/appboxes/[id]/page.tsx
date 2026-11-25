"use client"

import { use, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useCylo, useRestartCylo } from "@/api/cylos/hooks/use-cylos"
import { useInstalledApps } from "@/api/installed-apps/hooks/use-installed-apps"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import {
  usePinApp,
  usePinnedApps
} from "@/api/pinned-apps/hooks/use-pinned-apps"
import { unpinApp } from "@/api/pinned-apps/pinned-apps"
import { queryKeys } from "@/constants/query-keys"
import { ROUTES } from "@/constants/routes"
import { useAuth } from "@/providers/auth-provider"
import { useWebSocket } from "@/providers/websocket-provider"
import { AppboxDevPanel } from "../../_dev/appbox-dev-panel"
import { toLoadable, useAccountApps } from "../../_lib/use-account-apps"
import { useInstanceActions } from "../../_lib/use-instance-actions"
import { AppShell } from "../../../_components/app-shell"
import { AppboxView } from "../../../_components/appbox-view"
import { kumoRoutes } from "../../../_components/kumo-routes"

const FALLBACK_TITLE = "Appbox"

interface KumoAppboxPageProps {
  params: Promise<{ id: string; locale: string }>
}

/** Kumo prototype of one Appbox's page, on live account data. */
export default function KumoAppboxPage({ params }: KumoAppboxPageProps) {
  const { id } = use(params)
  const cyloId = Number(id)
  const { user, logout } = useAuth()
  const { searchGroups } = useAccountApps()

  const cyloQuery = useCylo(cyloId)
  const cylo = cyloQuery.data
  const installedApps = useInstalledApps(cyloId)
  const { data: pinnedApps } = usePinnedApps(cyloId)
  const restartMutation = useRestartCylo()
  const runAction = useInstanceActions()
  const queryClient = useQueryClient()
  const pinMutation = usePinApp()
  const unpinMutation = useMutation({ mutationFn: unpinApp })

  /* ---- Live updates: the current page's wiring, unchanged ---- */
  const { connectToServer, disconnectFromServer, subscribe, unsubscribe } =
    useWebSocket()

  useEffect(() => {
    if (cylo?.server_name) {
      connectToServer(cylo.server_name)
      subscribe(`cylo:${cyloId}`)
    }
    return () => {
      unsubscribe(`cylo:${cyloId}`)
      disconnectFromServer(cylo?.server_name)
    }
  }, [
    cylo?.server_name,
    cyloId,
    connectToServer,
    disconnectFromServer,
    subscribe,
    unsubscribe
  ])

  const pinned = new Map<number, number>(
    (pinnedApps ?? []).map((pin) => [pin.app_instance_id, pin.sort_order])
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

  const userName = user.alias || user.firstname || user.email

  return (
    <AppShell
      width="wide"
      title={cylo?.name ?? FALLBACK_TITLE}
      parents={[{ label: "Appboxes", href: kumoRoutes.appboxes }]}
      currentDesignHref={ROUTES.APPBOX_DETAIL(cyloId)}
      user={{ name: userName, email: user.email }}
      search={searchGroups}
      onSignOut={() => void logout()}
    >
      <AppboxView
        cylo={
          cyloQuery.isLoading
            ? { status: "loading" }
            : cyloQuery.error || !cylo
              ? { status: "error" }
              : { status: "ready", data: cylo }
        }
        apps={toLoadable(installedApps, (data) => data ?? [])}
        pinned={pinned}
        onAppAction={runAction}
        onTogglePin={togglePin}
        restartPending={restartMutation.isPending}
        onRestart={() => restartMutation.mutateAsync(cyloId)}
      />

      {/* Development server only. It copies the Appbox when it appears, so it
          waits for the Appbox to load. */}
      {cylo && <AppboxDevPanel cyloId={cyloId} />}
    </AppShell>
  )
}
