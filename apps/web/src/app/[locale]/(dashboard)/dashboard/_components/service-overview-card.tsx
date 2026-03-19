"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  Layers,
  Rocket,
  Server
} from "lucide-react"
import type { CyloSummary } from "@/api/cylos/cylos"
import { useCyloBandwidth, useCyloDiskQuota } from "@/api/cylos/hooks/use-cylos"
import { useInstalledApps } from "@/api/installed-apps/hooks/use-installed-apps"
import { usePinnedApps } from "@/api/pinned-apps/hooks/use-pinned-apps"
import { AppIconStrip } from "@/components/dashboard/app-icon-strip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { ROUTES } from "@/constants/routes"
import { cn, formatBytes, formatStorageGB } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getStorageBarColor(percent: number) {
  if (percent >= 90) return "bg-red-500"
  if (percent >= 75) return "bg-amber-500"
  return "bg-emerald-500"
}

function getStorageTextColor(percent: number) {
  if (percent >= 90) return "text-red-500"
  if (percent >= 75) return "text-amber-500"
  return "text-emerald-500"
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface ServiceOverviewCardProps {
  cylo: CyloSummary
  className?: string
  hideCyloDefaultApps?: boolean
}

export function ServiceOverviewCard({
  cylo,
  className,
  hideCyloDefaultApps = false
}: ServiceOverviewCardProps) {
  const t = useTranslations("dashboard")
  const { data: quota } = useCyloDiskQuota(cylo.id)
  const { data: bandwidth } = useCyloBandwidth(cylo.id)
  const { data: pinnedApps } = usePinnedApps(cylo.id)
  const { data: installedApps } = useInstalledApps(cylo.id)
  const visibleInstalledApps = (installedApps ?? []).filter(
    (app) => !(hideCyloDefaultApps && app.cylo_default === 1)
  )
  const visibleInstalledAppIds = new Set(
    visibleInstalledApps.map((app) => app.id)
  )
  const visiblePinnedApps = (pinnedApps ?? []).filter((pinnedApp) =>
    visibleInstalledAppIds.has(pinnedApp.app_instance_id)
  )
  const totalBoostSlots =
    visibleInstalledApps.reduce(
      (sum, app) => sum + (app.boost_slots ?? 0),
      0
    ) ?? 0

  const storageUsed = quota?.used_gb ?? cylo.storage_used
  const storageTotal = cylo.storage_total
  const uploadUsed = bandwidth?.upload_bytes ?? cylo.upload_used
  const downloadUsed = bandwidth?.download_bytes ?? cylo.download_used

  const storagePercent =
    storageTotal > 0 ? Math.round((storageUsed / storageTotal) * 100) : 0

  const isOnline = cylo.status === "online"
  const isRestarting = cylo.status === "restarting"
  const isSuspended = cylo.status === "suspended"

  return (
    <Card className={cn("card-glow relative flex overflow-hidden", className)}>
      {/* ── Left: vertical storage strip ───────────────────────────────── */}
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-10 shrink-0 cursor-default flex-col items-center gap-1.5 border-r border-border/40 bg-muted/20 px-2 pb-3 pt-4">
              {/* Track */}
              <div className="relative min-h-0 w-3 flex-1 overflow-hidden rounded-full bg-muted/80">
                <div
                  className={cn(
                    "absolute bottom-0 w-full rounded-full transition-all duration-500",
                    getStorageBarColor(storagePercent)
                  )}
                  style={{ height: `${Math.min(storagePercent, 100)}%` }}
                />
              </div>
              {/* Percentage */}
              <span
                className={cn(
                  "shrink-0 text-[10px] font-bold tabular-nums",
                  getStorageTextColor(storagePercent)
                )}
              >
                {storagePercent}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs font-medium">{t("overview.storage")}</p>
            <p className="text-xs text-muted-foreground">
              {formatStorageGB(storageUsed)} / {formatStorageGB(storageTotal)}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* ── Right: main content ─────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 pb-2.5 pt-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "mt-px size-2 shrink-0 rounded-full",
                  isRestarting
                    ? "bg-sky-500 animate-pulse"
                    : isOnline
                      ? "bg-emerald-500"
                      : isSuspended
                        ? "bg-rose-500"
                        : "bg-red-500"
                )}
              />
              <Link
                href={ROUTES.APPBOX_DETAIL(cylo.id)}
                className="truncate font-semibold leading-tight hover:underline"
                data-anonymize-single
              >
                {cylo.name}
              </Link>
            </div>
            <p className="mt-0.5 flex items-center gap-1 pl-4 text-[11px] text-muted-foreground">
              <Server className="size-2.5" />
              {cylo.server_name}
            </p>
          </div>

          {/* Secondary state badges */}
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            {isSuspended && (
              <Badge className="h-4 border-rose-500/25 bg-rose-500/15 px-1 py-0 text-[9px] text-rose-700 dark:text-rose-400">
                {t("status.suspended")}
              </Badge>
            )}
            {isRestarting && (
              <Badge className="h-4 animate-pulse border-sky-500/25 bg-sky-500/15 px-1 py-0 text-[9px] text-sky-600 dark:text-sky-400">
                {t("status.restarting")}
              </Badge>
            )}
            {cylo.is_migrating && (
              <Badge className="h-4 animate-pulse border-amber-500/25 bg-amber-500/15 px-1 py-0 text-[9px] text-amber-600 dark:text-amber-400">
                {t("status.migrating")}
              </Badge>
            )}
            {cylo.is_throttled && (
              <Badge className="h-4 border-amber-500/25 bg-amber-500/15 px-1 py-0 text-[9px] text-amber-600 dark:text-amber-400">
                {t("status.throttled")}
              </Badge>
            )}
            {cylo.is_low_quota && (
              <Badge className="h-4 border-red-500/25 bg-red-500/15 px-1 py-0 text-[9px] text-red-600 dark:text-red-400">
                {t("status.lowQuota")}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats row — 4 equal columns */}
        <div className="grid grid-cols-4 gap-1.5 px-4 pb-3">
          <div className="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 py-2">
            <Layers className="size-3 text-emerald-500 dark:text-emerald-400" />
            <span className="text-[10px] text-muted-foreground">
              {t("overview.appSlots")}
            </span>
            <span className="text-[11px] font-bold tabular-nums leading-none">
              {cylo.app_slots_used}
              <span className="font-normal opacity-50">
                /{cylo.app_slots_total}
              </span>
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 py-2">
            <Rocket className="size-3 text-amber-500 dark:text-amber-400" />
            <span className="text-[10px] text-muted-foreground">
              {t("overview.multiplierShort")}
            </span>
            <span className="text-[11px] font-bold leading-none">
              {totalBoostSlots}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 py-2">
            <ArrowUpFromLine className="size-3 text-cyan-500 dark:text-cyan-400" />
            <span className="text-[10px] text-muted-foreground">
              {t("overview.uploadShort")}
            </span>
            <span className="text-[11px] font-bold tabular-nums leading-none">
              {formatBytes(uploadUsed)}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 py-2">
            <ArrowDownToLine className="size-3 text-pink-500 dark:text-pink-400" />
            <span className="text-[10px] text-muted-foreground">
              {t("overview.downloadShort")}
            </span>
            <span className="text-[11px] font-bold tabular-nums leading-none">
              {formatBytes(downloadUsed)}
            </span>
          </div>
        </div>

        {/* Footer: app icons (pinned first) + View Details */}
        <div className="mt-auto flex items-center gap-2 px-4 pb-4">
          <AppIconStrip
            pinnedApps={visiblePinnedApps}
            installedApps={visibleInstalledApps}
            iconSize="size-6"
          />

          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 gap-1 text-xs"
            asChild
          >
            <Link href={ROUTES.APPBOX_DETAIL(cylo.id)}>
              {t("overview.viewCylo")}
              <ExternalLink className="size-3" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}
