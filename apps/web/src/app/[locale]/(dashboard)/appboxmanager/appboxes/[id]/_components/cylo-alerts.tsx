"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  Ban,
  ExternalLink,
  FolderOpen,
  Gauge,
  Power,
  Zap
} from "lucide-react"
import type { CyloDetail } from "@/api/cylos/cylos"
import { JobProgress } from "@/app/[locale]/(dashboard)/appboxmanager/installedapps/[id]/_components/app-alerts"
import { MigrationAlert } from "@/components/dashboard/migration-alert"
import { Button } from "@/components/ui/button"

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const PHASE_KEYS: Record<number, string> = {
  1: "migrationPhase1",
  2: "migrationPhase2",
  3: "migrationPhase3",
  4: "migrationPhase4",
  5: "migrationPhase5",
  6: "migrationPhase6",
  7: "migrationPhase7",
  8: "migrationPhase8"
}

function formatMigrationReason(reason?: string): string | null {
  const trimmed = reason?.trim()
  if (!trimmed) return null
  return trimmed
}

function formatRelativeTime(iso: string): string {
  if (!iso) return ""
  const diff = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60_000)
  const hrs = Math.round(abs / 3_600_000)
  const days = Math.round(abs / 86_400_000)
  if (mins < 1) return "just now"
  if (mins < 60) return diff > 0 ? `in ${mins}m` : `${mins}m ago`
  if (hrs < 24) return diff > 0 ? `in ${hrs}h` : `${hrs}h ago`
  return diff > 0 ? `in ${days}d` : `${days}d ago`
}

/* -------------------------------------------------------------------------- */
/*  AlertBanner — single alert item                                           */
/* -------------------------------------------------------------------------- */

interface AlertBannerProps {
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>
  title: string
  description?: string
  /** Hex colour used for the border, icon, gradient, and title */
  color: string
  details?: ReactNode
  actions?: ReactNode
  scene?: ReactNode
}

function AlertBanner({
  icon: Icon,
  title,
  description,
  color,
  details,
  actions,
  scene
}: AlertBannerProps) {
  const hasScene = !!scene
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-card shadow-sm ${hasScene ? "min-h-[10rem] sm:min-h-[12rem] dark:bg-[#0B132B]" : ""}`}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      {scene}
      {/* Subtle colour wash behind content */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-64"
        style={{
          background: `linear-gradient(to right, ${color}12, transparent)`
        }}
      />

      <div className="relative p-4">
        <div className="flex items-start gap-3.5">
          {/* Icon badge */}
          <div
            className="mt-0.5 shrink-0 rounded-lg p-2"
            style={{ background: `${color}1a` }}
          >
            <Icon
              className="size-4.5"
              style={{ color } as React.CSSProperties}
            />
          </div>

          {/* Body */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <p
                className="text-sm font-semibold leading-tight"
                style={{ color }}
              >
                {title}
              </p>
              {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {actions}
                </div>
              )}
            </div>

            {description && (
              <p
                className={`mt-1.5 text-xs leading-relaxed ${hasScene ? "text-gray-700 dark:text-white/70" : "text-muted-foreground"}`}
              >
                {description}
              </p>
            )}

            {details && <div className="mt-3">{details}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Detail grids                                                               */
/* -------------------------------------------------------------------------- */

function DetailGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
      {items.map(({ label, value }) => (
        <div key={label}>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
            {label}
          </p>
          <p className="mt-0.5 text-xs font-semibold tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  CyloAlerts                                                                 */
/* -------------------------------------------------------------------------- */

interface CyloAlertsProps {
  cylo: CyloDetail
  onSwitchToFileExplorer?: () => void
}

/** Returns null when there are no alerts — takes up no space. */
export function CyloAlerts({ cylo, onSwitchToFileExplorer }: CyloAlertsProps) {
  const t = useTranslations("appboxmanager.cyloDetail")

  const hasAlerts =
    cylo.is_migrating ||
    cylo.is_low_quota ||
    cylo.is_throttled ||
    cylo.status === "suspended" ||
    (cylo.status === "offline" && !cylo.is_migrating)

  if (!hasAlerts) return null

  const billingUrl = cylo.whmcs_serviceid
    ? `https://billing.appbox.co/upgrade.php?type=package&id=${cylo.whmcs_serviceid}`
    : "https://billing.appbox.co"

  return (
    <div className="space-y-2.5">
      {/* ── Suspended ──────────────────────────────────────────────────── */}
      {cylo.status === "suspended" && (
        <AlertBanner
          icon={Ban}
          color="#f59e0b"
          title={t("suspended")}
          description={t("suspendedMessage")}
          actions={
            <Button size="sm" variant="outline" asChild>
              <a
                href={billingUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="gap-1.5"
              >
                {t("upgradePlan")} <ExternalLink className="size-3" />
              </a>
            </Button>
          }
        />
      )}

      {/* ── Offline ────────────────────────────────────────────────────── */}
      {cylo.status === "offline" && !cylo.is_migrating && (
        <AlertBanner
          icon={Power}
          color="#ef4444"
          title={t("offline")}
          description={t("offlineMessage")}
        />
      )}

      {/* ── Throttled ──────────────────────────────────────────────────── */}
      {cylo.is_throttled && (
        <AlertBanner
          icon={Gauge}
          color="#f59e0b"
          title={t("throttled")}
          description={
            cylo.throttle_details
              ? t("throttledMessage", {
                  percent: cylo.throttle_details.disk_util_percent
                })
              : "Disk throughput throttling is active."
          }
          actions={
            <Button size="sm" variant="outline" asChild>
              <a
                href={billingUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="gap-1.5"
              >
                {t("upgradePlan")} <ExternalLink className="size-3" />
              </a>
            </Button>
          }
          details={
            cylo.throttle_details ? (
              <div className="space-y-3">
                <DetailGrid
                  items={[
                    {
                      label: t("throttleLevel"),
                      value: String(cylo.throttle_details.throttle_level)
                    },
                    {
                      label: t("throttleRate"),
                      value: `${cylo.throttle_details.throttle_rate_mbps.toFixed(1)} Mbps`
                    },
                    {
                      label: t("throttleIops"),
                      value: String(cylo.throttle_details.throttle_iops)
                    },
                    {
                      label: t("throttleExpires"),
                      value: formatRelativeTime(
                        cylo.throttle_details.expires_at
                      )
                    },
                    ...(cylo.throttle_details.app_instance_domain
                      ? [
                          {
                            label: t("throttleTopApp"),
                            value: cylo.throttle_details.app_instance_domain
                          }
                        ]
                      : []),
                    ...(cylo.throttle_details.top_process_name
                      ? [
                          {
                            label: t("throttleTopProcess"),
                            value: cylo.throttle_details.top_process_name
                          }
                        ]
                      : [])
                  ]}
                />
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Zap className="size-3 text-amber-500" />
                  {t("throttledHint")}
                </p>
              </div>
            ) : null
          }
        />
      )}

      {/* ── Low Quota ──────────────────────────────────────────────────── */}
      {cylo.is_low_quota && (
        <AlertBanner
          icon={AlertTriangle}
          color="#ef4444"
          title={t("lowQuota")}
          description={
            cylo.low_quota_details
              ? cylo.is_migrating
                ? t("lowQuotaMigratingMessage", {
                    available: (
                      cylo.low_quota_details.available_kib /
                      1024 /
                      1024
                    ).toFixed(2)
                  })
                : t("lowQuotaMessage", {
                    available: (
                      cylo.low_quota_details.available_kib /
                      1024 /
                      1024
                    ).toFixed(2)
                  })
              : "Disk space is critically low."
          }
          actions={
            <>
              {onSwitchToFileExplorer && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onSwitchToFileExplorer}
                  className="gap-1.5"
                >
                  <FolderOpen className="size-3" />
                  {t("lowQuotaDeleteData")}
                </Button>
              )}
              <Button size="sm" variant="outline" asChild>
                <a
                  href={billingUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="gap-1.5"
                >
                  {t("upgradePlan")} <ExternalLink className="size-3" />
                </a>
              </Button>
            </>
          }
          details={
            cylo.low_quota_details ? (
              <p className="text-[11px] text-muted-foreground">
                {t("lowQuotaHint")}
              </p>
            ) : null
          }
        />
      )}

      {/* ── Migration ──────────────────────────────────────────────────── */}
      {cylo.is_migrating &&
        (() => {
          const progress = cylo.migration_progress
          const totalBytes = Number(progress?.pre_migration_space_used ?? 0)
          const transferredBytes = Number(progress?.total_sent ?? 0)
          const migrationStatusText = progress
            ? t(PHASE_KEYS[progress.phase] ?? "migrationPhase5")
            : "Migration is in progress…"

          return (
            <MigrationAlert
              title={t("migrationProgress")}
              description={migrationStatusText}
              phase={progress ? migrationStatusText : undefined}
              progress={progress?.complete}
              from={progress?.old_server_name}
              to={progress?.new_server_name}
              eta={progress?.phase === 5 ? (progress?.ETA ?? undefined) : undefined}
              live={progress ? progress.live_migration === 1 : undefined}
              transferredText={
                progress &&
                progress.phase === 5 &&
                totalBytes > 0
                  ? t("migrationTransferred", {
                      sent: (transferredBytes / 1024 / 1024 / 1024).toFixed(2),
                      total: (totalBytes / 1024 / 1024 / 1024).toFixed(2)
                    })
                  : undefined
              }
              reason={formatMigrationReason(progress?.reason) ?? undefined}
              liveMessage={t("migrationLive")}
              offlineMessage={t("migrationOffline")}
              fallbackMessage="Migration is in progress…"
              scene={<JobProgress job={undefined} color="#3b82f6" />}
            />
          )
        })()}
    </div>
  )
}
