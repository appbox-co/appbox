"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Select } from "@cloudflare/kumo"
import type { Domain } from "@/api/domains/domains"
import { ROUTES } from "@/constants/routes"
import { usePathname, useRouter } from "@/i18n/routing"
import { AppShell } from "../../_components/app-shell"
import { DomainsView, type DomainInstall } from "../../_components/domains-view"
import { buildSearchGroups } from "../../_components/quick-search"
import type { Loadable } from "../../_components/shared"
import { appsByCylo, cylos, demoInstalledApps, demoUser } from "../fixtures"

/** States the page has to handle that the sample data does not otherwise reach. */
const STATES = [
  { value: "normal", label: "A few domains" },
  { value: "many", label: "Sixty domains" },
  { value: "empty", label: "No custom domains" },
  { value: "loading", label: "Loading" },
  { value: "error", label: "Failed to load" }
] as const

type SampleState = (typeof STATES)[number]["value"]

const DAY = 24 * 3_600_000
// Midnight, so the server render and the browser agree on every date.
const LOADED_AT = Math.floor(Date.now() / DAY) * DAY
const SERVER_IP = "203.0.113.10"

const daysAgo = (days: number) => new Date(LOADED_AT - days * DAY).toISOString()

/** A domain the account owns; apps get subdomains under it. */
function base(id: number, domain: string, days: number): Domain {
  return {
    id,
    domain,
    fqdn: domain,
    type: "domain",
    parent: null,
    parent_domain: null,
    instance_id: null,
    cylo_id: null,
    app: null,
    ip_address: null,
    created_at: daysAgo(days)
  }
}

/** A domain attached to the sample install at `index`. */
function attached(
  id: number,
  domain: string,
  index: number,
  days: number,
  fields: Partial<Domain>
): Domain {
  const install = demoInstalledApps[index % demoInstalledApps.length]
  return {
    id,
    domain,
    fqdn: domain,
    type: "subdomain",
    parent: null,
    parent_domain: null,
    instance_id: install.id,
    cylo_id: install.cylo_id,
    app: install.display_name,
    ip_address: SERVER_IP,
    created_at: daysAgo(days),
    ...fields
  }
}

const under = (parent: number, parent_domain: string): Partial<Domain> => ({
  parent,
  parent_domain
})

const SAMPLE: Domain[] = [
  base(501, "example.com", 420),
  attached(601, "plex.example.com", 0, 400, under(501, "example.com")),
  attached(602, "requests.example.com", 1, 212, under(501, "example.com")),
  attached(603, "cloud.example.com", 44, 38, under(501, "example.com")),
  base(502, "media.example.org", 190),
  attached(
    604,
    "watch.media.example.org",
    2,
    0.2,
    under(502, "media.example.org")
  ),
  // Owned but not used by anything yet, so it can be deleted.
  base(503, "example.net", 12),
  // Not under a base domain of the account's. The first two can have their
  // DNS checked again (one passes, one fails); deleting the third fails.
  attached(605, "tv.family-name.io", 3, 300, {
    type: null,
    parent: 590,
    parent_domain: "family-name.io"
  }),
  attached(606, "moved.old-host.dev", 4, 150, {
    type: null,
    parent: 591,
    parent_domain: "old-host.dev"
  }),
  attached(607, "locked.example.io", 5, 90, {}),
  // The platform's own domains, which the page leaves out.
  attached(608, "plex.media-box.appbox.co", 0, 400, under(1, "appbox.co")),
  attached(609, "abc123.abx.bz", 1, 212, under(2, "abx.bz"))
]

const MANY: Domain[] = [
  ...SAMPLE,
  ...Array.from({ length: 52 }, (_, index) =>
    attached(
      700 + index,
      `app-${String(index + 1).padStart(2, "0")}.example.com`,
      index,
      index * 3 + 1,
      under(501, "example.com")
    )
  )
]

const INSTALLS = new Map<number, DomainInstall>(
  demoInstalledApps.map((app) => [
    app.id,
    { name: app.display_name, icon: app.icon_image }
  ])
)
const APPBOXES = new Map(cylos.map((cylo) => [cylo.id, cylo.name]))

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The custom domains page on sample data. Deleting and checking DNS change
 * local state only; nothing is sent anywhere.
 */
export function DemoDomains() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [deleted, setDeleted] = useState<ReadonlySet<number>>(new Set())

  const requested = searchParams.get("state")
  const state: SampleState =
    STATES.find((entry) => entry.value === requested)?.value ?? "normal"

  const source = state === "many" ? MANY : state === "empty" ? [] : SAMPLE
  const domains: Loadable<Domain[]> =
    state === "loading"
      ? { status: "loading" }
      : state === "error"
        ? { status: "error" }
        : {
            status: "ready",
            data: source.filter((domain) => !deleted.has(domain.id))
          }

  return (
    <AppShell
      demo
      width="wide"
      title="Custom domains"
      currentDesignHref={ROUTES.DOMAINS}
      user={demoUser}
      search={buildSearchGroups(cylos, appsByCylo, true)}
    >
      <div className="grid grid-cols-1 gap-6">
        {/* Sample page only: a way to see the states real data rarely shows. */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-kumo-line px-4 py-2.5">
          <span className="text-kumo-subtle">Sample state</span>
          <Select
            aria-label="Sample state"
            size="sm"
            className="w-52"
            value={state}
            onValueChange={(value) =>
              router.replace(
                value && value !== "normal"
                  ? `${pathname}?state=${String(value)}`
                  : pathname
              )
            }
            renderValue={(value) =>
              STATES.find((entry) => entry.value === value)?.label
            }
          >
            {STATES.map((entry) => (
              <Select.Option key={entry.value} value={entry.value}>
                {entry.label}
              </Select.Option>
            ))}
          </Select>
        </div>

        <DomainsView
          domains={domains}
          installs={INSTALLS}
          appboxes={APPBOXES}
          // Pretend the request takes a moment. One sample always fails, to
          // show what a failed delete looks like.
          onDelete={async (domain) => {
            await wait(700)
            if (domain.domain.startsWith("locked.")) {
              throw new Error("sample failure")
            }
            setDeleted((current) => new Set(current).add(domain.id))
          }}
          onCheckDns={async (domain) => {
            await wait(900)
            return domain.domain.startsWith("moved.")
              ? {
                  verified: false,
                  expected_ip: SERVER_IP,
                  resolved_ip: "198.51.100.7"
                }
              : {
                  verified: true,
                  expected_ip: SERVER_IP,
                  resolved_ip: SERVER_IP
                }
          }}
        />
      </div>
    </AppShell>
  )
}
