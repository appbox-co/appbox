"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Tabs } from "@cloudflare/kumo"
import type { CyloDetail } from "@/api/cylos/cylos"
import { useCyloStats } from "@/api/cylos/hooks/use-cylos"
import { formatBytes } from "@/lib/utils"
import { useWebSocket } from "@/providers/websocket-provider"
import { Panel } from "../ui/panel"
import { STATS_COLORS, type StatsThreshold } from "../ui/stats-chart"
import { Metric, MetricGroup, type MetricState } from "../ui/stats-metric"

/**
 * Prototype-only copy, in English and sentence case. The series names are
 * hard-coded on the current page too; the chart titles are translated.
 */
const COPY = {
  title: "Usage over time",
  used: "Used",
  totalIo: "Total I/O",
  userIo: "User I/O",
  upload: "Upload",
  download: "Download"
} as const

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
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Disk usage, disk utilisation and network traffic of an Appbox over a chosen
 * range. Same data flow as the charts of the Appbox detail page: the numbers
 * are pushed over the WebSocket into the query cache, never fetched.
 *
 * This asks for the range it shows; connecting to the Appbox's server and
 * subscribing to its channel are left to the page around it.
 */
export function CyloCharts({ cylo }: { cylo: CyloDetail }) {
  const t = useTranslations("appboxmanager")
  const cyloId = cylo.id

  const [statsRange, setStatsRange] = useState("24h")
  const { data: stats } = useCyloStats(cyloId, statsRange)

  const { sendToServer } = useWebSocket()

  useEffect(() => {
    if (cylo.server_name) {
      sendToServer(
        { action: "stats_range", channel: `cylo:${cyloId}`, range: statsRange },
        cylo.server_name
      )
    }
  }, [statsRange, cyloId, cylo.server_name, sendToServer])

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
  /** Disk capacity line — constant horizontal at the Appbox's total */
  const diskTotal = diskData[0]?.total ?? null
  const capacityLine: StatsThreshold | undefined =
    diskTotal !== null
      ? { y: diskTotal, label: formatBytesAxis(diskTotal) }
      : undefined

  /** Peak dashed line on I/O chart so the spike stays visible on scroll */
  const ioPeakLine: StatsThreshold | undefined =
    ioTotalStats.peak !== null
      ? {
          y: ioTotalStats.peak,
          label: `${ioTotalStats.peak.toFixed(0)}%`,
          color: STATS_COLORS.primary
        }
      : undefined

  const xAxisFormatter = makeXAxisFormatter(statsRange)

  // The current page draws an empty chart once a range arrives with no
  // points; here that is the same "Not enough data" as on the app page.
  const stateOf = (data: unknown[]): MetricState =>
    !stats ? "loading" : data.length === 0 ? "empty" : "ready"

  return (
    <Panel
      title={COPY.title}
      flush
      action={
        <Tabs
          size="sm"
          tabs={TIME_RANGES}
          value={statsRange}
          onValueChange={setStatsRange}
        />
      }
    >
      <MetricGroup layout="row">
        {/* Disk Usage */}
        <Metric
          layout="row"
          title={t("cyloDetail.diskUsage")}
          variant="area"
          series={[
            {
              key: "used",
              label: COPY.used,
              color: STATS_COLORS.primary,
              current: diskStats.current,
              peak: diskStats.peak
            }
          ]}
          data={diskData}
          state={stateOf(diskData)}
          format={(v) => formatBytes(v, 2)}
          xAxisFormatter={xAxisFormatter}
          yAxisFormatter={formatBytesAxis}
          tooltipFormatter={formatBytesTooltip}
          tooltipLabelFormatter={formatTooltipLabel}
          yAxisWidth={64}
          threshold={capacityLine}
        />

        {/* Disk Utilization */}
        <Metric
          layout="row"
          title={t("cyloDetail.diskUtilization")}
          series={[
            {
              key: "user_util",
              label: COPY.userIo,
              color: STATS_COLORS.secondary,
              current: ioUserStats.current,
              peak: ioUserStats.peak,
              average: ioUserStats.avg
            },
            {
              key: "io_util",
              label: COPY.totalIo,
              color: STATS_COLORS.primary,
              current: ioTotalStats.current,
              peak: ioTotalStats.peak,
              average: ioTotalStats.avg
            }
          ]}
          reverseFigures
          data={diskioData}
          state={stateOf(diskioData)}
          format={(v) => `${v.toFixed(1)}%`}
          xAxisFormatter={xAxisFormatter}
          yAxisFormatter={formatPercent}
          tooltipFormatter={formatPercentTooltip}
          tooltipLabelFormatter={formatTooltipLabel}
          threshold={ioPeakLine}
        />

        {/* Network Traffic */}
        <Metric
          layout="row"
          title={t("cyloDetail.networkTraffic")}
          series={[
            {
              key: "download",
              label: COPY.download,
              color: STATS_COLORS.secondary,
              current: netDownStats.current,
              peak: netDownStats.peak,
              average: netDownStats.avg
            },
            {
              key: "upload",
              label: COPY.upload,
              color: STATS_COLORS.primary,
              current: netUpStats.current,
              peak: netUpStats.peak,
              average: netUpStats.avg
            }
          ]}
          reverseFigures
          data={networkData}
          state={stateOf(networkData)}
          format={formatMbpsTooltip}
          xAxisFormatter={xAxisFormatter}
          yAxisFormatter={formatMbps}
          tooltipFormatter={formatMbpsTooltip}
          tooltipLabelFormatter={formatTooltipLabel}
          yAxisWidth={88}
        />
      </MetricGroup>
    </Panel>
  )
}
