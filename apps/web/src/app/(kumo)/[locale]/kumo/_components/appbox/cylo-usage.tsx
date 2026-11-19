"use client"

import { useLocale } from "next-intl"
import { cn } from "@cloudflare/kumo"
import type { CyloDetail } from "@/api/cylos/cylos"
import { useCyloBandwidth, useCyloDiskQuota } from "@/api/cylos/hooks/use-cylos"
import { useInstalledApps } from "@/api/installed-apps/hooks/use-installed-apps"
import {
  UsageRailSection,
  UsageStrip,
  type UsageFigures
} from "../usage-summary"

const COPY = {
  usage: "Usage",
  details: "Details",
  plan: "Plan",
  server: "Server",
  address: "Address",
  created: "Created"
} as const

/**
 * The Appbox's usage figures. Storage and bandwidth prefer the live values
 * pushed over the socket and fall back to the ones in the Appbox record, as
 * the current design does.
 */
function useCyloUsage(cylo: CyloDetail, userId?: number): UsageFigures {
  const { data: quota } = useCyloDiskQuota(cylo.id)
  const { data: bandwidth } = useCyloBandwidth(cylo.id)
  const { data: installedApps } = useInstalledApps(cylo.id, userId)

  return {
    storageUsed: quota?.used_gb ?? cylo.storage_used,
    storageTotal: cylo.storage_total,
    uploadUsed: bandwidth?.upload_bytes ?? cylo.upload_used,
    downloadUsed: bandwidth?.download_bytes ?? cylo.download_used,
    slotsUsed: cylo.app_slots_used,
    slotsTotal: cylo.app_slots_total,
    boostSlots:
      installedApps?.reduce((sum, app) => sum + (app.boost_slots ?? 0), 0) ?? 0
  }
}

interface CyloUsageProps {
  cylo: CyloDetail
  userId?: number
}

/** Four figures in a row, for screens with no room for a side column. */
export function CyloUsageStrip({ cylo, userId }: CyloUsageProps) {
  return <UsageStrip figures={useCyloUsage(cylo, userId)} />
}

/** The same figures, and the Appbox's details, for the shell's right-hand column. */
export function CyloUsageRail({ cylo, userId }: CyloUsageProps) {
  const locale = useLocale()
  const figures = useCyloUsage(cylo, userId)
  const created = cylo.created_at ? new Date(cylo.created_at) : null

  return (
    <>
      <UsageRailSection title={COPY.usage} figures={figures} />

      <div className="p-4">
        <section className="rounded-lg bg-kumo-base px-4 pt-3.5 pb-2 shadow-xs ring ring-kumo-line">
          <h2 className="font-medium">{COPY.details}</h2>
          <dl className="mt-1.5 grid grid-cols-1 divide-y divide-kumo-hairline">
            {(
              [
                [COPY.plan, cylo.package_name, false],
                [COPY.server, cylo.server_name, true],
                [COPY.address, cylo.server_host, true],
                [
                  COPY.created,
                  created && !Number.isNaN(created.getTime())
                    ? created.toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    : "",
                  false
                ]
              ] as const
            )
              .filter(([, value]) => value)
              .map(([label, value, mono]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 py-2"
                >
                  <dt className="shrink-0 text-kumo-subtle">{label}</dt>
                  <dd
                    className={cn(
                      "min-w-0 truncate text-end",
                      mono ? "font-mono text-[0.9em]" : "font-medium"
                    )}
                  >
                    {value}
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      </div>
    </>
  )
}
