"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"
import {
  useNewestApps,
  useRecentlyUpdatedApps
} from "@/api/apps/hooks/use-app-store"
import { useRecentBlogPosts } from "@/api/blog/hooks/use-blog"
import type { CyloSummary } from "@/api/cylos/cylos"
import { useCyloBandwidth, useCyloDiskQuota } from "@/api/cylos/hooks/use-cylos"
import {
  useMarkRead,
  useNotifications
} from "@/api/notifications/hooks/use-notifications"
import type { Notification } from "@/api/notifications/notifications"
import { getNotificationRoute } from "@/components/dashboard/notification-helpers"
import { useRouter } from "@/i18n/routing"
import { useAuth } from "@/providers/auth-provider"
import { useWebSocket } from "@/providers/websocket-provider"
import { toLoadable, useAccountApps } from "../_lib/use-account-apps"
import { AppShell } from "../../_components/app-shell"
import type { StripApp } from "../../_components/app-strip"
import { AppboxCard, HomeView } from "../../_components/home-view"

/** Appbox card that prefers the live quota and bandwidth pushed over WebSocket. */
function LiveAppboxCard({
  cylo,
  apps
}: {
  cylo: CyloSummary
  apps: StripApp[]
}) {
  const { data: quota } = useCyloDiskQuota(cylo.id)
  const { data: bandwidth } = useCyloBandwidth(cylo.id)

  return (
    <AppboxCard
      cylo={cylo}
      apps={apps}
      usage={{
        storageUsedGb: quota?.used_gb,
        uploadBytes: bandwidth?.upload_bytes,
        downloadBytes: bandwidth?.download_bytes
      }}
    />
  )
}

export default function KumoDashboardPage() {
  const locale = useLocale()
  const router = useRouter()
  const { user, logout } = useAuth()

  const { cylosSummary, apps, searchGroups } = useAccountApps()
  const notifications = useNotifications(5)
  const markRead = useMarkRead()
  const newestApps = useNewestApps(6)
  const recentlyUpdated = useRecentlyUpdatedApps(6)
  const blogPosts = useRecentBlogPosts(4, locale)

  const cylos = cylosSummary.data

  const {
    connectToServers,
    disconnectFromServer,
    subscribe,
    unsubscribe,
    sendToServer
  } = useWebSocket()

  // Same live-stats wiring as the current dashboard: connect to each server,
  // subscribe to every cylo channel and request the 30 day stats range.
  useEffect(() => {
    if (!cylos?.length) return
    const servers = [
      ...new Set(cylos.map((c) => c.server_name).filter(Boolean))
    ]
    connectToServers(servers)
    cylos.forEach((c) => {
      const channel = `cylo:${c.id}`
      subscribe(channel)
      sendToServer(
        { action: "stats_range", channel, range: "30d" },
        c.server_name
      )
    })
    return () => {
      cylos.forEach((c) => unsubscribe(`cylo:${c.id}`))
      servers.forEach((name) => disconnectFromServer(name))
    }
  }, [
    cylos,
    connectToServers,
    disconnectFromServer,
    subscribe,
    unsubscribe,
    sendToServer
  ])

  const openNotification = (notification: Notification) => {
    if (!notification.is_read) markRead.mutate(notification.id)
    const route = getNotificationRoute(notification)
    if (route) router.push(route)
  }

  const userName = user.alias || user.firstname || user.email

  return (
    <AppShell
      width="narrow"
      user={{ name: userName, email: user.email }}
      search={searchGroups}
      onSignOut={() => void logout()}
    >
      <HomeView
        userName={userName}
        showTwoFactorPrompt={!user.two_factor_enabled}
        services={toLoadable(cylosSummary, (data) => data ?? [])}
        apps={apps}
        AppboxCard={LiveAppboxCard}
        notifications={toLoadable(notifications, (data) => data?.items ?? [])}
        onNotificationOpen={openNotification}
        newestApps={toLoadable(newestApps, (data) => data ?? [])}
        recentlyUpdated={toLoadable(recentlyUpdated, (data) => data ?? [])}
        blogPosts={toLoadable(blogPosts, (data) => data ?? [])}
      />
    </AppShell>
  )
}
