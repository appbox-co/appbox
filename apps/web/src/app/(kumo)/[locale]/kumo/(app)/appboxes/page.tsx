"use client"

import { useEffect } from "react"
import { ROUTES } from "@/constants/routes"
import { useAuth } from "@/providers/auth-provider"
import { useWebSocket } from "@/providers/websocket-provider"
import { toLoadable, useAccountApps } from "../_lib/use-account-apps"
import { AppShell } from "../../_components/app-shell"
import { AppboxesView } from "../../_components/appboxes-view"

const TITLE = "Appboxes"
const NO_APPS = new Map<number, never[]>()

/** Kumo prototype of the Appboxes list, on live account data. */
export default function KumoAppboxesPage() {
  const { user, logout } = useAuth()
  const { cylosSummary, installedApps, apps, searchGroups } = useAccountApps()
  const cylos = cylosSummary.data

  const {
    connectToServers,
    disconnectFromServer,
    subscribe,
    unsubscribe,
    sendToServer
  } = useWebSocket()

  // The current page's wiring, unchanged: connect to every server, subscribe
  // to each Appbox's channel and ask for the 30 day range, so the storage,
  // bandwidth and history shown are pushed for all of them.
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

  /** Boost slots in use on each Appbox: the sum over its installed apps. */
  const boost = new Map<number, number>()
  for (const app of installedApps.data ?? []) {
    boost.set(
      app.cylo_id,
      (boost.get(app.cylo_id) ?? 0) + (app.boost_slots ?? 0)
    )
  }

  const userName = user.alias || user.firstname || user.email

  return (
    <AppShell
      width="wide"
      title={TITLE}
      currentDesignHref={ROUTES.APPBOXES}
      user={{ name: userName, email: user.email }}
      search={searchGroups}
      onSignOut={() => void logout()}
    >
      <AppboxesView
        cylos={toLoadable(cylosSummary, (data) => data ?? [])}
        apps={apps.status === "ready" ? apps.data : NO_APPS}
        boost={boost}
      />
    </AppShell>
  )
}
