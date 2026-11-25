"use client"

import { useEffect, useState } from "react"
import { Tabs } from "@cloudflare/kumo"
import type { ContainerRange } from "@/api/installed-apps/container-stats"
import { useContainerStats } from "@/api/installed-apps/hooks/use-container-stats"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { useWebSocket } from "@/providers/websocket-provider"
import { Panel } from "../panel"
import {
  STATS_COLORS,
  type StatsPoint,
  type StatsThreshold
} from "./stats-chart"
import { Metric, MetricGroup, type MetricState } from "./stats-metric"

/**
 * Prototype-only copy, in English and sentence case. The current page has
 * these strings hard-coded too; none of them has a translation key yet.
 */
const COPY = {
  title: "Performance",
  cpu: "CPU",
  ram: "RAM",
  disk: "Disk I/O",
  network: "Network",
  read: "Read",
  write: "Write",
  download: "Download",
  upload: "Upload"
} as const

const RANGES: ContainerRange[] = ["1h", "24h", "7d", "30d"]
const RANGE_TABS = RANGES.map((value) => ({ value, label: value }))

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type Point = StatsPoint

function getPeak(data: Point[], key: string): number | null {
  const vals = data.map((d) => Number(d[key] ?? 0)).filter((v) => isFinite(v))
  return vals.length > 0 ? Math.max(...vals) : null
}

function getCurrent(data: Point[], key: string): number | null {
  const last = data[data.length - 1]
  if (!last) return null
  const v = Number(last[key] ?? 0)
  return isFinite(v) ? v : null
}

function getAvg(data: Point[], key: string): number | null {
  if (data.length === 0) return null
  const vals = data.map((d) => Number(d[key] ?? 0)).filter((v) => isFinite(v))
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function fmtPercent(v: number) {
  return `${v.toFixed(1)}%`
}

function fmtMbps(v: number) {
  return `${v.toFixed(2)} Mbps`
}

function fmtMBs(v: number) {
  return `${v.toFixed(2)} MB/s`
}

function fmtTime(ts: string, range?: ContainerRange) {
  try {
    const d = new Date(ts)
    if (range === "7d" || range === "30d") {
      return d.toLocaleDateString([], { month: "short", day: "numeric" })
    }
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ts
  }
}

/** The figures quoted for one series of a chart. */
function figuresOf(data: Point[], key: string) {
  return {
    current: getCurrent(data, key),
    peak: getPeak(data, key),
    average: getAvg(data, key)
  }
}

/** How one kind of measurement is written: in full, and on the y axis. */
interface Unit {
  /** The whole value, as the current page writes it: "12.3%", "1.20 MB/s". */
  format: (v: number) => string
  axis: (v: unknown) => string
}

const PERCENT: Unit = {
  format: fmtPercent,
  axis: (v) => `${Number(v).toFixed(0)}%`
}

const MEGABYTES_PER_SECOND: Unit = {
  format: fmtMBs,
  axis: (v) => `${Number(v).toFixed(1)}`
}

const MEGABITS_PER_SECOND: Unit = {
  format: fmtMbps,
  axis: (v) => `${Number(v).toFixed(1)}`
}

const FULL_USE: StatsThreshold = { y: 100, label: "100%" }

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface AppStatsProps {
  app: InstalledApp
  transitional?: boolean
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * CPU, memory, disk and network history of a container app, over a chosen
 * range. Same data flow as `AppStats` in the installed app page: the numbers
 * are pushed over the WebSocket into the query cache, never fetched.
 */
export function AppStats({ app, transitional = false }: AppStatsProps) {
  const [range, setRange] = useState<ContainerRange>("24h")
  const { sendToServer } = useWebSocket()
  const { data: stats } = useContainerStats(app.id, range)

  // Request fresh data whenever range or app changes, and also when the app
  // finishes installing — at that point the container is live and we want
  // stats immediately rather than waiting for the next ws-gateway ticker.
  // Skip the request while installing since the container doesn't exist yet.
  useEffect(() => {
    if (!app.server_name || transitional) return

    const requestStats = () =>
      sendToServer(
        {
          action: "container_stats_range",
          channel: `instance:${app.id}`,
          range
        },
        app.server_name
      )

    // Fire immediately for fast paint when ws is already connected.
    requestStats()

    // If the initial request was sent before the server socket/channel became
    // ready, retry until this range has cached data.
    if (stats) return
    const retryTimer = window.setInterval(requestStats, 2000)

    return () => window.clearInterval(retryTimer)
  }, [range, app.id, app.server_name, transitional, sendToServer, stats])

  // Normalise into flat chart-friendly arrays
  const cpuData = (stats?.cpu_history ?? []).map((p) => ({
    timestamp: p.timestamp,
    value: p.value
  }))
  const memData = (stats?.mem_history ?? []).map((p) => ({
    timestamp: p.timestamp,
    value: p.value
  }))
  const diskData = (stats?.diskio_history ?? []).map((p) => ({
    timestamp: p.timestamp,
    read: p.read,
    write: p.write
  }))
  const netData = (stats?.network_history ?? []).map((p) => ({
    timestamp: p.timestamp,
    download: p.download,
    upload: p.upload
  }))

  const isLoading = !stats

  // "Not enough data" takes priority over loading, as on the current page.
  const stateOf = (data: Point[]): MetricState =>
    transitional || (!isLoading && data.length === 0)
      ? "empty"
      : isLoading
        ? "loading"
        : "ready"

  /** What every chart of one unit shares. */
  const chartOf = (unit: Unit) => ({
    format: unit.format,
    xAxisFormatter: (ts: unknown) => fmtTime(String(ts), range),
    yAxisFormatter: unit.axis,
    tooltipFormatter: (v: unknown) => unit.format(Number(v))
  })

  return (
    <Panel
      title={COPY.title}
      flush
      action={
        <Tabs
          size="sm"
          tabs={RANGE_TABS}
          value={range}
          onValueChange={(v) => setRange(v as ContainerRange)}
        />
      }
    >
      <MetricGroup>
        <Metric
          title={COPY.cpu}
          series={[
            {
              key: "value",
              label: COPY.cpu,
              color: STATS_COLORS.primary,
              ...figuresOf(cpuData, "value")
            }
          ]}
          data={cpuData}
          state={stateOf(cpuData)}
          {...chartOf(PERCENT)}
          threshold={FULL_USE}
        />
        <Metric
          title={COPY.ram}
          series={[
            {
              key: "value",
              label: COPY.ram,
              color: STATS_COLORS.primary,
              ...figuresOf(memData, "value")
            }
          ]}
          data={memData}
          state={stateOf(memData)}
          {...chartOf(PERCENT)}
          threshold={FULL_USE}
        />
        <Metric
          title={COPY.disk}
          series={[
            {
              key: "read",
              label: COPY.read,
              color: STATS_COLORS.secondary,
              ...figuresOf(diskData, "read")
            },
            {
              key: "write",
              label: COPY.write,
              color: STATS_COLORS.primary,
              ...figuresOf(diskData, "write")
            }
          ]}
          data={diskData}
          state={stateOf(diskData)}
          {...chartOf(MEGABYTES_PER_SECOND)}
        />
        <Metric
          title={COPY.network}
          series={[
            {
              key: "download",
              label: COPY.download,
              color: STATS_COLORS.secondary,
              ...figuresOf(netData, "download")
            },
            {
              key: "upload",
              label: COPY.upload,
              color: STATS_COLORS.primary,
              ...figuresOf(netData, "upload")
            }
          ]}
          data={netData}
          state={stateOf(netData)}
          {...chartOf(MEGABITS_PER_SECOND)}
        />
      </MetricGroup>
    </Panel>
  )
}
