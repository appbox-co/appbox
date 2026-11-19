"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Select } from "@cloudflare/kumo"
import { useQueryClient } from "@tanstack/react-query"
import type { CyloDetail } from "@/api/cylos/cylos"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { ROUTES } from "@/constants/routes"
import { usePathname, useRouter } from "@/i18n/routing"
import type { JobProgressData } from "@/lib/websocket/types"
import { DemoSession } from "../../_lib/demo-session"
import { seedStatsSamples } from "../../_lib/guards/stats"
import { AppShell } from "../../../_components/app-shell"
import { InstalledAppView } from "../../../_components/installed-app-view"
import { kumoRoutes } from "../../../_components/kumo-routes"
import { buildSearchGroups } from "../../../_components/quick-search"
import {
  appsByCylo,
  catalogue,
  cylos,
  demoCyloDetail,
  demoInstalledAppDetail,
  demoPinned,
  demoUser,
  demoVersions
} from "../../fixtures"

const GIB = 1024 ** 3

/** States the page has to handle that the sample data does not otherwise reach. */
const STATES = [
  { value: "normal", label: "Running normally" },
  { value: "installing", label: "Installing (job in progress)" },
  { value: "updating", label: "Updating" },
  { value: "stopped", label: "Stopped (start only)" },
  { value: "suspended", label: "Appbox suspended" },
  { value: "migrating", label: "Appbox migrating" },
  { value: "lowspace", label: "Appbox low on space" }
] as const

type SampleState = (typeof STATES)[number]["value"]

function applyState(
  app: InstalledApp,
  cylo: CyloDetail | undefined,
  state: SampleState
): { app: InstalledApp; cylo?: CyloDetail; job?: JobProgressData } {
  switch (state) {
    case "installing":
      return {
        app: { ...app, status: "installing" },
        cylo,
        job: {
          job_id: 1,
          cylo_id: app.cylo_id,
          instance_id: app.id,
          status: "Pulling the image for APP"
        }
      }
    case "updating":
      return { app: { ...app, status: "updating" }, cylo }
    case "stopped":
      return {
        app: { ...app, status: "offline", state: 0, enabled: false },
        cylo
      }
    case "suspended":
      return { app, cylo: cylo && { ...cylo, status: "suspended" } }
    case "migrating":
      return {
        app,
        cylo: cylo && {
          ...cylo,
          is_migrating: true,
          migration_progress: {
            phase: 5,
            complete: 62,
            live_migration: 1,
            total_sent: 310 * GIB,
            pre_migration_space_used: String(500 * GIB),
            reason: "",
            ETA: new Date(Date.now() + 40 * 60_000).toISOString(),
            avg_speed: "45.20 MB/s",
            old_server_name: cylo.server_name,
            new_server_name: "ams-57",
            transferred_percent: 62
          }
        }
      }
    case "lowspace":
      return {
        app,
        cylo: cylo && {
          ...cylo,
          is_low_quota: true,
          low_quota_details: { available_kib: 1.4 * 1024 * 1024 }
        }
      }
    default:
      return { app, cylo }
  }
}

/**
 * The charts are not fetched: the real page asks for them over the WebSocket
 * and the answers land in the query cache. The sample page has no socket, so
 * it puts sample series in the cache itself.
 */
function SeedCharts({ id }: { id: number }) {
  const client = useQueryClient()
  useState(() => seedStatsSamples(client, id))
  return null
}

/**
 * One installed app on sample data. The page's live sections run for real
 * inside the sample session, whose fetch guard answers them with sample data.
 */
export function DemoInstalledApp({ id }: { id: number }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const routes = kumoRoutes(true)
  const [pinned, setPinned] = useState(demoPinned.has(id))

  const base = demoInstalledAppDetail(id)
  const requested = searchParams.get("state")
  const state: SampleState =
    STATES.find((entry) => entry.value === requested)?.value ?? "normal"
  const sample = base
    ? applyState(base, demoCyloDetail(base.cylo_id), state)
    : undefined
  const catalogueApp = catalogue.find((entry) => entry.id === base?.app_id)

  return (
    <AppShell
      demo
      width="wide"
      title={base?.display_name ?? "Installed app"}
      parents={[{ label: "Installed apps", href: routes.installedApps }]}
      currentDesignHref={ROUTES.INSTALLED_APP_DETAIL(id)}
      user={demoUser}
      search={buildSearchGroups(cylos, appsByCylo, true)}
    >
      <div className="grid grid-cols-1 gap-6">
        {base && (
          // Sample page only: a way to see the states real data rarely shows.
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-kumo-line px-4 py-2.5">
            <span className="text-kumo-subtle">Sample state</span>
            <Select
              aria-label="Sample state"
              size="sm"
              className="w-60"
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
        )}

        <DemoSession>
          <SeedCharts id={id} />
          <InstalledAppView
            app={
              sample
                ? { status: "ready", data: sample.app }
                : { status: "error" }
            }
            cylo={sample?.cylo}
            catalogueVersions={catalogueApp ? demoVersions(catalogueApp) : []}
            job={sample?.job}
            pinned={pinned}
            pinPending={false}
            onTogglePin={() => setPinned((current) => !current)}
            // The real page asks the API; the sample page makes one up.
            onRevealField={async () => "s4mple-p4ssw0rd"}
          />
        </DemoSession>
      </div>
    </AppShell>
  )
}
