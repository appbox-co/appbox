"use client"

import { use, useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAppVersions } from "@/api/apps/hooks/use-app-store"
import { useCylo } from "@/api/cylos/hooks/use-cylos"
import {
  useInstalledApp,
  useRevealInstalledAppCustomField
} from "@/api/installed-apps/hooks/use-installed-apps"
import {
  usePinApp,
  usePinnedApps,
  useUnpinApp
} from "@/api/pinned-apps/hooks/use-pinned-apps"
import { WS_EVENTS, WS_SERVER_EVENTS } from "@/constants/events"
import { queryKeys } from "@/constants/query-keys"
import { ROUTES } from "@/constants/routes"
import type {
  DomainChangedData,
  JobProgressData,
  NotificationCreatedData
} from "@/lib/websocket/types"
import { useAuth } from "@/providers/auth-provider"
import { useWebSocket } from "@/providers/websocket-provider"
import { InstalledAppDevPanel } from "../../_dev/installed-app-dev-panel"
import { useAccountApps } from "../../_lib/use-account-apps"
import { AppShell } from "../../../_components/app-shell"
import { InstalledAppView } from "../../../_components/installed-app-view"
import { kumoRoutes } from "../../../_components/kumo-routes"

const COPY = {
  installedApps: "Installed apps",
  fallbackTitle: "Installed app"
} as const

interface KumoInstalledAppPageProps {
  params: Promise<{ id: string; locale: string }>
}

/**
 * Kumo prototype of one installed app's management page, on live account
 * data. The data and live-update wiring below is the current page's, with
 * links to Kumo's pages.
 */
export default function KumoInstalledAppPage({
  params
}: KumoInstalledAppPageProps) {
  const { id } = use(params)
  const appId = Number(id)
  const t = useTranslations("appboxmanager.appDetail")
  const router = useRouter()
  const { user, logout } = useAuth()
  const { searchGroups } = useAccountApps()

  const queryClient = useQueryClient()

  const {
    data: app,
    isLoading,
    error
  } = useInstalledApp(appId, {
    watchVmControl: true
  })
  const { data: cylo } = useCylo(app?.cylo_id ?? 0)
  const { data: appVersions } = useAppVersions(app?.app_id ?? 0)
  const revealCustomFieldMutation = useRevealInstalledAppCustomField(appId)
  const [revealedCustomFieldValues, setRevealedCustomFieldValues] = useState<
    Record<string, string>
  >({})

  const { data: pinnedApps } = usePinnedApps(app?.cylo_id)
  const pinMutation = usePinApp()
  const unpinMutation = useUnpinApp(app?.cylo_id)

  const isPinned = pinnedApps?.some((p) => p.app_instance_id === appId) ?? false
  const isPinPending = pinMutation.isPending || unpinMutation.isPending

  const revealCustomField = useCallback(
    async (fieldId: number) => {
      const revealKey = `${appId}:${fieldId}`
      if (revealedCustomFieldValues[revealKey] !== undefined) {
        return revealedCustomFieldValues[revealKey]
      }

      try {
        const value = await revealCustomFieldMutation.mutateAsync({ fieldId })
        setRevealedCustomFieldValues((prev) => ({
          ...prev,
          [revealKey]: value
        }))

        return value
      } catch {
        toast.error(t("customTablesRevealFailed"))
        return undefined
      }
    },
    [appId, revealCustomFieldMutation, revealedCustomFieldValues, t]
  )

  /* ── Live job state, managed directly from WS events and the dev panel ── */
  const [job, setJob] = useState<JobProgressData | undefined>(undefined)

  const { connectToServer, disconnectFromServer, subscribe, unsubscribe, on } =
    useWebSocket()

  /* Subscribe to instance channel on the server WS */
  useEffect(() => {
    if (!app) return
    if (app.server_name) {
      connectToServer(app.server_name)
    }
    // migration.progress for cylo details is routed on central WS via cylo:<id>
    subscribe(`cylo:${app.cylo_id}`)
    subscribe(`instance:${appId}`)
    // Server-side job lifecycle events are broadcast on this channel.
    subscribe("instance_events")
    return () => {
      unsubscribe(`cylo:${app.cylo_id}`)
      unsubscribe(`instance:${appId}`)
      unsubscribe("instance_events")
      if (app.server_name) {
        disconnectFromServer(app.server_name)
      }
    }
  }, [
    app,
    appId,
    connectToServer,
    disconnectFromServer,
    subscribe,
    unsubscribe
  ])

  /* Handle job events directly: no TanStack Query cache in the loop */
  const handleJobStarted = useCallback(
    (data: JobProgressData) => {
      if (Number(data.instance_id) === appId) {
        setJob(data)
      }
    },
    [appId]
  )

  const handleJobProgress = useCallback(
    (data: JobProgressData) => {
      if (Number(data.instance_id) === appId) {
        setJob(data)
      }
    },
    [appId]
  )

  const handleJobDone = useCallback(
    (data: { instance_id: number | string }) => {
      if (Number(data.instance_id) !== appId) return
      setJob(undefined)
      // Refetch to pick up updated custom fields; status arrives via instance.state
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.detail(appId)
      })
      queryClient.refetchQueries({
        queryKey: queryKeys.installedApps.detail(appId),
        type: "active"
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.installedApps.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.byInstance(appId)
      })
    },
    [appId, queryClient]
  )

  const handleNotification = useCallback(
    (msg: { data: unknown }) => {
      const notif = msg.data as NotificationCreatedData
      if (notif.type !== "instance" || Number(notif.relid) !== appId) return

      if (notif.action === "removed") {
        router.push(app ? kumoRoutes.appbox(app.cylo_id) : kumoRoutes.appboxes)
        return
      }

      // "add" = install complete, "updated" = update complete: cylo-api has committed its flag
      // changes at this point, so refetch to clear the transitional banner and load custom fields.
      if (notif.action === "add" || notif.action === "updated") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.installedApps.detail(appId)
        })
        queryClient.refetchQueries({
          queryKey: queryKeys.installedApps.detail(appId),
          type: "active"
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.installedApps.all })
      }
    },
    [appId, app, router, queryClient]
  )

  const handleCustomTableChanged = useCallback(
    (msg: { data: unknown }) => {
      const payload = msg.data as { instance_id?: number | string }
      if (Number(payload?.instance_id) !== appId) return

      // Refresh both table definitions and row datasets when another client
      // mutates custom-table rows for this instance.
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.byInstance(appId)
      })
      queryClient.invalidateQueries({
        queryKey: ["customTables", "instance", appId]
      })
    },
    [appId, queryClient]
  )

  const handleDomainChanged = useCallback(
    (msg: { data: unknown }) => {
      const payload = msg.data as DomainChangedData
      if (Number(payload.instance_id) !== appId) return

      queryClient.invalidateQueries({
        queryKey: queryKeys.domains.byInstance(appId)
      })
    },
    [appId, queryClient]
  )

  useEffect(() => {
    const unsubs = [
      on(WS_SERVER_EVENTS.JOB_STARTED, (msg) =>
        handleJobStarted(msg.data as JobProgressData)
      ),
      on(WS_SERVER_EVENTS.JOB_PROGRESS, (msg) =>
        handleJobProgress(msg.data as JobProgressData)
      ),
      on(WS_SERVER_EVENTS.JOB_COMPLETED, (msg) =>
        handleJobDone(msg.data as { instance_id: number | string })
      ),
      on(WS_SERVER_EVENTS.JOB_FAILED, (msg) =>
        handleJobDone(msg.data as { instance_id: number | string })
      ),
      on(WS_EVENTS.NOTIFICATION_CREATED, handleNotification),
      on(WS_EVENTS.CUSTOM_TABLE_CHANGED, handleCustomTableChanged),
      on(WS_EVENTS.CUSTOM_TABLE_MUTATION_CHANGED, handleCustomTableChanged),
      on(WS_EVENTS.DOMAIN_CHANGED, handleDomainChanged)
    ]
    return () => unsubs.forEach((u) => u())
  }, [
    on,
    handleJobStarted,
    handleJobProgress,
    handleJobDone,
    handleNotification,
    handleCustomTableChanged,
    handleDomainChanged
  ])

  const togglePin = () => {
    if (!app) return
    if (isPinned) {
      unpinMutation.mutate(app.id)
    } else {
      pinMutation.mutate({ app_instance_id: app.id, cylo_id: app.cylo_id })
    }
  }

  const userName = user.alias || user.firstname || user.email

  return (
    <AppShell
      width="wide"
      title={app?.display_name ?? COPY.fallbackTitle}
      parents={[{ label: COPY.installedApps, href: kumoRoutes.installedApps }]}
      currentDesignHref={ROUTES.INSTALLED_APP_DETAIL(appId)}
      user={{ name: userName, email: user.email }}
      search={searchGroups}
      onSignOut={() => void logout()}
    >
      <InstalledAppView
        app={
          isLoading
            ? { status: "loading" }
            : error || !app
              ? { status: "error" }
              : { status: "ready", data: app }
        }
        cylo={cylo}
        catalogueVersions={appVersions}
        job={job}
        pinned={isPinned}
        pinPending={isPinPending}
        onTogglePin={togglePin}
        onRevealField={revealCustomField}
      />

      {/* Development server only. It copies the app when it appears, so it
          waits for the app to load. */}
      {app && <InstalledAppDevPanel appId={appId} onJobChange={setJob} />}
    </AppShell>
  )
}
