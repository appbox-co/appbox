"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Select } from "@cloudflare/kumo"
import { useQueryClient } from "@tanstack/react-query"
import type { CyloSummary } from "@/api/cylos/cylos"
import { queryKeys } from "@/constants/query-keys"
import { ROUTES } from "@/constants/routes"
import { usePathname, useRouter } from "@/i18n/routing"
import { DemoSession } from "../_lib/demo-session"
import { sampleCyloStats } from "../_lib/guards/cylo-stats"
import { AppShell } from "../../_components/app-shell"
import { AppboxesView } from "../../_components/appboxes-view"
import { buildSearchGroups } from "../../_components/quick-search"
import type { Loadable } from "../../_components/shared"
import { appsByCylo, cylos, demoUser } from "../fixtures"

/** States the page has to handle that the sample data does not otherwise reach. */
const STATES = [
  { value: "normal", label: "Three Appboxes" },
  { value: "single", label: "One Appbox" },
  { value: "empty", label: "No Appboxes" },
  { value: "loading", label: "Loading" },
  { value: "error", label: "Failed to load" }
] as const

type SampleState = (typeof STATES)[number]["value"]

function applyState(state: SampleState): Loadable<CyloSummary[]> {
  switch (state) {
    case "single":
      return { status: "ready", data: cylos.slice(0, 1) }
    case "empty":
      return { status: "ready", data: [] }
    case "loading":
      return { status: "loading" }
    case "error":
      return { status: "error" }
    default:
      return { status: "ready", data: cylos }
  }
}

/** The sample installs carry no boost slots, so give one Appbox a couple. */
const BOOST = new Map([[1, 2]])

/**
 * Each Appbox's history is not fetched: the real page asks for 30 days of it
 * over the WebSocket and the answer lands in the query cache. The sample page
 * has no socket, so it puts sample series in the cache itself.
 */
function SeedHistory() {
  const client = useQueryClient()
  useState(() => {
    for (const cylo of cylos) {
      client.setQueryData(
        queryKeys.cylos.stats(cylo.id),
        sampleCyloStats("30d", cylo.id)
      )
    }
  })
  return null
}

/** The Appboxes page on sample data. It only reads; nothing on it changes anything. */
export function DemoAppboxes() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const requested = searchParams.get("state")
  const state: SampleState =
    STATES.find((entry) => entry.value === requested)?.value ?? "normal"

  return (
    <AppShell
      demo
      width="wide"
      title="Appboxes"
      currentDesignHref={ROUTES.APPBOXES}
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

        <DemoSession>
          <SeedHistory />
          <AppboxesView
            cylos={applyState(state)}
            apps={appsByCylo}
            boost={BOOST}
          />
        </DemoSession>
      </div>
    </AppShell>
  )
}
