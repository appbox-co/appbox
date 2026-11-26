"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { Banner, Button, cn, LinkButton } from "@cloudflare/kumo"
import {
  FolderOpenIcon,
  GaugeIcon,
  LightningIcon,
  PowerIcon,
  ProhibitIcon,
  WarningIcon
} from "@phosphor-icons/react"
import type { CyloDetail } from "@/api/cylos/cylos"
import {
  formatMigrationReason,
  MIGRATION_PHASE_KEYS,
  MigrationNotice
} from "../installed/app-alerts"
import { BILLING_BASE_URL, upgradeUrl } from "../shared"
import { useRelativeTime } from "../ui/short-date"

/* -------------------------------------------------------------------------- */
/*  Pieces                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A notice with buttons or figures. Kumo's Banner keeps its action beside the
 * text at every width, which crushes the text on a phone, and it has no place
 * for figures; here the buttons wrap under the text when space runs out.
 */
function DetailedNotice({
  tone = "warning",
  icon,
  title,
  description,
  action,
  children
}: {
  tone?: "warning" | "danger"
  icon: ReactNode
  title: string
  description: ReactNode
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-lg px-4 py-3.5",
        tone === "danger" ? "bg-kumo-danger-tint" : "bg-kumo-warning-tint"
      )}
    >
      <span
        className={cn(
          "flex h-lh shrink-0 items-center",
          tone === "danger" ? "text-kumo-danger" : "text-kumo-warning"
        )}
      >
        {icon}
      </span>
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-3">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="grid min-w-48 flex-1 gap-0.5">
            <p className="font-medium">{title}</p>
            <p className="text-kumo-subtle">{description}</p>
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  )
}

function DetailGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
      {items.map(({ label, value }) => (
        <div key={label} className="grid min-w-0 gap-0.5">
          <dt className="text-sm text-kumo-subtle">{label}</dt>
          <dd className="truncate font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface CyloAlertsProps {
  cylo: CyloDetail
  onSwitchToFileExplorer?: () => void
}

/**
 * What is wrong with the Appbox right now, if anything: suspended, offline,
 * throttled, short of space, or being migrated. Same conditions and wording
 * as the current design. Renders nothing when there is nothing to say.
 */
export function CyloAlerts({ cylo, onSwitchToFileExplorer }: CyloAlertsProps) {
  const t = useTranslations("appboxmanager.cyloDetail")
  const relativeTime = useRelativeTime()

  const hasAlerts =
    cylo.is_migrating ||
    cylo.is_low_quota ||
    cylo.is_throttled ||
    cylo.status === "suspended" ||
    (cylo.status === "offline" && !cylo.is_migrating)

  if (!hasAlerts) return null

  const billingUrl = cylo.whmcs_serviceid
    ? upgradeUrl(cylo.whmcs_serviceid)
    : BILLING_BASE_URL

  const upgradeButton = (
    <LinkButton
      href={billingUrl}
      target="_blank"
      rel="noreferrer noopener"
      variant="secondary"
      size="sm"
    >
      {t("upgradePlan")}
    </LinkButton>
  )

  return (
    <div className="grid grid-cols-1 gap-3">
      {cylo.status === "suspended" && (
        <DetailedNotice
          icon={<ProhibitIcon weight="fill" size={16} />}
          title={t("suspended")}
          description={t("suspendedMessage")}
          action={upgradeButton}
        />
      )}

      {cylo.status === "offline" && !cylo.is_migrating && (
        <Banner
          variant="error"
          icon={<PowerIcon weight="bold" />}
          title={t("offline")}
          description={t("offlineMessage")}
        />
      )}

      {cylo.is_throttled && (
        <DetailedNotice
          icon={<GaugeIcon weight="fill" size={16} />}
          title={t("throttled")}
          description={
            cylo.throttle_details
              ? t("throttledMessage", {
                  percent: cylo.throttle_details.disk_util_percent
                })
              : t("throttledFallbackMessage")
          }
          action={upgradeButton}
        >
          {cylo.throttle_details && (
            <>
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
                    value: relativeTime(cylo.throttle_details.expires_at)
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
              <p className="flex items-start gap-1.5 text-kumo-subtle">
                <span className="flex h-lh shrink-0 items-center text-kumo-warning">
                  <LightningIcon weight="fill" size={14} />
                </span>
                {t("throttledHint")}
              </p>
            </>
          )}
        </DetailedNotice>
      )}

      {cylo.is_low_quota && (
        <DetailedNotice
          tone="danger"
          icon={<WarningIcon weight="fill" size={16} />}
          title={t("lowQuota")}
          description={
            cylo.low_quota_details ? (
              <>
                {cylo.is_migrating
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
                    })}{" "}
                {t("lowQuotaHint")}
              </>
            ) : (
              t("lowQuotaFallbackMessage")
            )
          }
          action={
            <span className="flex flex-wrap items-center gap-2">
              {onSwitchToFileExplorer && (
                <Button
                  variant="destructive"
                  size="sm"
                  icon={FolderOpenIcon}
                  onClick={onSwitchToFileExplorer}
                >
                  {t("lowQuotaDeleteData")}
                </Button>
              )}
              {upgradeButton}
            </span>
          }
        />
      )}

      {cylo.is_migrating &&
        (() => {
          const progress = cylo.migration_progress
          const totalBytes = Number(progress?.pre_migration_space_used ?? 0)
          const transferredBytes = Number(progress?.total_sent ?? 0)
          const migrationStatusText = progress
            ? t(MIGRATION_PHASE_KEYS[progress.phase] ?? "migrationPhase5")
            : t("migrationInProgress")

          return (
            <MigrationNotice
              title={t("migrationProgress")}
              description={migrationStatusText}
              phase={progress ? migrationStatusText : undefined}
              progress={progress?.complete}
              from={progress?.old_server_name}
              to={progress?.new_server_name}
              eta={
                progress?.phase === 5 ? (progress?.ETA ?? undefined) : undefined
              }
              live={progress ? progress.live_migration === 1 : undefined}
              transferredText={
                progress && progress.phase === 5 && totalBytes > 0
                  ? t("migrationTransferred", {
                      sent: (transferredBytes / 1024 / 1024 / 1024).toFixed(2),
                      total: (totalBytes / 1024 / 1024 / 1024).toFixed(2)
                    })
                  : undefined
              }
              reason={formatMigrationReason(progress?.reason) ?? undefined}
              liveMessage={t("migrationLive")}
              offlineMessage={t("migrationOffline")}
              fallbackMessage={t("migrationInProgress")}
            />
          )
        })()}
    </div>
  )
}
