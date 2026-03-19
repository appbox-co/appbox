"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  Rocket,
  Server
} from "lucide-react"
import type { CyloSummary } from "@/api/cylos/cylos"
import {
  useCyloBandwidth,
  useCyloDiskQuota,
  useCyloStats
} from "@/api/cylos/hooks/use-cylos"
import { useInstalledApps } from "@/api/installed-apps/hooks/use-installed-apps"
import { usePinnedApps } from "@/api/pinned-apps/hooks/use-pinned-apps"
import { AppIconStrip } from "@/components/dashboard/app-icon-strip"
import { SingleSparkline, Sparkline } from "@/components/dashboard/sparkline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/constants/routes"
import { cn, formatBytes, formatStorageGB } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "online":
      return "bg-emerald-500/15 text-emerald-600 border-emerald-500/25 dark:text-emerald-400"
    case "migrating":
      return "bg-amber-500/15 text-amber-600 border-amber-500/25 dark:text-amber-400"
    case "restarting":
      return "bg-sky-500/15 text-sky-600 border-sky-500/25 dark:text-sky-400"
    case "installing":
      return "bg-violet-500/15 text-violet-600 border-violet-500/25 dark:text-violet-400"
    case "suspended":
      return "bg-rose-500/15 text-rose-700 border-rose-500/25 dark:text-rose-400"
    case "offline":
      return "bg-red-500/15 text-red-600 border-red-500/25 dark:text-red-400"
    default:
      return "bg-zinc-500/15 text-zinc-600 border-zinc-500/25 dark:text-zinc-400"
  }
}

function storageBarColor(pct: number) {
  if (pct >= 90) return "bg-red-500"
  if (pct >= 75) return "bg-amber-500"
  return "bg-emerald-500"
}

/* -------------------------------------------------------------------------- */
/*  CyloCard                                                                   */
/* -------------------------------------------------------------------------- */

interface CyloCardProps {
  cylo: CyloSummary
  className?: string
  detailHref?: string
}

export function CyloCard({ cylo, className, detailHref }: CyloCardProps) {
  const t = useTranslations("appboxmanager")
  const tc = useTranslations("common")

  const { data: quota } = useCyloDiskQuota(cylo.id)
  const { data: bandwidth } = useCyloBandwidth(cylo.id)
  // No range arg → reads the range-agnostic "latest" key, populated by every
  // STATS_UPDATE push regardless of which range the server sent first.
  const { data: stats } = useCyloStats(cylo.id)
  const { data: pinnedApps } = usePinnedApps(cylo.id)
  const { data: installedApps } = useInstalledApps(cylo.id)
  const totalBoostSlots =
    installedApps?.reduce((sum, app) => sum + (app.boost_slots ?? 0), 0) ?? 0

  const statusLabel =
    {
      online: tc("status.online"),
      offline: tc("status.offline"),
      restarting: tc("status.restarting"),
      migrating: tc("status.migrating"),
      installing: tc("status.installing"),
      suspended: tc("status.suspended")
    }[cylo.status] ?? cylo.status

  /* ---- Storage ---- */
  const storageUsed = quota?.used_gb ?? cylo.storage_used
  const storageTotal = cylo.storage_total
  const storagePct =
    storageTotal > 0 ? Math.round((storageUsed / storageTotal) * 100) : 0

  /* ---- Bandwidth totals (labels under sparkline) ---- */
  const uploadUsed = bandwidth?.upload_bytes ?? cylo.upload_used
  const downloadUsed = bandwidth?.download_bytes ?? cylo.download_used

  /* ---- Sparkline series ---- */
  const uploadData = stats?.network_history?.map((d) => d.upload) ?? []
  const downloadData = stats?.network_history?.map((d) => d.download) ?? []
  const diskIoData = stats?.diskio_history?.map((d) => d.io_util) ?? []

  /* Disk I/O peak and current for the label strip */
  const diskPeak = diskIoData.length
    ? Math.round(Math.max(...diskIoData))
    : null
  const diskCurrent = diskIoData.length
    ? Math.round(diskIoData[diskIoData.length - 1])
    : null

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      {/* ------------------------------------------------------------------ */}
      {/*  Header                                                             */}
      {/* ------------------------------------------------------------------ */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">
              <Link
                href={detailHref ?? ROUTES.APPBOX_DETAIL(cylo.id)}
                className="hover:underline"
                data-anonymize-single
              >
                {cylo.name}
              </Link>
            </CardTitle>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Server className="size-3" />
              <span className="truncate">{cylo.server_name}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                getStatusBadgeClass(cylo.status),
                (cylo.status === "migrating" ||
                  cylo.status === "restarting" ||
                  cylo.status === "installing") &&
                  "animate-pulse"
              )}
            >
              {statusLabel}
            </Badge>
            {cylo.is_throttled && (
              <Badge
                variant="outline"
                className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/25 dark:text-amber-400"
              >
                Throttled
              </Badge>
            )}
            {cylo.is_low_quota && (
              <Badge
                variant="outline"
                className="text-[10px] bg-red-500/15 text-red-600 border-red-500/25 dark:text-red-400"
              >
                Low Quota
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* ------------------------------------------------------------------ */}
      {/*  Body                                                               */}
      {/* ------------------------------------------------------------------ */}
      <CardContent className="flex flex-1 flex-col gap-3">
        {/* ── Storage bar ────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-medium text-muted-foreground uppercase tracking-wide">
              Storage
            </span>
            <span className="tabular-nums text-muted-foreground">
              {formatStorageGB(storageUsed)}
              <span className="opacity-50">
                {" "}
                / {formatStorageGB(storageTotal)}
              </span>
            </span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                storageBarColor(storagePct)
              )}
              style={{ width: `${storagePct}%` }}
            />
          </div>
          <p className="text-right text-[10px] font-medium tabular-nums text-muted-foreground">
            {storagePct}%
          </p>
        </div>

        {/* ── Sparklines row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          {/* Network: upload (cyan) + download (pink) dual-line */}
          <div className="rounded-lg bg-muted/50 px-2.5 py-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Network
              </span>
              <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                30d
              </span>
            </div>

            <Sparkline
              data={uploadData}
              data2={downloadData}
              color="#06b6d4"
              color2="#ec4899"
              uid={`net-${cylo.id}`}
              className="h-10"
            />

            <div className="flex items-center gap-2 text-[10px] tabular-nums">
              <span className="flex items-center gap-0.5 min-w-0 text-cyan-500">
                <ArrowUpFromLine className="size-2.5 shrink-0" />
                <span className="truncate">{formatBytes(uploadUsed)}</span>
              </span>
              <span className="flex items-center gap-0.5 min-w-0 text-pink-500">
                <ArrowDownToLine className="size-2.5 shrink-0" />
                <span className="truncate">{formatBytes(downloadUsed)}</span>
              </span>
            </div>
          </div>

          {/* Disk I/O: io_util % (amber) */}
          <div className="rounded-lg bg-muted/50 px-2.5 py-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Disk I/O
              </span>
              <span className="text-[9px] text-muted-foreground/50">
                util %
              </span>
            </div>

            <SingleSparkline
              data={diskIoData}
              color="#f59e0b"
              uid={`disk-${cylo.id}`}
              className="h-10"
            />

            <div className="text-[10px] tabular-nums text-muted-foreground">
              {diskPeak !== null ? (
                <span>
                  peak&nbsp;
                  <span className="font-medium text-amber-500">
                    {diskPeak}%
                  </span>
                  <span className="mx-1 opacity-40">·</span>
                  now&nbsp;<span className="font-medium">{diskCurrent}%</span>
                </span>
              ) : (
                <span className="opacity-30">—</span>
              )}
            </div>
          </div>
        </div>

        {/* ── App Slots + Multiplier ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-[10px] font-medium text-muted-foreground">
              {t("cylos.appSlots")}
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums">
              {cylo.app_slots_used}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                / {cylo.app_slots_total}
              </span>
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-[10px] font-medium text-muted-foreground">
              {t("cylos.multiplier")}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-sm font-bold">
              <Rocket className="size-3.5 text-amber-500" />
              {totalBoostSlots}
            </p>
          </div>
        </div>

        {/* ── Footer: app icons + View Details ───────────────────────────── */}
        <div className="mt-auto flex items-center gap-2">
          <AppIconStrip
            pinnedApps={pinnedApps}
            installedApps={installedApps}
            iconSize="size-8"
            stopPropagation
          />

          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href={detailHref ?? ROUTES.APPBOX_DETAIL(cylo.id)}>
              {t("cylos.viewDetails")}
              <ExternalLink className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
