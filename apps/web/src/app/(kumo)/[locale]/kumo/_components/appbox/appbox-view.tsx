"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Button,
  Empty,
  Link as KumoLink,
  LinkButton,
  Tabs
} from "@cloudflare/kumo"
import { ArrowClockwiseIcon, HardDrivesIcon } from "@phosphor-icons/react"
import type { CyloDetail } from "@/api/cylos/cylos"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { RAIL_FALLBACK, ShellBar, ShellRail } from "../app-shell"
import { InstalledAppsList } from "../installed/installed-apps-list"
import {
  InstanceStatusBadge,
  type InstanceAction
} from "../installed/instance-controls"
import { kumoRoutes } from "../kumo-routes"
import { EMPTY_IN_CARD, type Loadable } from "../shared"
import { ActionDialog } from "../ui/actions-dialog"
import { ViewSkeleton } from "../ui/skeletons"
import { CyloAlerts } from "./cylo-alerts"
import { CyloCharts } from "./cylo-charts"
import { CyloUsageRail, CyloUsageStrip } from "./cylo-usage"
import { FileExplorer } from "./file-explorer"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  installedApps: "Installed apps",
  installApp: "Install an app"
} as const

export interface AppboxViewProps {
  cylo: Loadable<CyloDetail>
  /** The apps installed on this Appbox. */
  apps: Loadable<InstalledApp[]>
  /** Install id → saved pin order. */
  pinned: ReadonlyMap<number, number>
  onAppAction: (action: InstanceAction, ids: number[]) => Promise<unknown>
  onTogglePin: (app: InstalledApp, pin: boolean) => Promise<unknown>
  restartPending: boolean
  /** Restarts the Appbox. Resolves once the request has been accepted. */
  onRestart: () => Promise<unknown>
}

/**
 * One Appbox: how much of it is used, how it has been behaving, the apps on
 * it and its files. Laid out like Cloudflare's zone overview: tabs and the
 * main action in a band under the top bar, usage and details in the column
 * at the edge of the window, metrics stacked down the page.
 */
export function AppboxView({
  cylo: cyloState,
  apps,
  pinned,
  onAppAction,
  onTogglePin,
  restartPending,
  onRestart
}: AppboxViewProps) {
  const t = useTranslations("appboxmanager")
  const [activeTab, setActiveTab] = useState("summary")
  const [restartOpen, setRestartOpen] = useState(false)

  if (cyloState.status === "loading") return <ViewSkeleton />

  if (cyloState.status === "error") {
    return (
      <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
        <Empty
          className={EMPTY_IN_CARD}
          icon={<HardDrivesIcon size={40} />}
          title={t("cyloDetail.notFound")}
          description={t("cyloDetail.notFoundDescription")}
          contents={
            <LinkButton href={kumoRoutes.appboxes} variant="secondary">
              {t("cyloDetail.backToAppboxes")}
            </LinkButton>
          }
        />
      </div>
    )
  }

  const cylo = cyloState.data
  // Apps on a restarting or migrating Appbox show as that, as in the current design.
  const appsWithEffectiveStatus: Loadable<InstalledApp[]> =
    apps.status === "ready"
      ? {
          status: "ready",
          data: apps.data.map((app) => ({
            ...app,
            status:
              cylo.status === "restarting"
                ? "restarting"
                : cylo.is_migrating
                  ? "migrating"
                  : app.status
          }))
        }
      : apps

  return (
    <div className="grid grid-cols-1 gap-6">
      <ShellBar>
        <Tabs
          variant="segmented"
          tabs={[
            { value: "summary", label: t("cyloDetail.summary") },
            { value: "file-explorer", label: t("cyloDetail.fileExplorer") }
          ]}
          value={activeTab}
          onValueChange={setActiveTab}
        />
        <Button
          icon={ArrowClockwiseIcon}
          loading={restartPending}
          disabled={
            cylo.status === "restarting" ||
            cylo.status === "migrating" ||
            cylo.status === "installing" ||
            restartPending
          }
          onClick={() => setRestartOpen(true)}
        >
          {t("cyloDetail.restart")}
        </Button>
      </ShellBar>

      <ActionDialog
        open={restartOpen}
        onOpenChange={setRestartOpen}
        title={t("cyloDetail.restartTitle")}
        description={t("cyloDetail.restartDescription")}
        cancelLabel={t("cyloDetail.cancel")}
        cancelDisabled={restartPending}
        onCancel={() => setRestartOpen(false)}
        confirmLabel={t("cyloDetail.restart")}
        confirmLoading={restartPending}
        confirmDisabled={restartPending}
        onConfirm={() => {
          void onRestart().then(
            () => setRestartOpen(false),
            () => undefined
          )
        }}
      />

      <header className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-kumo-base text-kumo-subtle ring ring-kumo-line">
          <HardDrivesIcon size={26} />
        </span>
        <div className="grid min-w-0 gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="min-w-0 text-2xl font-semibold break-words">
              {cylo.name}
            </h1>
            <InstanceStatusBadge status={cylo.status} />
          </div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-kumo-subtle">
            <span className="font-mono text-[0.9em]">{cylo.server_name}</span>
            {cylo.server_host && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[0.9em] break-all">
                  {cylo.server_host}
                </span>
              </>
            )}
            {cylo.package_name && (
              <>
                <span aria-hidden="true">·</span>
                <span>{cylo.package_name}</span>
              </>
            )}
          </p>
        </div>
      </header>

      {/* Usage and details sit in the shell's right-hand column once it docks. */}
      <ShellRail>
        <CyloUsageRail cylo={cylo} />
      </ShellRail>

      {activeTab === "summary" && (
        <>
          <CyloAlerts
            cylo={cylo}
            onSwitchToFileExplorer={() => setActiveTab("file-explorer")}
          />

          {/* Until then the usage figures are a strip here. */}
          <div className={RAIL_FALLBACK}>
            <CyloUsageStrip cylo={cylo} />
          </div>

          <CyloCharts cylo={cylo} />

          <section className="grid grid-cols-1 gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{COPY.installedApps}</h2>
              <KumoLink href={kumoRoutes.appStore}>{COPY.installApp}</KumoLink>
            </div>
            <InstalledAppsList
              apps={appsWithEffectiveStatus}
              pinned={pinned}
              onAction={onAppAction}
              onTogglePin={onTogglePin}
            />
          </section>
        </>
      )}

      {activeTab === "file-explorer" && (
        <FileExplorer cyloId={cylo.id} serverName={cylo.server_name} />
      )}
    </div>
  )
}
