"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { Badge, Banner, Loader } from "@cloudflare/kumo"
import {
  ArrowsLeftRightIcon,
  ClockIcon,
  ProhibitIcon,
  WarningIcon
} from "@phosphor-icons/react"
import type { CyloDetail } from "@/api/cylos/cylos"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import type { JobProgressData } from "@/lib/websocket/types"
import { useRelativeTime } from "../ui/short-date"

/* -------------------------------------------------------------------------- */
/*  State logic, unchanged from the current design                             */
/* -------------------------------------------------------------------------- */

interface StateConfig {
  labelKey: string
  descriptionKey: string
}

/** The Appbox detail strings for each migration phase. Shared with `CyloAlerts`. */
export const MIGRATION_PHASE_KEYS: Record<number, string> = {
  1: "migrationPhase1",
  2: "migrationPhase2",
  3: "migrationPhase3",
  4: "migrationPhase4",
  5: "migrationPhase5",
  6: "migrationPhase6",
  7: "migrationPhase7",
  8: "migrationPhase8"
}

export function formatMigrationReason(reason?: string): string | null {
  const trimmed = reason?.trim()
  if (!trimmed) return null
  return trimmed
}

function formatJobStatus(status: string, app: InstalledApp) {
  return status.replace(/APP/g, app.display_name).replace(/SERVICE/g, "appbox")
}

function getTransitionalDescription(
  app: InstalledApp,
  job?: JobProgressData,
  showPayloadMessage = false,
  t?: (key: string, values?: Record<string, string>) => string
) {
  if (app.status !== "installing" && app.status !== "updating") return null

  const trimmedStatus = job?.status?.trim()

  if (!trimmedStatus) {
    if (showPayloadMessage) {
      return app.status === "installing"
        ? (t?.("sendingInstallPayload") ??
            "Sending install payload to your appbox...")
        : (t?.("sendingUpdatePayload") ??
            "Sending update payload to your appbox...")
    }
    return (
      t?.("configuringApp", { appName: app.display_name }) ??
      `Configuring ${app.display_name}...`
    )
  }

  return `${formatJobStatus(trimmedStatus, app)}...`
}

const STATE_CONFIG: Record<string, StateConfig> = {
  installing: {
    labelKey: "installing",
    descriptionKey: "appInstallingDescription"
  },
  updating: { labelKey: "updating", descriptionKey: "appUpdatingDescription" },
  deleting: { labelKey: "removing", descriptionKey: "appRemovingDescription" }
}

function formatGiB(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0.00"
  return (bytes / 1024 / 1024 / 1024).toFixed(2)
}

function shouldShowEta(iso?: string): boolean {
  if (!iso) return false
  const etaMs = Date.parse(iso)
  if (Number.isNaN(etaMs)) return false
  const diffMs = etaMs - Date.now()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  return diffMs >= 0 && diffMs <= thirtyDaysMs
}

/* -------------------------------------------------------------------------- */
/*  Pieces                                                                     */
/* -------------------------------------------------------------------------- */

/** Work in progress on the app: a spinner, what is happening, and the current step. */
function ProgressBanner({
  label,
  description
}: {
  label: string
  description: string
}) {
  return (
    <div role="status">
      <Banner
        icon={<Loader size="sm" />}
        title={label}
        description={description}
      />
    </div>
  )
}

interface MigrationNoticeProps {
  title: string
  description: string
  phase?: ReactNode
  progress?: number
  from?: string
  to?: string
  eta?: string
  live?: boolean
  transferredText?: string
  reason?: string
  liveMessage: string
  offlineMessage: string
  fallbackMessage: string
}

/** An Appbox being moved to another server, with its progress when known. */
export function MigrationNotice({
  title,
  description,
  phase,
  progress,
  from,
  to,
  eta,
  live,
  transferredText,
  reason,
  liveMessage,
  offlineMessage,
  fallbackMessage
}: MigrationNoticeProps) {
  const relativeTime = useRelativeTime()
  const hasProgress =
    typeof progress === "number" && typeof live === "boolean" && !!phase
  const pct = Math.max(0, Math.min(100, Math.round(progress ?? 0)))
  const phaseIsDuplicateDescription =
    typeof phase === "string" &&
    phase.trim().toLowerCase() === description.trim().toLowerCase()

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg bg-kumo-base px-4 py-3.5 shadow-xs ring ring-kumo-line"
    >
      <span className="flex h-lh shrink-0 items-center text-kumo-subtle">
        <ArrowsLeftRightIcon size={16} />
      </span>
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-3">
        <div className="grid gap-0.5">
          <p className="font-medium">{title}</p>
          <p className="text-kumo-subtle">{description}</p>
        </div>

        {hasProgress ? (
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {from && to && (
                <>
                  <span className="font-mono text-[0.9em]">{from}</span>
                  <ArrowsLeftRightIcon
                    aria-hidden="true"
                    size={14}
                    className="shrink-0 text-kumo-subtle"
                  />
                  <span className="font-mono text-[0.9em]">{to}</span>
                </>
              )}
              <Badge
                variant={live ? "success" : "neutral"}
                appearance="dot"
                className="ms-auto"
              >
                {live ? "live" : "offline"}
              </Badge>
            </div>

            {!phaseIsDuplicateDescription && (
              <div className="flex items-center gap-2 text-kumo-subtle">
                <Loader size="sm" />
                {phase}
              </div>
            )}

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-kumo-subtle">
                  {shouldShowEta(eta) && (
                    <>
                      <ClockIcon aria-hidden="true" size={14} />
                      ETA {relativeTime(eta!)}
                    </>
                  )}
                </span>
                <span className="font-medium tabular-nums">{pct}%</span>
              </div>
              <div
                role="meter"
                aria-label={title}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                className="h-1.5 overflow-hidden rounded-full bg-kumo-fill"
              >
                <div
                  className="h-full rounded-full bg-kumo-brand transition-[width] duration-700 motion-reduce:transition-none"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {transferredText && (
              <p className="font-mono text-[0.9em] text-kumo-subtle tabular-nums">
                {transferredText}
              </p>
            )}
            {reason && <p className="text-kumo-subtle">{reason}</p>}
            <p className="text-kumo-subtle">
              {live ? liveMessage : offlineMessage}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-kumo-subtle">
            <Loader size="sm" />
            {fallbackMessage}
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface AppAlertsProps {
  app: InstalledApp
  cylo?: CyloDetail
  job?: JobProgressData
  showPayloadMessage?: boolean
}

/**
 * What is going on with the app or its Appbox right now: suspended, being
 * migrated, short of space, or in the middle of an install, update or removal.
 * Same states and wording as the current design, as plain notices in place of
 * its animated scenes.
 */
export function AppAlerts({
  app,
  cylo,
  job,
  showPayloadMessage = false
}: AppAlertsProps) {
  const t = useTranslations("appboxmanager.appDetail")
  const cyloT = useTranslations("appboxmanager.cyloDetail")

  /* ── Appbox suspended (takes priority) ── */
  if (cylo?.status === "suspended") {
    return (
      <Banner
        variant="alert"
        icon={<ProhibitIcon weight="fill" />}
        title={cyloT("suspended")}
        description={cyloT("suspendedAppsMessage", { appboxName: cylo.name })}
      />
    )
  }

  if (cylo?.is_migrating) {
    const progress = cylo.migration_progress
    const totalBytes = Number(progress?.pre_migration_space_used ?? 0)
    const transferredBytes = Number(progress?.total_sent ?? 0)
    const transferPercent = Number(progress?.transferred_percent ?? 0)
    const transferComplete = progress?.phase === 5 && transferPercent >= 100
    const migrationStatusText = transferComplete
      ? cyloT("migrationPhase6")
      : progress
        ? cyloT(MIGRATION_PHASE_KEYS[progress.phase] ?? "migrationPhase5")
        : cyloT("migrationInProgress")

    return (
      <MigrationNotice
        title={cyloT("migrationProgress")}
        description={migrationStatusText}
        phase={progress ? migrationStatusText : undefined}
        progress={progress?.complete}
        from={progress?.old_server_name}
        to={progress?.new_server_name}
        eta={transferComplete ? undefined : (progress?.ETA ?? undefined)}
        live={progress ? progress.live_migration === 1 : undefined}
        transferredText={
          progress &&
          !transferComplete &&
          progress.phase === 5 &&
          totalBytes > 0
            ? cyloT("migrationTransferred", {
                sent: formatGiB(transferredBytes),
                total: formatGiB(totalBytes)
              })
            : undefined
        }
        reason={formatMigrationReason(progress?.reason) ?? undefined}
        liveMessage={cyloT("migrationLive")}
        offlineMessage={cyloT("migrationOffline")}
        fallbackMessage={cyloT("migrationInProgress")}
      />
    )
  }

  /* ── Low quota, shown above any job or state notice ── */
  const lowQuotaBanner = cylo?.is_low_quota ? (
    <Banner
      variant="error"
      icon={<WarningIcon weight="fill" />}
      title={cyloT("lowQuota")}
      description={
        cylo.low_quota_details ? (
          <>
            {cyloT("lowQuotaMessage", {
              available: (
                cylo.low_quota_details.available_kib /
                1024 /
                1024
              ).toFixed(2)
            })}{" "}
            {cyloT("lowQuotaHint")}
          </>
        ) : (
          cyloT("lowQuotaAppsStoppedMessage")
        )
      }
    />
  ) : null

  /* ── A live job takes priority over notices derived from the status ── */
  const config = STATE_CONFIG[app.status]
  let progressBanner: ReactNode = null

  if (job) {
    progressBanner = (
      <ProgressBanner
        label={config ? t(config.labelKey) : t("running")}
        description={
          getTransitionalDescription(app, job, showPayloadMessage, t) ??
          job.status ??
          t("jobRunningDescription", { appName: app.display_name })
        }
      />
    )
  } else if (config) {
    const version = app.available_versions?.[0]?.version ?? t("latestVersion")
    progressBanner = (
      <ProgressBanner
        label={t(config.labelKey)}
        description={
          getTransitionalDescription(app, undefined, showPayloadMessage, t) ??
          t(config.descriptionKey, { appName: app.display_name, version })
        }
      />
    )
  }

  if (!lowQuotaBanner && !progressBanner) return null

  return (
    <div className="grid grid-cols-1 gap-3">
      {lowQuotaBanner}
      {progressBanner}
    </div>
  )
}
