"use client"

import { useEffect, useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Cylo, User } from "@/lib/auth/session"
import { AuthProvider } from "@/providers/auth-provider"
import { WebSocketProvider } from "@/providers/websocket-provider"
import {
  catalogue,
  cylos,
  demoAppDetail,
  demoInstances,
  demoUser,
  demoVersions
} from "../fixtures"
import { actionsSamples } from "./guards/actions"
import { consoleSamples } from "./guards/console"
import { customDomainsSamples } from "./guards/custom-domains"
import { customTablesSamples } from "./guards/custom-tables"
import { cyloStatsSamples } from "./guards/cylo-stats"
import { filesSamples } from "./guards/files"
import { statsSamples } from "./guards/stats"
import type { SampleHandler, SampleRequest } from "./guards/types"

/** Must match the base URL in api/client.ts. */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.appbox.co/v1"

/** Appbox servers answer on their own hosts under this domain (see api/client.ts). */
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "appbox.co"

const REFUSAL = "This is the sample page. Nothing was installed or changed."

const sessionUser: User = {
  id: 1,
  email: demoUser.email,
  firstname: "Demo",
  lastname: "User",
  alias: demoUser.name,
  avatar: null,
  roles: "user",
  two_factor_enabled: false,
  brand_id: 1,
  currency_code: "EUR",
  created_at: "2024-01-15T09:00:00Z"
}

const sessionCylos: Cylo[] = cylos.map((cylo) => ({
  id: cylo.id,
  user_id: sessionUser.id,
  server_id: cylo.id,
  server_name: cylo.server_name,
  display_name: cylo.name,
  package_id: cylo.id,
  package_name: cylo.package_name,
  domain: `${cylo.name}.appbox.co`,
  domain_id: cylo.id,
  server_ip: "203.0.113.10",
  status: cylo.status,
  disk_quota: cylo.storage_total,
  disk_used: cylo.storage_used,
  app_slots: cylo.app_slots_total,
  app_slots_used: cylo.app_slots_used,
  resource_multiplier: cylo.resource_multiplier,
  whmcs_serviceid: String(1000 + cylo.id),
  created_at: "2024-01-15T09:00:00Z"
}))

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  })
}

/** An Appbox as the API returns it, before the client maps it. */
function rawCylo(cylo: (typeof cylos)[number]) {
  return {
    id: cylo.id,
    cyloname: cylo.name,
    server_name: cylo.server_name,
    enabled: 1,
    restarting: cylo.status === "restarting" ? 1 : 0,
    storage_limit: cylo.storage_total,
    app_slots: cylo.app_slots_total,
    free_slots: cylo.app_slots_total - cylo.app_slots_used,
    resource_multiplier: cylo.resource_multiplier,
    is_throttled: cylo.is_throttled,
    low_quota: cylo.is_low_quota,
    package_name: cylo.package_name,
    domain: `${cylo.name}.appbox.co`,
    domain_id: cylo.id,
    server_id: cylo.id,
    server_ip: "203.0.113.10",
    whmcs_serviceid: String(1000 + cylo.id)
  }
}

/** Ports and the Appbox record, which the management page's own parts ask for. */
const coreSamples: SampleHandler = ({ target, path }) => {
  if (target === "server" && /^ports\/\d+$/.test(path)) {
    return {
      success: true,
      data: [
        [32400, 32400, "tcp"],
        [8324, 41872, "tcp"],
        [1900, 41873, "udp"],
        [32410, 41874, "udp"],
        [32469, 41875, "tcp"]
      ].map(([internal_port, host_port, protocol], index) => ({
        id: index + 1,
        internal_ip: "10.42.0.17",
        host_ip: "203.0.113.10",
        internal_port,
        host_port,
        protocol
      }))
    }
  }
  const cyloMatch = target === "api" ? path.match(/^cylos\/(\d+)$/) : null
  if (cyloMatch) {
    const cylo = cylos.find((entry) => entry.id === Number(cyloMatch[1]))
    return cylo ? rawCylo(cylo) : undefined
  }
  return undefined
}

/** Each feature's sample answers; the first handler to answer a request wins. */
const HANDLERS: SampleHandler[] = [
  actionsSamples,
  customTablesSamples,
  customDomainsSamples,
  statsSamples,
  cyloStatsSamples,
  consoleSamples,
  filesSamples,
  coreSamples
]

function refusal() {
  return json({ error: { status: 403, code: 0, message: REFUSAL } }, 403)
}

/** Sample answers for requests to an Appbox server's own API. */
function sampleServer(request: SampleRequest): Response {
  if (request.method !== "GET") return refusal()
  for (const handler of HANDLERS) {
    const body = handler(request)
    if (body !== undefined) return json(body)
  }
  return json({ success: true, data: [] })
}

/** Sample answers for the central API. */
function sampleApi(url: URL, method: string): Response {
  const path = url.pathname
    .slice(new URL(API_BASE_URL).pathname.length)
    .replace(/^\//, "")
  const param = (name: string) => url.searchParams.get(name)

  if (method === "POST" && path === "apps/install/validate") {
    return json({ valid: true, fieldErrors: {} })
  }
  // Two more checks that only read, answered so the domain forms can be tried.
  if (method === "POST" && path === "domains/validate") return json(true)
  if (method === "POST" && path === "domains/checkdns/v2") {
    return json({
      verified: true,
      expected_ip: "203.0.113.10",
      resolved_ip: "203.0.113.10"
    })
  }
  // Every other write, the install itself included, is refused.
  if (method !== "GET") return refusal()

  for (const handler of HANDLERS) {
    const body = handler({
      target: "api",
      method,
      path,
      params: url.searchParams
    })
    if (body !== undefined) return json(body)
  }

  const appMatch = path.match(/^apps\/(\d+)$/)
  if (appMatch) {
    const app = demoAppDetail(Number(appMatch[1]))
    if (!app) return json({ error: { status: 404, message: "Not found" } }, 404)
    const cylo = cylos.find((entry) => String(entry.id) === param("cylo_id"))
    if (!cylo) return json(app)
    // With a cylo_id the same endpoint answers with boost information.
    return json({
      // +10% resources per boost slot, up to double.
      boost_increment: 0.1,
      max_boost_multiplier: 2,
      max_install_boost_slots: 10,
      boost_install_allowed: 1,
      boost_install_block_reason: null,
      cylo_free_slots: cylo.app_slots_total - cylo.app_slots_used,
      base_memory: 4,
      base_cpus: 2,
      app_slots_cost: app.app_slots
    })
  }

  if (path === "appversions") {
    const app = catalogue.find((entry) => String(entry.id) === param("app_id"))
    return json({ items: app ? demoVersions(app) : [] })
  }
  if (path === "apps/instances") {
    return json({ items: catalogue.flatMap((app) => demoInstances(app)) })
  }
  if (path === "cylos") {
    return json({ items: cylos.map(rawCylo), totalCount: cylos.length })
  }
  if (path === "domains/app/install") {
    return json({
      items: [
        { id: 501, domain: "example.com", type: "domain" },
        { id: 502, domain: "media.example.org", type: "domain" }
      ]
    })
  }
  // Packages, restrictions and anything else: an empty list.
  return json({ items: [], totalCount: 0 })
}

/**
 * Replaces `fetch` so that no request from a sample page can reach the real
 * API or an Appbox server. This matters beyond convenience: those calls send
 * the browser's cookies, so on a machine that is signed in, the real
 * components rendered here would otherwise act on the real account.
 */
function installFetchGuard() {
  const original = window.fetch
  window.fetch = async (input, init) => {
    const href =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    const url = new URL(href, window.location.href)
    // The page's own requests (this dev server may itself sit under DOMAIN).
    if (url.origin === window.location.origin) return original(input, init)
    const method = (
      init?.method ?? (input instanceof Request ? input.method : "GET")
    ).toUpperCase()
    if (url.href.startsWith(API_BASE_URL)) return sampleApi(url, method)
    const isServer =
      (url.hostname === DOMAIN || url.hostname.endsWith(`.${DOMAIN}`)) &&
      url.pathname.startsWith("/v1/")
    if (!isServer) return original(input, init)
    return sampleServer({
      target: "server",
      method,
      path: url.pathname.slice("/v1/".length),
      params: url.searchParams
    })
  }
  return () => {
    window.fetch = original
  }
}

/**
 * A pretend signed-in session for sample pages: fixture user and Appboxes, a
 * private query cache, live updates switched off, and the fetch guard above.
 * Children render only once the guard is in place.
 */
export function DemoSession({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
          mutations: { retry: false }
        }
      })
  )
  const [guarded, setGuarded] = useState(false)

  useEffect(() => {
    const restore = installFetchGuard()
    // Children must not mount (and start fetching) before the guard exists.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuarded(true)
    return restore
  }, [])

  if (!guarded) return null

  return (
    <QueryClientProvider client={client}>
      <AuthProvider user={sessionUser} cylos={sessionCylos}>
        <WebSocketProvider wsEnabled={false}>{children}</WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
