"use client"

import { useSearchParams } from "next/navigation"
import { Select } from "@cloudflare/kumo"
import type { AbuseReport } from "@/api/account/account"
import { ROUTES } from "@/constants/routes"
import { usePathname, useRouter } from "@/i18n/routing"
import { AbuseReportsView } from "../../../_components/account/abuse-reports-view"
import { AppShell } from "../../../_components/app-shell"
import { buildSearchGroups } from "../../../_components/quick-search"
import type { Loadable } from "../../../_components/shared"
import { appsByCylo, cylos, demoUser } from "../../fixtures"
import { manyAbuseReports, sampleAbuseReports } from "./sample-reports"

/** States the page has to handle that the sample data does not otherwise reach. */
const STATES = [
  { value: "normal", label: "Ten reports" },
  { value: "many", label: "Seventy reports" },
  { value: "empty", label: "No reports" },
  { value: "loading", label: "Loading" },
  { value: "error", label: "Failed to load" }
] as const

type SampleState = (typeof STATES)[number]["value"]

function applyState(state: SampleState): Loadable<AbuseReport[]> {
  switch (state) {
    case "many":
      return { status: "ready", data: manyAbuseReports }
    case "empty":
      return { status: "ready", data: [] }
    case "loading":
      return { status: "loading" }
    case "error":
      return { status: "error" }
    default:
      return { status: "ready", data: sampleAbuseReports }
  }
}

/** The abuse reports page on sample data. It only reads; nothing is sent anywhere. */
export function DemoAbuseReports() {
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
      title="Abuse reports"
      currentDesignHref={ROUTES.ABUSE_REPORTS}
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

        <AbuseReportsView reports={applyState(state)} />
      </div>
    </AppShell>
  )
}
