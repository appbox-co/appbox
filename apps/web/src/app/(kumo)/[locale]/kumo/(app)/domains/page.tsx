"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { checkSubdomainDns } from "@/api/apps/app-store"
import { useDeleteDomain, useDomains } from "@/api/domains/hooks/use-domains"
import { WS_EVENTS } from "@/constants/events"
import { queryKeys } from "@/constants/query-keys"
import { ROUTES } from "@/constants/routes"
import { useWebSocket } from "@/providers/websocket-provider"
import { toLoadable } from "../_lib/use-account-apps"
import { useAccountShell } from "../_lib/use-account-shell"
import { AppShell } from "../../_components/app-shell"
import {
  DomainsView,
  type DomainInstall
} from "../../_components/domains/domains-view"

const TITLE = "Custom domains"

/** Kumo prototype of the custom domains page, on live account data. */
export default function KumoDomainsPage() {
  const { shell, cylosSummary, installedApps } = useAccountShell()
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

  return (
    <AppShell
      width="wide"
      title={TITLE}
      currentDesignHref={ROUTES.DOMAINS}
      {...shell}
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
