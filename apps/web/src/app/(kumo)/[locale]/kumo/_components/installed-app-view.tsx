"use client"

import { useState, type ReactNode } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Button,
  Empty,
  Link as KumoLink,
  LinkButton,
  SkeletonLine,
  Tabs,
  Tooltip
} from "@cloudflare/kumo"
import {
  ArrowSquareOutIcon,
  PackageIcon,
  StarIcon
} from "@phosphor-icons/react"
import type { AppVersion } from "@/api/apps/app-store"
import type { CyloDetail } from "@/api/cylos/cylos"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { isLaunchWeekEnabled } from "@/config/launch-week-flags"
import { Link } from "@/i18n/routing"
import type { JobProgressData } from "@/lib/websocket/types"
import { useAuth } from "@/providers/auth-provider"
import { AppIcon } from "./app-icon"
import { ShellBar } from "./app-shell"
import { AppActions } from "./installed/app-actions"
import { AppAlerts } from "./installed/app-alerts"
import { AppConsole } from "./installed/app-console"
import { AppStats } from "./installed/app-stats"
import { BoostCard } from "./installed/boost-card"
import { CustomDomains } from "./installed/custom-domains"
import { CustomFields } from "./installed/custom-fields"
import { CustomTables } from "./installed/custom-tables"
import { PortAssignments } from "./installed/port-assignments"
import { InstanceStatusBadge } from "./instance-controls"
import { useKumoRoutes } from "./kumo-routes"
import { Panel } from "./panel"
import { EMPTY_IN_CARD, type Loadable } from "./shared"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  open: "Open app",
  pin: "Pin to the top",
  unpin: "Unpin",
  onAppbox: "on",
  details: "Details",
  appSlots: "App slots",
  documentation: "Documentation",
  upgrade: "Upgrade plan"
} as const

const TRANSITIONAL_STATUSES = new Set([
  "installing",
  "updating",
  "deleting",
  "migrating"
])
// Only force the "Not enough data" graph overlay when the container doesn't
// exist yet. Updating/deleting containers have live history worth showing.
const NO_STATS_STATUSES = new Set(["installing"])

export interface InstalledAppViewProps {
  app: Loadable<InstalledApp>
  /** The Appbox the app is on, once loaded. */
  cylo?: CyloDetail
  /** The catalogue's versions of this app, used when the install lists none of its own. */
  catalogueVersions?: AppVersion[]
  /** The job running on the app right now, if any. */
  job?: JobProgressData
  pinned: boolean
  pinPending: boolean
  onTogglePin: () => void
  /** Fetches the real value of a sensitive custom field. Resolves undefined on failure. */
  onRevealField: (fieldId: number) => Promise<string | undefined>
}

function DetailRow({
  label,
  children
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-kumo-subtle">{label}</dt>
      <dd className="min-w-0 truncate text-end font-medium">{children}</dd>
    </div>
  )
}

function ViewSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-8">
      <div className="flex items-start gap-4">
        <SkeletonLine className="size-14 rounded-xl" />
        <div className="grid flex-1 gap-3 pt-1">
          <SkeletonLine className="h-4 w-48 rounded-full" />
          <SkeletonLine className="h-2.5 w-72 max-w-full rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-6">
          <SkeletonLine className="h-28 rounded-lg" />
          <SkeletonLine className="h-64 rounded-lg" />
        </div>
        <SkeletonLine className="h-56 rounded-lg" />
      </div>
    </div>
  )
}

/**
 * One installed app: what state it is in, what can be done to it, and the
 * details needed to use it. Laid out like Cloudflare's Worker page: tabs and
 * the main actions in a band under the top bar, then cards in a main column
 * with a details column beside it.
 */
export function InstalledAppView({
  app: appState,
  cylo,
  catalogueVersions,
  job,
  pinned,
  pinPending,
  onTogglePin,
  onRevealField
}: InstalledAppViewProps) {
  const t = useTranslations("appboxmanager.appDetail")
  const locale = useLocale()
  const routes = useKumoRoutes()
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  if (appState.status === "loading") return <ViewSkeleton />

  if (appState.status === "error") {
    return (
      <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
        <Empty
          className={EMPTY_IN_CARD}
          icon={<PackageIcon size={40} />}
          title={t("notFound")}
          description={t("notFoundDescription")}
          contents={
            <LinkButton href={routes.installedApps} variant="secondary">
              {t("backToInstalledApps")}
            </LinkButton>
          }
        />
      </div>
    )
  }

  const app = appState.data

  /* ── Derived state, unchanged from the current design ── */
  const availableVersions =
    app.available_versions && app.available_versions.length > 0
      ? app.available_versions
      : (catalogueVersions ?? [])
          .map((v) => ({
            id: v.id,
            version: v.version,
            created_at: v.created_at
          }))
          .filter((v) => v.id > 0 && v.version.length > 0)
  const effectiveStatus = cylo?.is_migrating ? "migrating" : app.status
  const isAppOperational = app.enabled && app.state === 1
  const isStartRecoverable =
    cylo?.status !== "suspended" &&
    !TRANSITIONAL_STATUSES.has(effectiveStatus) &&
    app.state === 0 &&
    !app.enabled
  const actionsAvailable =
    cylo?.status !== "suspended" &&
    !TRANSITIONAL_STATUSES.has(effectiveStatus) &&
    effectiveStatus !== "offline" &&
    isAppOperational
  const appForActions = {
    ...app,
    status: effectiveStatus,
    available_versions: availableVersions
  }
  const upgradeUrl = cylo?.whmcs_serviceid
    ? `https://billing.appbox.co/upgrade.php?type=package&id=${cylo.whmcs_serviceid}`
    : null
  const isVmApp = app.app_type === "vm"
  const isVmFeatureEnabled = isLaunchWeekEnabled("day_3", isAdmin)
  const showConsole = isVmApp && isVmFeatureEnabled
  const customDescription =
    (
      app.custom_field_postinstall_description ?? app.custom_description
    )?.trim() ?? ""

  const tabs = [
    { value: "overview", label: t("tabOverview") },
    { value: "ports", label: t("tabPorts") },
    ...(showConsole ? [{ value: "console", label: t("tabConsole") }] : [])
  ]
  const tab = tabs.some((entry) => entry.value === activeTab)
    ? activeTab
    : "overview"
  const pinLabel = pinned ? COPY.unpin : COPY.pin

  return (
    <div className="grid grid-cols-1 gap-6">
      <ShellBar>
        <Tabs
          variant="segmented"
          tabs={tabs}
          value={tab}
          onValueChange={setActiveTab}
        />
        <div className="flex items-center gap-2">
          <Tooltip
            content={pinLabel}
            render={
              <Button
                shape="square"
                aria-label={`${pinLabel}: ${app.display_name}`}
                aria-pressed={pinned}
                loading={pinPending}
                icon={
                  <StarIcon
                    weight={pinned ? "fill" : "regular"}
                    className={pinned ? "text-kumo-warning" : undefined}
                  />
                }
                onClick={onTogglePin}
              />
            }
          />
          {app.domain && (
            <LinkButton
              href={`https://${app.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              icon={ArrowSquareOutIcon}
            >
              {COPY.open}
            </LinkButton>
          )}
        </div>
      </ShellBar>

      <header className="flex items-start gap-4">
        <AppIcon
          icon={app.icon_image}
          name={app.display_name}
          className="size-14 rounded-xl text-lg"
        />
        <div className="grid min-w-0 gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="min-w-0 text-2xl font-semibold break-words">
              {app.display_name}
            </h1>
            <InstanceStatusBadge status={effectiveStatus} />
          </div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-kumo-subtle">
            {app.domain && (
              <>
                <a
                  href={`https://${app.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-w-full truncate font-mono text-[0.9em] text-kumo-subtle no-underline hover:text-kumo-default hover:underline"
                >
                  {app.domain}
                </a>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>
              {COPY.onAppbox}{" "}
              <Link
                href={routes.appbox(app.cylo_id)}
                className="font-medium text-kumo-default no-underline hover:underline"
              >
                {app.cylo_name}
              </Link>
            </span>
          </p>
        </div>
      </header>

      {/* Suspended Appbox, migration, low space, or a job in progress. */}
      <AppAlerts app={app} cylo={cylo} job={job} showPayloadMessage={false} />

      {tab === "overview" && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid min-w-0 grid-cols-1 gap-6">
            <Panel
              title={t("actions")}
              action={
                upgradeUrl &&
                (actionsAvailable || isStartRecoverable) && (
                  <KumoLink
                    href={upgradeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {COPY.upgrade}
                    <KumoLink.ExternalIcon />
                  </KumoLink>
                )
              }
            >
              {actionsAvailable || isStartRecoverable ? (
                <AppActions
                  app={appForActions}
                  startOnlyActionable={isStartRecoverable}
                />
              ) : (
                <p
                  role={app.vm_control_pending ? "status" : undefined}
                  className="text-kumo-subtle"
                >
                  {t(
                    app.vm_control_pending
                      ? "vmControlPending"
                      : "actionsUnavailable"
                  )}
                </p>
              )}
            </Panel>

            {customDescription && (
              <div className="grid gap-1 rounded-lg bg-kumo-tint px-4 py-3">
                <p className="font-medium">{t("appNote")}</p>
                <p className="break-words whitespace-pre-line text-kumo-subtle">
                  {customDescription}
                </p>
              </div>
            )}

            {/* Hidden while the app is in transition: its values are not filled in yet. */}
            {!TRANSITIONAL_STATUSES.has(effectiveStatus) && (
              <CustomFields
                fields={app.custom_fields}
                onReveal={onRevealField}
              />
            )}

            {app.state === 1 && app.enabled && <CustomTables appId={app.id} />}

            {/* Charts are for container apps only. */}
            {!isVmApp && (
              <AppStats
                app={app}
                transitional={NO_STATS_STATUSES.has(effectiveStatus)}
              />
            )}

            {isLaunchWeekEnabled("day_4", isAdmin) &&
              app.multiple_domains === 1 && (
                <CustomDomains
                  appId={app.id}
                  cyloId={app.cylo_id}
                  appState={app.state}
                  appEnabled={app.enabled}
                />
              )}
          </div>

          <aside className="grid grid-cols-1 gap-4 lg:sticky lg:top-0">
            <Panel title={COPY.details}>
              <dl className="-my-2 divide-y divide-kumo-hairline">
                <DetailRow label={t("version")}>
                  <Link
                    href={routes.appStoreApp(app.app_id)}
                    className="font-mono text-[0.9em] text-kumo-link"
                  >
                    {app.version || "—"}
                  </Link>
                </DetailRow>
                <DetailRow label={t("installDate")}>
                  <time dateTime={app.install_date} suppressHydrationWarning>
                    {new Date(app.install_date).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </time>
                </DetailRow>
                <DetailRow label={t("cylo")}>
                  <Link
                    href={routes.appbox(app.cylo_id)}
                    className="text-kumo-link"
                  >
                    {app.cylo_name}
                  </Link>
                </DetailRow>
                <DetailRow label={t("server")}>
                  <span className="font-mono text-[0.9em]">
                    {app.server_name}
                  </span>
                </DetailRow>
                <DetailRow label={COPY.appSlots}>{app.app_slots}</DetailRow>
                {app.documentation_url && (
                  <DetailRow label={COPY.documentation}>
                    <KumoLink
                      href={app.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {new URL(app.documentation_url).hostname.replace(
                        /^www\./,
                        ""
                      )}
                      <KumoLink.ExternalIcon />
                    </KumoLink>
                  </DetailRow>
                )}
              </dl>
            </Panel>

            {isLaunchWeekEnabled("day_2", isAdmin) &&
              app.use_boost_system === 1 && (
                <BoostCard
                  app={app}
                  whmcsServiceId={cylo?.whmcs_serviceid}
                  disabled={
                    !app.enabled ||
                    app.state !== 1 ||
                    cylo?.status === "suspended" ||
                    TRANSITIONAL_STATUSES.has(effectiveStatus) ||
                    effectiveStatus === "offline"
                  }
                />
              )}
          </aside>
        </div>
      )}

      {tab === "ports" && (
        <PortAssignments serverName={app.server_name} instanceId={app.id} />
      )}

      {tab === "console" && showConsole && (
        <AppConsole
          instanceId={app.id}
          serverName={app.server_name}
          appState={app.state}
          appEnabled={app.enabled}
        />
      )}
    </div>
  )
}
