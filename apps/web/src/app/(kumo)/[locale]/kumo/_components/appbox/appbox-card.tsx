import type { ReactNode } from "react"
import { cn, LayerCard } from "@cloudflare/kumo"
import type { CyloSummary } from "@/api/cylos/cylos"
import { Link } from "@/i18n/routing"
import { formatBytes, formatStorageGB } from "@/lib/utils/format"
import { AppStrip, type StripApp } from "../installed/app-strip"
import { kumoRoutes } from "../kumo-routes"
import { percentOf, usageTone, type ServiceUsage } from "../shared"
import { AppboxStatusBadges } from "./appbox-status"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  storage: "Storage",
  storageHint: (used: string, total: string) => `${used} of ${total}`,
  appSlots: "App slots",
  upload: "Upload, 30 days",
  download: "Download, 30 days",
  apps: "Apps",
  appsOn: (name: string) => `Apps on ${name}`
} as const

function Stat({
  label,
  value,
  suffix,
  hint,
  children
}: {
  label: string
  value: string
  suffix?: string
  hint?: string
  children?: ReactNode
}) {
  return (
    <div className="grid content-start gap-1">
      <dt className="text-sm text-kumo-subtle">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">
        {value}
        {suffix && (
          <span className="text-base font-normal text-kumo-subtle">
            {" "}
            {suffix}
          </span>
        )}
      </dd>
      {children}
      {hint && <dd className="text-sm text-kumo-subtle">{hint}</dd>}
    </div>
  )
}

/** An Appbox at a glance: storage, app slots, 30 days of traffic and its apps. */
export function AppboxCard({
  cylo,
  usage,
  apps = []
}: {
  cylo: CyloSummary
  usage?: ServiceUsage
  /** Installed apps, pinned first. Shown as a shortcut strip. */
  apps?: StripApp[]
}) {
  const storageUsed = usage?.storageUsedGb ?? cylo.storage_used
  const storagePercent = percentOf(storageUsed, cylo.storage_total)
  const upload = usage?.uploadBytes ?? cylo.upload_used
  const download = usage?.downloadBytes ?? cylo.download_used

  return (
    <LayerCard>
      {/* Wraps, so a name is not squeezed out by its badges on a phone. */}
      <LayerCard.Secondary className="flex-wrap justify-between gap-x-3 gap-y-1.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <Link
            href={kumoRoutes.appbox(cylo.id)}
            className="truncate font-medium text-kumo-default no-underline hover:underline"
          >
            {cylo.name}
          </Link>
          <span className="truncate font-mono text-[0.9em] font-normal">
            {cylo.server_name}
          </span>
        </div>
        <AppboxStatusBadges cylo={cylo} />
      </LayerCard.Secondary>

      <LayerCard.Primary className="gap-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            label={COPY.storage}
            value={`${storagePercent}%`}
            hint={COPY.storageHint(
              formatStorageGB(storageUsed),
              formatStorageGB(cylo.storage_total)
            )}
          >
            <dd
              role="meter"
              aria-label={COPY.storage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(storagePercent, 100)}
              aria-valuetext={`${storagePercent}%`}
              className="h-1.5 overflow-hidden rounded-full bg-kumo-fill"
            >
              <div
                className={cn("h-full rounded-full", usageTone(storagePercent))}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </dd>
          </Stat>
          <Stat
            label={COPY.appSlots}
            value={String(cylo.app_slots_used)}
            suffix={`/ ${cylo.app_slots_total}`}
          />
          <Stat label={COPY.upload} value={formatBytes(upload, 1)} />
          <Stat label={COPY.download} value={formatBytes(download, 1)} />
        </dl>

        {apps.length > 0 && (
          <div className="flex items-center gap-3 border-t border-kumo-hairline pt-3">
            <span className="shrink-0 text-kumo-subtle">{COPY.apps}</span>
            <AppStrip apps={apps} label={COPY.appsOn(cylo.name)} />
          </div>
        )}
      </LayerCard.Primary>
    </LayerCard>
  )
}
