"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  HardDrive,
  Loader2,
  RotateCcw,
  Server
} from "lucide-react"
import {
  useCylo,
  useCyloStats,
  useRestartCylo
} from "@/api/cylos/hooks/use-cylos"
import { DashboardAreaChart } from "@/components/dashboard/charts/area-chart"
import { ChartWrapper } from "@/components/dashboard/charts/chart-wrapper"
import type { SeriesStat } from "@/components/dashboard/charts/chart-wrapper"
import { DashboardLineChart } from "@/components/dashboard/charts/line-chart"
import { StatusCell } from "@/components/dashboard/data-table/data-table-cells"
import { HistoryBackButton } from "@/components/dashboard/navigation/history-back-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ROUTES } from "@/constants/routes"
import { formatBytes } from "@/lib/utils"
import { useWebSocket } from "@/providers/websocket-provider"
import { CyloAlerts } from "./_components/cylo-alerts"
import { CyloDevPanel } from "./_components/cylo-dev-panel"
import { CyloStats } from "./_components/cylo-stats"
import { FileExplorer } from "./_components/file-explorer/file-explorer"
import { InstalledAppsQuickList } from "./_components/installed-apps-quick-list"

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 rounded bg-muted" />
      <div className="h-6 w-64 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-80 rounded-xl border bg-muted" />
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Stat helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Compute peak / current / avg for a numeric key across a data array. */
function computeStats(
  data: Array<Record<string, number | string>>,
  key: string
): { peak: number | null; current: number | null; avg: number | null } {
  const vals = data.map((d) => Number(d[key])).filter((v) => isFinite(v))
  if (!vals.length) return { peak: null, current: null, avg: null }
  return {
    peak: Math.max(...vals),
    current: vals[vals.length - 1],
    avg: vals.reduce((a, b) => a + b, 0) / vals.length
  }
}

/* -------------------------------------------------------------------------- */
/*  Chart formatters                                                           */
/* -------------------------------------------------------------------------- */

const TIME_RANGES = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" }
]

function makeXAxisFormatter(range: string) {
  return (value: unknown): string => {
    const date = new Date(value as string)
    if (isNaN(date.getTime())) return ""
    if (range === "24h") {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
      })
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
}

function formatTooltipLabel(value: unknown): string {
  const date = new Date(value as string)
  if (isNaN(date.getTime())) return String(value)
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function formatBytesAxis(value: unknown): string {
  return formatBytes(value as number, 1)
}
function formatBytesTooltip(value: unknown): string {
  return formatBytes(value as number, 2)
}

function formatMbps(value: unknown): string {
  const v = Number(value ?? 0)
  if (v >= 1000) return `${(v / 1000).toFixed(1)} Gbps`
  if (v >= 1) return `${v.toFixed(1)} Mbps`
  if (v >= 0.01) return `${(v * 1000).toFixed(0)} Kbps`
  if (v > 0) return `${(v * 1000).toFixed(1)} Kbps`
  return "0"
}
function formatMbpsTooltip(value: unknown): string {
  const v = Number(value ?? 0)
  if (v >= 1000) return `${(v / 1000).toFixed(2)} Gbps`
  if (v >= 1) return `${v.toFixed(2)} Mbps`
  if (v > 0) return `${(v * 1000).toFixed(2)} Kbps`
  return "0 Kbps"
}

function formatPercent(value: unknown): string {
  return `${Number(value ?? 0).toFixed(0)}%`
}
function formatPercentTooltip(value: unknown): string {
  return `${Number(value ?? 0).toFixed(2)}%`
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

interface CyloDetailPageProps {
  params: Promise<{ id: string; locale: string }>
}

export default function CyloDetailPage({ params }: CyloDetailPageProps) {
  const { id } = use(params)
  const cyloId = Number(id)
  const t = useTranslations("appboxmanager")

  const [statsRange, setStatsRange] = useState("24h")
  const [activeTab, setActiveTab] = useState("summary")
  const [restartOpen, setRestartOpen] = useState(false)

  const restartMutation = useRestartCylo()

  const { data: cylo, isLoading, error } = useCylo(cyloId)
  const { data: stats } = useCyloStats(cyloId, statsRange)

  /* ---- WebSocket ---- */
  const {
    connectToServer,
    disconnectFromServer,
    subscribe,
    unsubscribe,
    sendToServer
  } = useWebSocket()

  useEffect(() => {
    if (cylo?.server_name) {
      connectToServer(cylo.server_name)
      subscribe(`cylo:${cyloId}`)
    }
    return () => {
      unsubscribe(`cylo:${cyloId}`)
      disconnectFromServer(cylo?.server_name)
    }
  }, [
    cylo?.server_name,
    cyloId,
    connectToServer,
    disconnectFromServer,
    subscribe,
    unsubscribe
  ])

  useEffect(() => {
    if (cylo?.server_name) {
      sendToServer(
        { action: "stats_range", channel: `cylo:${cyloId}`, range: statsRange },
        cylo.server_name
      )
    }
  }, [statsRange, cyloId, cylo?.server_name, sendToServer])

  /* ---- Data arrays ---- */
  const diskData = useMemo(
    () =>
      (stats?.disk_history ?? []).map((d) => ({
        timestamp: d.timestamp,
        used: d.used,
        total: d.total
      })),
    [stats]
  )
  const diskioData = useMemo(
    () =>
      (stats?.diskio_history ?? []).map((d) => ({
        timestamp: d.timestamp,
        user_util: d.user_util,
        io_util: d.io_util
      })),
    [stats]
  )
  const networkData = useMemo(
    () =>
      (stats?.network_history ?? []).map((d) => ({
        timestamp: d.timestamp,
        upload: d.upload,
        download: d.download
      })),
    [stats]
  )

  /* ---- Series stats ---- */
  const diskStats = useMemo(() => computeStats(diskData, "used"), [diskData])
  const ioTotalStats = useMemo(
    () => computeStats(diskioData, "io_util"),
    [diskioData]
  )
  const ioUserStats = useMemo(
    () => computeStats(diskioData, "user_util"),
    [diskioData]
  )
  const netUpStats = useMemo(
    () => computeStats(networkData, "upload"),
    [networkData]
  )
  const netDownStats = useMemo(
    () => computeStats(networkData, "download"),
    [networkData]
  )

  /* ---- Reference lines ---- */
  /** Disk capacity line — constant horizontal at total GB */
  const diskTotal = diskData[0]?.total ?? null

  /** Peak dashed line on I/O chart so the spike stays visible on scroll */
  const ioRefLines = useMemo(() => {
    if (ioTotalStats.peak === null) return []
    return [
      {
        y: ioTotalStats.peak,
        label: `${ioTotalStats.peak.toFixed(0)}%`,
        color: "#00f1a1",
        dashed: true
      }
    ]
  }, [ioTotalStats.peak])

  /* ---- SeriesStat definitions ---- */
  /* eslint-disable react-hooks/preserve-manual-memoization -- stats from useMemo; compiler infers .current */
  const diskSeriesStats: SeriesStat[] = useMemo(
    () => [
      {
        label: "Used",
        color: "#49CCF9",
        icon: <HardDrive className="size-3 opacity-80" />,
        peak: diskStats.peak,
        current: diskStats.current,
        formatter: (v) => formatBytes(v, 2)
      }
    ],
    [diskStats]
  )

  const ioSeriesStats: SeriesStat[] = useMemo(
    () => [
      {
        label: "Total I/O",
        color: "#00f1a1",
        icon: <HardDrive className="size-3 opacity-80" />,
        peak: ioTotalStats.peak,
        current: ioTotalStats.current,
        avg: ioTotalStats.avg,
        formatter: (v) => `${v.toFixed(1)}%`
      },
      {
        label: "User I/O",
        color: "#818cf8",
        icon: <Activity className="size-3 opacity-80" />,
        peak: ioUserStats.peak,
        current: ioUserStats.current,
        avg: ioUserStats.avg,
        formatter: (v) => `${v.toFixed(1)}%`
      }
    ],
    [ioTotalStats, ioUserStats]
  )

  const netSeriesStats: SeriesStat[] = useMemo(
    () => [
      {
        label: "Upload",
        color: "#FFC800",
        icon: <ArrowUpFromLine className="size-3 opacity-80" />,
        peak: netUpStats.peak,
        current: netUpStats.current,
        avg: netUpStats.avg,
        formatter: formatMbpsTooltip
      },
      {
        label: "Download",
        color: "#FD71AF",
        icon: <ArrowDownToLine className="size-3 opacity-80" />,
        peak: netDownStats.peak,
        current: netDownStats.current,
        avg: netDownStats.avg,
        formatter: formatMbpsTooltip
      }
    ],
    [netUpStats, netDownStats]
  )
  /* eslint-enable react-hooks/preserve-manual-memoization */

  /* ---- Early returns ---- */
  if (isLoading) return <DetailSkeleton />
  if (error || !cylo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Server className="size-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold">
          {t("cyloDetail.notFound")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("cyloDetail.notFoundDescription")}
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={ROUTES.APPBOXES}>
            <ArrowLeft className="mr-2 size-4" />
            {t("cyloDetail.backToAppboxes")}
          </Link>
        </Button>
      </div>
    )
  }

  const xAxisFormatter = makeXAxisFormatter(statsRange)

  return (
    <div className="space-y-6">
      {/* Back */}
      <HistoryBackButton
        fallbackHref={ROUTES.APPBOXES}
        fallbackLabel={t("cyloDetail.backToAppboxes")}
        currentLabel={cylo.name}
        anonymizeLabelSingleWord
      />

      {/* Title + status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1
            data-anonymize-single
            className="text-2xl font-bold tracking-tight"
          >
            {cylo.name}
          </h1>
          <StatusCell status={cylo.status} className="text-xs" />
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Server className="size-3.5" />
            {cylo.server_name}
          </span>
          {cylo.server_host ? (
            <span className="text-sm text-muted-foreground">
              • <span className="font-mono">{cylo.server_host}</span>
            </span>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={
            cylo.status === "restarting" ||
            cylo.status === "migrating" ||
            cylo.status === "installing" ||
            restartMutation.isPending
          }
          onClick={() => setRestartOpen(true)}
        >
          {restartMutation.isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-1.5 size-4" />
          )}
          {t("cyloDetail.restart")}
        </Button>
      </div>

      {/* Restart confirmation dialog */}
      <Dialog open={restartOpen} onOpenChange={setRestartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cyloDetail.restartTitle")}</DialogTitle>
            <DialogDescription>
              {t("cyloDetail.restartDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestartOpen(false)}
              disabled={restartMutation.isPending}
            >
              {t("cyloDetail.cancel")}
            </Button>
            <Button
              onClick={() => {
                restartMutation.mutate(cyloId, {
                  onSuccess: () => setRestartOpen(false)
                })
              }}
              disabled={restartMutation.isPending}
            >
              {restartMutation.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {t("cyloDetail.restart")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="summary">{t("cyloDetail.summary")}</TabsTrigger>
          <TabsTrigger value="file-explorer">
            {t("cyloDetail.fileExplorer")}
          </TabsTrigger>
        </TabsList>

        {/* ── Summary tab ──────────────────────────────────────────────── */}
        <TabsContent value="summary" className="mt-6 space-y-6">
          {/* Alerts — only rendered when alerts are present */}
          <CyloAlerts
            cylo={cylo}
            onSwitchToFileExplorer={() => setActiveTab("file-explorer")}
          />

          <CyloStats cylo={cylo} />

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Disk Usage */}
            <ChartWrapper
              title={t("cyloDetail.diskUsage")}
              timeRanges={TIME_RANGES}
              selectedRange={statsRange}
              onRangeChange={setStatsRange}
              isLoading={!stats}
              seriesStats={diskSeriesStats}
            >
              <DashboardAreaChart
                data={diskData}
                xKey="timestamp"
                yKeys={[{ key: "used", color: "#49CCF9", label: "Used" }]}
                height={210}
                xAxisFormatter={xAxisFormatter}
                yAxisFormatter={formatBytesAxis}
                tooltipFormatter={formatBytesTooltip}
                tooltipLabelFormatter={formatTooltipLabel}
                referenceLines={
                  diskTotal !== null
                    ? [
                        {
                          y: diskTotal,
                          label: formatBytesAxis(diskTotal),
                          color: "#6b7280",
                          dashed: true
                        }
                      ]
                    : undefined
                }
              />
            </ChartWrapper>

            {/* Disk Utilization */}
            <ChartWrapper
              title={t("cyloDetail.diskUtilization")}
              timeRanges={TIME_RANGES}
              selectedRange={statsRange}
              onRangeChange={setStatsRange}
              isLoading={!stats}
              seriesStats={ioSeriesStats}
            >
              <DashboardLineChart
                data={diskioData}
                xKey="timestamp"
                lines={[
                  { key: "user_util", color: "#818cf8", label: "User I/O" },
                  { key: "io_util", color: "#00f1a1", label: "Total I/O" }
                ]}
                height={210}
                xAxisFormatter={xAxisFormatter}
                yAxisFormatter={formatPercent}
                tooltipFormatter={formatPercentTooltip}
                tooltipLabelFormatter={formatTooltipLabel}
                referenceLines={ioRefLines}
              />
            </ChartWrapper>

            {/* Network Traffic */}
            <ChartWrapper
              title={t("cyloDetail.networkTraffic")}
              timeRanges={TIME_RANGES}
              selectedRange={statsRange}
              onRangeChange={setStatsRange}
              isLoading={!stats}
              seriesStats={netSeriesStats}
            >
              <DashboardLineChart
                data={networkData}
                xKey="timestamp"
                lines={[
                  { key: "download", color: "#FD71AF", label: "Download" },
                  { key: "upload", color: "#FFC800", label: "Upload" }
                ]}
                height={210}
                xAxisFormatter={xAxisFormatter}
                yAxisFormatter={formatMbps}
                tooltipFormatter={formatMbpsTooltip}
                tooltipLabelFormatter={formatTooltipLabel}
              />
            </ChartWrapper>
          </div>

          <InstalledAppsQuickList cyloId={cyloId} />
        </TabsContent>

        {/* ── File Explorer tab ─────────────────────────────────────────── */}
        <TabsContent value="file-explorer" className="mt-6">
          <FileExplorer cyloId={cyloId} serverName={cylo?.server_name} />
        </TabsContent>
      </Tabs>

      <CyloDevPanel cyloId={cyloId} />
    </div>
  )
}
