"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { checkSubdomainDns } from "@/api/apps/app-store"
import { useDeleteDomain, useDomains } from "@/api/domains/hooks/use-domains"
import { WS_EVENTS } from "@/constants/events"
import { queryKeys } from "@/constants/query-keys"
import { ROUTES } from "@/constants/routes"
import { useAuth } from "@/providers/auth-provider"
import { useWebSocket } from "@/providers/websocket-provider"
import { toLoadable, useAccountApps } from "../_lib/use-account-apps"
import { AppShell } from "../../_components/app-shell"
import { DomainsView, type DomainInstall } from "../../_components/domains-view"

const TITLE = "Custom domains"

/** Kumo prototype of the custom domains page, on live account data. */
export default function KumoDomainsPage() {
  const { user, logout } = useAuth()
  const { cylosSummary, installedApps, searchGroups } = useAccountApps()
  const domains = useDomains()
  const deleteDomain = useDeleteDomain()
  const queryClient = useQueryClient()
  const { on } = useWebSocket()

  // The current page's wiring, unchanged: reload when a domain changes.
  useEffect(() => {
    const unsubscribe = on(WS_EVENTS.DOMAIN_CHANGED, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all })
    })
    return () => unsubscribe()
  }, [on, queryClient])

  const installs = new Map<number, DomainInstall>(
    (installedApps.data ?? []).map((app) => [
      app.id,
      { name: app.display_name, icon: app.icon_image }
    ])
  )
  const appboxes = new Map(
    (cylosSummary.data ?? []).map((cylo) => [cylo.id, cylo.name])
  )

  const userName = user.alias || user.firstname || user.email

  return (
    <AppShell
      width="wide"
      title={TITLE}
      currentDesignHref={ROUTES.DOMAINS}
      user={{ name: userName, email: user.email }}
      search={searchGroups}
      onSignOut={() => void logout()}
    >
      <DomainsView
        domains={toLoadable(domains, (data) => data ?? [])}
        installs={installs}
        appboxes={appboxes}
        onDelete={(domain) => deleteDomain.mutateAsync(domain.id)}
        // The current page's call, unchanged: the full name, its parent's id
        // and the Appbox it should point at.
        onCheckDns={(domain) =>
          checkSubdomainDns(domain.fqdn, domain.parent, domain.cylo_id)
        }
      />
    </AppShell>
  )
}
