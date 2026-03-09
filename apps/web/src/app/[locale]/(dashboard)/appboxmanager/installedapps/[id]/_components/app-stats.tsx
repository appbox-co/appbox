"use client"

import { useEffect, useState } from "react"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Cpu,
  MemoryStick
} from "lucide-react"
import type { ContainerRange } from "@/api/installed-apps/container-stats"
import { useContainerStats } from "@/api/installed-apps/hooks/use-container-stats"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { ChartWrapper } from "@/components/dashboard/charts/chart-wrapper"
import { DashboardLineChart } from "@/components/dashboard/charts/line-chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWebSocket } from "@/providers/websocket-provider"

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type Point = { [key: string]: number | string }

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

  return (
    <div>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Performance</h2>
        <Tabs
          value={range}
          onValueChange={(v) => setRange(v as ContainerRange)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="1h" className="px-2.5 text-xs">
              1h
            </TabsTrigger>
            <TabsTrigger value="24h" className="px-2.5 text-xs">
              24h
            </TabsTrigger>
            <TabsTrigger value="7d" className="px-2.5 text-xs">
              7d
            </TabsTrigger>
            <TabsTrigger value="30d" className="px-2.5 text-xs">
              30d
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 2×2 chart grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* ── CPU ── */}
        <ChartWrapper
          title="CPU"
          isLoading={isLoading}
          isEmpty={transitional || (!isLoading && cpuData.length === 0)}
          seriesStats={[
            {
              label: "Usage",
              color: "#3b82f6",
              icon: <Cpu className="size-3" />,
              peak: getPeak(cpuData, "value"),
              current: getCurrent(cpuData, "value"),
              avg: getAvg(cpuData, "value"),
              formatter: fmtPercent
            }
          ]}
        >
          <DashboardLineChart
            data={cpuData}
            xKey="timestamp"
            lines={[{ key: "value", color: "#3b82f6", label: "CPU %" }]}
            height={160}
            xAxisFormatter={(ts) => fmtTime(String(ts), range)}
            yAxisFormatter={(v) => `${Number(v).toFixed(0)}%`}
            tooltipFormatter={(v) => fmtPercent(Number(v))}
            tooltipLabelFormatter={(ts) => fmtTime(String(ts), range)}
            referenceLines={[{ y: 100, label: "100%", dashed: true }]}
          />
        </ChartWrapper>

        {/* ── RAM ── */}
        <ChartWrapper
          title="RAM"
          isLoading={isLoading}
          isEmpty={transitional || (!isLoading && memData.length === 0)}
          seriesStats={[
            {
              label: "Usage",
              color: "#8b5cf6",
              icon: <MemoryStick className="size-3" />,
              peak: getPeak(memData, "value"),
              current: getCurrent(memData, "value"),
              avg: getAvg(memData, "value"),
              formatter: fmtPercent
            }
          ]}
        >
          <DashboardLineChart
            data={memData}
            xKey="timestamp"
            lines={[{ key: "value", color: "#8b5cf6", label: "RAM %" }]}
            height={160}
            xAxisFormatter={(ts) => fmtTime(String(ts), range)}
            yAxisFormatter={(v) => `${Number(v).toFixed(0)}%`}
            tooltipFormatter={(v) => fmtPercent(Number(v))}
            tooltipLabelFormatter={(ts) => fmtTime(String(ts), range)}
            referenceLines={[{ y: 100, label: "100%", dashed: true }]}
          />
        </ChartWrapper>

        {/* ── Disk I/O ── */}
        <ChartWrapper
          title="Disk I/O"
          isLoading={isLoading}
          isEmpty={transitional || (!isLoading && diskData.length === 0)}
          seriesStats={[
            {
              label: "Read",
              color: "#06b6d4",
              icon: <ArrowDownToLine className="size-3" />,
              peak: getPeak(diskData, "read"),
              current: getCurrent(diskData, "read"),
              avg: getAvg(diskData, "read"),
              formatter: fmtMBs
            },
            {
              label: "Write",
              color: "#f59e0b",
              icon: <ArrowUpFromLine className="size-3" />,
              peak: getPeak(diskData, "write"),
              current: getCurrent(diskData, "write"),
              avg: getAvg(diskData, "write"),
              formatter: fmtMBs
            }
          ]}
        >
          <DashboardLineChart
            data={diskData}
            xKey="timestamp"
            lines={[
              { key: "read", color: "#06b6d4", label: "Read" },
              { key: "write", color: "#f59e0b", label: "Write" }
            ]}
            height={160}
            xAxisFormatter={(ts) => fmtTime(String(ts), range)}
            yAxisFormatter={(v) => `${Number(v).toFixed(1)}`}
            tooltipFormatter={(v) => fmtMBs(Number(v))}
            tooltipLabelFormatter={(ts) => fmtTime(String(ts), range)}
          />
        </ChartWrapper>

        {/* ── Network ── */}
        <ChartWrapper
          title="Network"
          isLoading={isLoading}
          isEmpty={transitional || (!isLoading && netData.length === 0)}
          seriesStats={[
            {
              label: "Download",
              color: "#22c55e",
              icon: <ArrowDownToLine className="size-3" />,
              peak: getPeak(netData, "download"),
              current: getCurrent(netData, "download"),
              avg: getAvg(netData, "download"),
              formatter: fmtMbps
            },
            {
              label: "Upload",
              color: "#3b82f6",
              icon: <ArrowUpFromLine className="size-3" />,
              peak: getPeak(netData, "upload"),
              current: getCurrent(netData, "upload"),
              avg: getAvg(netData, "upload"),
              formatter: fmtMbps
            }
          ]}
        >
          <DashboardLineChart
            data={netData}
            xKey="timestamp"
            lines={[
              { key: "download", color: "#22c55e", label: "Down" },
              { key: "upload", color: "#3b82f6", label: "Up" }
            ]}
            height={160}
            xAxisFormatter={(ts) => fmtTime(String(ts), range)}
            yAxisFormatter={(v) => `${Number(v).toFixed(1)}`}
            tooltipFormatter={(v) => fmtMbps(Number(v))}
            tooltipLabelFormatter={(ts) => fmtTime(String(ts), range)}
          />
        </ChartWrapper>
      </div>
    </div>
  )
}
