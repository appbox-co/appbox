"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

/**
 * Chart colours as Kumo CSS variables, so both themes work without script.
 *
 * Kumo's own `Chart` needs the `echarts` package, which this app does not
 * have, so the charts are drawn with recharts and take Kumo's tokens directly.
 * The second series is a neutral, as in the current design: it is told apart
 * from the brand blue by lightness and saturation rather than by hue, and each
 * series is also named in the figures beside the chart and in the tooltip.
 */
export const STATS_COLORS = {
  primary: "var(--color-kumo-brand)",
  secondary: "var(--text-color-kumo-subtle)",
  grid: "var(--color-kumo-line)",
  crosshair: "var(--color-kumo-interact)",
  axis: "var(--text-color-kumo-subtle)",
  surface: "var(--color-kumo-base)"
} as const

export type StatsPoint = { [key: string]: number | string }

export interface StatsSeries {
  /** The field of each point that holds this series' value. */
  key: string
  label: string
  color: string
}

/** A dashed horizontal marker, drawn only while it is inside the y range. */
export interface StatsThreshold {
  y: number
  label: string
  /** The line's colour; the axis grey unless given. The label stays grey. */
  color?: string
}

const AXIS_TICK = {
  fontSize: 12,
  fill: STATS_COLORS.axis,
  style: { fontVariantNumeric: "tabular-nums" }
}

/** A short stroke in a series' colour: the key beside its name. */
export function SeriesKey({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="h-0.5 w-3 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  )
}

function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter
}: {
  active?: boolean
  payload?: Array<{
    dataKey?: string | number
    value?: number
    color?: string
    name?: string
  }>
  label?: string | number
  labelFormatter: (value: unknown) => string
  valueFormatter: (value: unknown) => string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="grid gap-1 rounded-lg bg-kumo-base px-3 py-2 shadow-lg ring ring-kumo-line">
      <p className="text-xs text-kumo-subtle">{labelFormatter(label)}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <SeriesKey color={entry.color ?? STATS_COLORS.primary} />
          <span className="text-kumo-subtle">{entry.name}</span>
          <span className="ml-auto pl-4 font-medium text-kumo-default tabular-nums">
            {valueFormatter(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export interface StatsChartProps {
  data: StatsPoint[]
  xKey: string
  /** In drawing order: a later series is drawn over an earlier one. */
  series: StatsSeries[]
  height: number
  /** "area" adds a light wash of the series' colour under each line. */
  variant?: "line" | "area"
  xAxisFormatter: (value: unknown) => string
  yAxisFormatter: (value: unknown) => string
  tooltipFormatter: (value: unknown) => string
  /** The tooltip's heading; the x axis formatter unless given. */
  tooltipLabelFormatter?: (value: unknown) => string
  /** Room for the y axis labels, in pixels. */
  yAxisWidth?: number
  threshold?: StatsThreshold
}

/** A chart over time, one line per series, on a shared y axis. */
export function StatsChart({
  data,
  xKey,
  series,
  height,
  variant = "line",
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  yAxisWidth = 48,
  threshold
}: StatsChartProps) {
  const Chart = variant === "area" ? AreaChart : LineChart

  return (
    <div className="w-full min-w-0 [&_.recharts-surface]:overflow-visible">
      <ResponsiveContainer width="100%" height={height}>
        <Chart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={STATS_COLORS.grid} />
          <XAxis
            dataKey={xKey}
            tickFormatter={xAxisFormatter}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={40}
          />
          <YAxis
            tickFormatter={yAxisFormatter}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={yAxisWidth}
          />
          <Tooltip
            content={
              <ChartTooltip
                labelFormatter={tooltipLabelFormatter ?? xAxisFormatter}
                valueFormatter={tooltipFormatter}
              />
            }
            cursor={{ stroke: STATS_COLORS.crosshair, strokeWidth: 1 }}
            isAnimationActive={false}
          />
          {threshold && (
            <ReferenceLine
              y={threshold.y}
              label={{
                value: threshold.label,
                position: "insideTopRight",
                fill: STATS_COLORS.axis,
                fontSize: 12
              }}
              stroke={threshold.color ?? STATS_COLORS.axis}
              strokeDasharray="4 4"
            />
          )}
          {series.map((line) => {
            const shared = {
              type: "monotone",
              dataKey: line.key,
              name: line.label,
              stroke: line.color,
              strokeWidth: 2,
              strokeLinecap: "round",
              strokeLinejoin: "round",
              dot: false,
              activeDot: {
                r: 4,
                fill: line.color,
                stroke: STATS_COLORS.surface,
                strokeWidth: 2
              },
              isAnimationActive: false
            } as const

            return variant === "area" ? (
              <Area
                key={line.key}
                {...shared}
                fill={line.color}
                fillOpacity={0.1}
              />
            ) : (
              <Line key={line.key} {...shared} />
            )
          })}
        </Chart>
      </ResponsiveContainer>
    </div>
  )
}
