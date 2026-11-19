"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Select } from "@cloudflare/kumo"
import { useQueryClient } from "@tanstack/react-query"
import type { CyloDetail } from "@/api/cylos/cylos"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { ROUTES } from "@/constants/routes"
import { usePathname, useRouter } from "@/i18n/routing"
import { DemoSession } from "../../_lib/demo-session"
import { seedCyloStatsSamples } from "../../_lib/guards/cylo-stats"
import { AppShell } from "../../../_components/app-shell"
import { AppboxView } from "../../../_components/appbox-view"
import type { InstanceAction } from "../../../_components/instance-controls"
import { kumoRoutes } from "../../../_components/kumo-routes"
import { buildSearchGroups } from "../../../_components/quick-search"
import {
  appsByCylo,
  cylos,
  demoCyloDetail,
  demoInstalledApps,
  demoPinned,
  demoUser,
  RESULTING_STATUS
} from "../../fixtures"

const GIB = 1024 ** 3
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** States the page has to handle that the sample data does not otherwise reach. */
const STATES = [
  { value: "normal", label: "Running normally" },
  { value: "restarting", label: "Restarting" },
  { value: "suspended", label: "Suspended" },
  { value: "offline", label: "Offline" },
  { value: "throttled", label: "Disk throttled" },
  { value: "lowspace", label: "Low on space" },
  { value: "migrating", label: "Migrating" }
] as const

type SampleState = (typeof STATES)[number]["value"]

function applyState(cylo: CyloDetail, state: SampleState): CyloDetail {
  switch (state) {
    case "restarting":
    case "suspended":
    case "offline":
      return { ...cylo, status: state }
    case "throttled":
      return {
        ...cylo,
        is_throttled: true,
        throttle_details: {
          throttle_level: 2,
          throttle_rate_mbps: 40,
          throttle_iops: 1200,
          expires_at: new Date(Date.now() + 3 * 3_600_000).toISOString(),
          app_instance_domain: `qbittorrent.${cylo.name}.appbox.co`,
          top_process_name: "qbittorrent-nox",
          disk_util_percent: 85,
          duration_minutes: 95
        }
      }
    case "lowspace":
      return {
        ...cylo,
        is_low_quota: true,
        low_quota_details: { available_kib: 1.4 * 1024 * 1024 }
      }
    case "migrating":
      return {
        ...cylo,
        status: "migrating",
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
    default:
      return cylo
  }
}

/**
 * The charts are not fetched: the real page asks for them over the WebSocket
 * and the answers land in the query cache. The sample page has no socket, so
 * it puts sample series in the cache itself.
 */
function SeedCharts({ id }: { id: number }) {
  const client = useQueryClient()
  useState(() => seedCyloStatsSamples(client, id))
  return null
}

/**
 * One Appbox on sample data. Its live sections (charts, file explorer) run for
 * real inside the sample session, whose fetch guard answers them with sample
 * data; app actions, pins and the restart change local state only.
 */
export function DemoAppbox({ id }: { id: number }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [apps, setApps] = useState(() =>
    demoInstalledApps.filter((app) => app.cylo_id === id)
  )
  const [pinned, setPinned] = useState<ReadonlyMap<number, number>>(demoPinned)
  const [restarting, setRestarting] = useState(false)

  const base = demoCyloDetail(id)
  const requested = searchParams.get("state")
  const state: SampleState =
    STATES.find((entry) => entry.value === requested)?.value ?? "normal"
  const cylo = base ? applyState(base, state) : undefined

  // Pretend the request takes a moment, then show the state it would lead to.
  const runAction = async (action: InstanceAction, ids: number[]) => {
    await wait(700)
    setApps((current) =>
      current.map((app) =>
        ids.includes(app.id)
          ? { ...app, status: RESULTING_STATUS[action] }
          : app
      )
    )
  }

  const togglePin = async (app: InstalledApp, pin: boolean) => {
    await wait(400)
    setPinned((current) => {
      const next = new Map(current)
      if (pin) next.set(app.id, Math.max(-1, ...next.values()) + 1)
      else next.delete(app.id)
      return next
    })
  }

  const restart = async () => {
    setRestarting(true)
    await wait(900)
    setRestarting(false)
    router.replace(`${pathname}?state=restarting`)
  }

  return (
    <AppShell
      demo
      width="wide"
      title={base?.name ?? "Appbox"}
      parents={[{ label: "Appboxes", href: kumoRoutes(true).appboxes }]}
      currentDesignHref={ROUTES.APPBOX_DETAIL(id)}
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
        )}

        <DemoSession>
          <SeedCharts id={id} />
          <AppboxView
            cylo={cylo ? { status: "ready", data: cylo } : { status: "error" }}
            apps={{ status: "ready", data: apps }}
            pinned={pinned}
            onAppAction={runAction}
            onTogglePin={togglePin}
            restartPending={restarting}
            onRestart={restart}
          />
        </DemoSession>
      </div>
    </AppShell>
  )
}
