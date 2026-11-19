"use client"

import type { ReactNode } from "react"
import { cn, Loader } from "@cloudflare/kumo"
import { ChartLineIcon } from "@phosphor-icons/react"
import {
  SeriesKey,
  StatsChart,
  type StatsChartProps,
  type StatsSeries
} from "./stats-chart"

/**
 * Prototype-only copy, in English and sentence case. The current pages have
 * these strings hard-coded too; none of them has a translation key yet.
 */
const COPY = {
  peak: "Peak",
  average: "Average",
  noValue: "—",
  notEnoughData: "Not enough data",
  loading: "Loading…"
} as const

/** Tailwind `h-40`: the plot and its x axis. Placeholders keep the same height. */
const CHART_HEIGHT = 160

/**
 * How a metric is arranged.
 * - "cell": the figures above the chart, for a grid of metrics side by side.
 * - "row": the figures in a column at the start and a wide chart filling the
 *   rest, for metrics stacked one per row. Narrow containers get the figures
 *   above the chart here too.
 */
export type MetricLayout = "cell" | "row"

export type MetricState = "ready" | "loading" | "empty"

/** A series of a metric, with the figures quoted for it. */
export interface MetricSeries extends StatsSeries {
  /** The latest value in the range, or `null` when there is none. */
  current: number | null
  peak: number | null
  /** Leave out for a series whose average is not shown. */
  average?: number | null
}

/**
 * "12.3%" becomes ["12.3", "%"] and "1.38 TB" becomes ["1.38", "TB"]: the
 * number is set large and its unit small beside it.
 */
function splitUnit(text: string): [string, string] {
  const match = /^(-?[\d.,]+)\s*(.*)$/.exec(text)
  return match ? [match[1], match[2]] : [text, ""]
}

/** A series' current value, large, with its peak and average beneath. */
function Figure({
  line,
  format,
  keyed,
  shown
}: {
  line: MetricSeries
  format: (value: number) => string
  /** Name the series beside a colour key: needed once a chart has two lines. */
  keyed: boolean
  /** Without a chart there is no figure to quote either. */
  shown: boolean
}) {
  const current = shown ? line.current : null
  const peak = shown ? line.peak : null
  const average = shown ? line.average : null
  const [value, unit] =
    current !== null ? splitUnit(format(current)) : [COPY.noValue, ""]

  return (
    <div className="grid min-w-0 grid-cols-1 gap-1">
      {keyed && (
        <p className="flex items-center gap-1.5 text-xs text-kumo-subtle">
          <SeriesKey color={line.color} />
          <span className="truncate">{line.label}</span>
        </p>
      )}
      <p className="flex flex-wrap items-baseline gap-x-1">
        <span className="text-2xl font-semibold">{value}</span>
        {unit && <span className="text-sm text-kumo-subtle">{unit}</span>}
      </p>
      <p className="flex flex-wrap gap-x-3 text-xs text-kumo-subtle">
        <span className="whitespace-nowrap">
          {COPY.peak}{" "}
          <span className="text-kumo-default">
            {peak !== null ? format(peak) : COPY.noValue}
          </span>
        </span>
        {line.average !== undefined && (
          <span className="whitespace-nowrap">
            {COPY.average}{" "}
            <span className="text-kumo-default">
              {average != null ? format(average) : COPY.noValue}
            </span>
          </span>
        )}
      </p>
    </div>
  )
}

/** Stands in for a chart that is still loading or has nothing to draw. */
function ChartPlaceholder({ state }: { state: "loading" | "empty" }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-kumo-subtle">
      {state === "loading" ? (
        <Loader aria-label={COPY.loading} />
      ) : (
        <ChartLineIcon aria-hidden size={24} className="text-kumo-inactive" />
      )}
      <span>{state === "loading" ? COPY.loading : COPY.notEnoughData}</span>
    </div>
  )
}

interface MetricProps extends Pick<
  StatsChartProps,
  | "data"
  | "variant"
  | "xAxisFormatter"
  | "yAxisFormatter"
  | "tooltipFormatter"
  | "tooltipLabelFormatter"
  | "yAxisWidth"
  | "threshold"
> {
  layout?: MetricLayout
  title: string
  /** In drawing order: a later line is drawn over an earlier one. */
  series: MetricSeries[]
  /** List the figures last series first, when that is the one that leads. */
  reverseFigures?: boolean
  state: MetricState
  /** Writes a figure in full: "12.3%", "1.38 TB". */
  format: (value: number) => string
}

/**
 * One metric: a small label, the current value of each series, and the line.
 * Not a card: the hairlines of the `MetricGroup` around it are all that
 * separates one metric from the next.
 */
export function Metric({
  layout = "cell",
  title,
  series,
  reverseFigures = false,
  state,
  format,
  ...chart
}: MetricProps) {
  const keyed = series.length > 1
  const row = layout === "row"
  const figures = reverseFigures ? [...series].reverse() : series

  return (
    <section
      className={cn(
        "min-w-0 bg-kumo-base px-5 py-4",
        row
          ? "grid grid-cols-1 gap-x-6 gap-y-3 @xl:grid-cols-[13rem_minmax(0,1fr)] @xl:items-center"
          : "flex flex-col gap-3"
      )}
    >
      <div className="grid min-w-0 grid-cols-1 gap-1.5">
        <h3 className="text-sm text-kumo-subtle">{title}</h3>
        <div
          className={cn(
            "grid gap-x-6 gap-y-3",
            keyed ? "grid-cols-2" : "grid-cols-1",
            // In the start column of a row, one figure under the other.
            row && "@xl:grid-cols-1"
          )}
        >
          {figures.map((line) => (
            <Figure
              key={line.key}
              line={line}
              format={format}
              keyed={keyed}
              shown={state === "ready"}
            />
          ))}
        </div>
      </div>

      {/* In a cell, pushed down so the charts of a grid row line up. */}
      <div className={row ? "min-w-0" : "mt-auto"}>
        {state === "ready" ? (
          <StatsChart
            xKey="timestamp"
            series={series}
            height={CHART_HEIGHT}
            {...chart}
          />
        ) : (
          <ChartPlaceholder state={state} />
        )}
      </div>
    </section>
  )
}

/**
 * Holds the metrics of one Panel body: hairlines between them, and the
 * container whose width their layouts respond to. Cells go two to a row once
 * there is room; rows always stack.
 */
export function MetricGroup({
  layout = "cell",
  children
}: {
  layout?: MetricLayout
  children: ReactNode
}) {
  return (
    <div className="@container">
      {/* The 1px gaps show the hairline colour behind the metrics. */}
      <div
        className={cn(
          "grid grid-cols-1 gap-px bg-kumo-hairline",
          layout === "cell" && "@2xl:grid-cols-2"
        )}
      >
        {children}
      </div>
    </div>
  )
}
