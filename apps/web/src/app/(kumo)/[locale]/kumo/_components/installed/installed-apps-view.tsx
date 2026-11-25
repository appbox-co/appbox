"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn, LinkButton, SkeletonLine } from "@cloudflare/kumo"
import { PackageIcon, PlusIcon } from "@phosphor-icons/react"
import type { CyloSummary } from "@/api/cylos/cylos"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { RAIL_FALLBACK, ShellRail } from "../app-shell"
import { kumoRoutes } from "../kumo-routes"
import { percentOf, usageTone, type Loadable } from "../shared"
import { RailStatusCard } from "../ui/rail-status"
import { UsageRing } from "../ui/usage-ring"
import { ALL_STATUSES, InstalledAppsList } from "./installed-apps-list"
import {
  INSTANCE_STATUSES,
  InstanceStatusBadge,
  statusLabel,
  type InstanceAction
} from "./instance-controls"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  title: "Installed apps",
  install: "Install an app",
  status: "Status",
  slotsTitle: "App slots",
  addAppbox: "Add Appbox",
  filterTo: (status: string) => `Show only ${status.toLowerCase()} apps`,
  slotsUsed: (used: number, total: number) => `${used} of ${total} used`
} as const

export interface InstalledAppsViewProps {
  /** Every install on the account. */
  apps: Loadable<InstalledApp[]>
  /** The account's Appboxes, for the Appbox filter and the app slot summary. */
  cylos: Loadable<CyloSummary[]>
  /** Install id → saved pin order. Pinned installs lead the default order. */
  pinned: ReadonlyMap<number, number>
  /** Runs the action on the given install ids. Resolves when the requests settle. */
  onAction: (action: InstanceAction, ids: number[]) => Promise<unknown>
  /** Pins or unpins one install. Resolves when the request settles. */
  onTogglePin: (app: InstalledApp, pin: boolean) => Promise<unknown>
}

/* -------------------------------------------------------------------------- */
/*  App slot summary                                                           */
/* -------------------------------------------------------------------------- */

/** How full each Appbox is, since free slots decide what can be installed next. */
function SlotsSummary({ cylos }: { cylos: Loadable<CyloSummary[]> }) {
  if (cylos.status === "error") return null
  if (cylos.status === "ready" && cylos.data.length === 0) return null

  return (
    <section className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg bg-kumo-base px-5 py-4 shadow-xs ring ring-kumo-line">
      <h2 className="font-medium text-kumo-subtle">{COPY.slotsTitle}</h2>
      {cylos.status === "loading" ? (
        <SkeletonLine className="h-2.5 w-64 max-w-full rounded-full" />
      ) : (
        <ul className="grid min-w-0 flex-1 list-none grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-x-8 gap-y-3">
          {cylos.data.map((cylo) => {
            const percent = percentOf(cylo.app_slots_used, cylo.app_slots_total)
            const usage = COPY.slotsUsed(
              cylo.app_slots_used,
              cylo.app_slots_total
            )
            return (
              <li key={cylo.id} className="grid min-w-0 gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">
                    {cylo.name}
                  </span>
                  <span className="shrink-0 text-kumo-subtle tabular-nums">
                    {usage}
                  </span>
                </div>
                <div
                  role="meter"
                  aria-label={`${cylo.name}: ${COPY.slotsTitle.toLowerCase()}`}
                  aria-valuemin={0}
                  aria-valuemax={cylo.app_slots_total}
                  aria-valuenow={cylo.app_slots_used}
                  aria-valuetext={usage}
                  className="h-1.5 overflow-hidden rounded-full bg-kumo-fill"
                >
                  <div
                    className={cn("h-full rounded-full", usageTone(percent))}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Right-hand column (wide screens)                                           */
/* -------------------------------------------------------------------------- */

/** App slot usage per Appbox, laid out like the usage block on Cloudflare's list pages. */
function RailSlots({ cylos }: { cylos: Loadable<CyloSummary[]> }) {
  if (cylos.status === "error") return null
  if (cylos.status === "ready" && cylos.data.length === 0) return null

  return (
    <section className="grid grid-cols-1 gap-2 border-b border-kumo-line px-5 pt-5 pb-3">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <h2 className="font-semibold">{COPY.slotsTitle}</h2>
        <LinkButton href="/" size="sm" variant="secondary">
          {COPY.addAppbox}
        </LinkButton>
      </div>
      {cylos.status === "loading" ? (
        <div className="grid gap-3 py-2.5">
          <SkeletonLine className="h-2.5 w-full rounded-full" />
          <SkeletonLine className="h-2.5 w-2/3 rounded-full" />
        </div>
      ) : (
        <ul className="grid list-none grid-cols-1 divide-y divide-dashed divide-kumo-line">
          {cylos.data.map((cylo) => (
            <li key={cylo.id} className="flex items-center gap-2.5 py-2.5">
              <UsageRing
                percent={percentOf(cylo.app_slots_used, cylo.app_slots_total)}
              />
              <span className="min-w-0 flex-1 truncate text-kumo-subtle">
                {cylo.name}
              </span>
              <span
                className="shrink-0 tabular-nums"
                title={COPY.slotsUsed(
                  cylo.app_slots_used,
                  cylo.app_slots_total
                )}
              >
                {cylo.app_slots_used} / {cylo.app_slots_total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** How many apps are in each status. Each row filters the list to that status. */
function RailStatus({
  apps,
  status,
  onChange
}: {
  apps: InstalledApp[]
  status: string
  onChange: (status: string) => void
}) {
  const entries = INSTANCE_STATUSES.map((value) => ({
    value,
    count: apps.filter((app) => app.status === value).length,
    badge: <InstanceStatusBadge status={value} />,
    hint: COPY.filterTo(statusLabel(value))
  })).filter((entry) => entry.count > 0)

  return (
    <RailStatusCard
      title={COPY.status}
      entries={entries}
      active={status}
      onSelect={(value) => onChange(status === value ? ALL_STATUSES : value)}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Every app installed on the account: the list itself, with a summary of app
 * slots and statuses beside it (or above it, where there is no room beside).
 */
export function InstalledAppsView({
  apps,
  cylos,
  pinned,
  onAction,
  onTogglePin
}: InstalledAppsViewProps) {
  const t = useTranslations("appboxmanager.installedApps")
  const [status, setStatus] = useState<string>(ALL_STATUSES)

  const all = apps.status === "ready" ? apps.data : []

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold">
            <PackageIcon aria-hidden="true" size={24} />
            {COPY.title}
          </h1>
          <p className="text-kumo-subtle">{t("description")}</p>
        </div>
        <LinkButton
          href={kumoRoutes.appStore}
          variant="primary"
          icon={PlusIcon}
        >
          {COPY.install}
        </LinkButton>
      </header>

      {/* With room to spare, the summary lives in the shell's right-hand column. */}
      <ShellRail>
        <RailSlots cylos={cylos} />
        <RailStatus apps={all} status={status} onChange={setStatus} />
      </ShellRail>

      {/* Until that column docks, it is a strip: above the list, or after
          it on small screens, where it would push the apps down. */}
      <div className={cn("order-last sm:order-none", RAIL_FALLBACK)}>
        <SlotsSummary cylos={cylos} />
      </div>

      <InstalledAppsList
        apps={apps}
        appboxes={cylos.status === "ready" ? cylos.data : []}
        pinned={pinned}
        onAction={onAction}
        onTogglePin={onTogglePin}
        status={status}
        onStatusChange={setStatus}
      />
    </div>
  )
}
