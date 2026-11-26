"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"
import {
  useNewestApps,
  useRecentlyUpdatedApps
} from "@/api/apps/hooks/use-app-store"
import { useRecentBlogPosts } from "@/api/blog/hooks/use-blog"
import {
  useMarkRead,
  useNotifications
} from "@/api/notifications/hooks/use-notifications"
import type { Notification } from "@/api/notifications/notifications"
import { useRouter } from "@/i18n/routing"
import { useAuth } from "@/providers/auth-provider"
import { useWebSocket } from "@/providers/websocket-provider"
import { toLoadable } from "../_lib/use-account-apps"
import { useAccountShell } from "../_lib/use-account-shell"
import { AppShell } from "../../_components/app-shell"
import { HomeView } from "../../_components/dashboard/home-view"
import { notificationRoute } from "../../_components/dashboard/notifications"

export default function KumoDashboardPage() {
  const locale = useLocale()
  const router = useRouter()
  const { user } = useAuth()

  const { shell, userName, cylosSummary, apps } = useAccountShell()
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
    const route = notificationRoute(notification)
    if (route) router.push(route)
  }

  return (
    <AppShell width="narrow" {...shell}>
      <HomeView
        userName={userName}
        showTwoFactorPrompt={!user.two_factor_enabled}
        services={toLoadable(cylosSummary, (data) => data ?? [])}
        apps={apps}
        notifications={toLoadable(notifications, (data) => data?.items ?? [])}
        onNotificationOpen={openNotification}
        newestApps={toLoadable(newestApps, (data) => data ?? [])}
        recentlyUpdated={toLoadable(recentlyUpdated, (data) => data ?? [])}
        blogPosts={toLoadable(blogPosts, (data) => data ?? [])}
      />
    </AppShell>
  )
}
