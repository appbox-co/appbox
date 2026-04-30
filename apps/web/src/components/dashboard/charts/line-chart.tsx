"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { cn } from "@/lib/utils"

interface LineConfig {
  key: string
  color: string
  label: string
  dashed?: boolean
}

interface ReferenceLineConfig {
  y: number
  label: string
  color?: string
  dashed?: boolean
}

interface DashboardLineChartProps {
  data: Array<Record<string, number | string>>
  xKey: string
  lines: LineConfig[]
  height?: number
  showGrid?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  showDots?: boolean
  referenceLines?: ReferenceLineConfig[]
  xAxisFormatter?: (value: unknown) => string
  yAxisFormatter?: (value: unknown) => string
  tooltipFormatter?: (value: unknown) => string
  tooltipLabelFormatter?: (value: unknown) => string
  className?: string
}

function CustomTooltip({
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
  labelFormatter?: (value: unknown) => string
  valueFormatter?: (value: unknown) => string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {labelFormatter ? labelFormatter(label) : String(label)}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function DashboardLineChart({
  data,
  xKey,
  lines,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  showDots = false,
  referenceLines,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  className
}: DashboardLineChartProps) {
  return (
    <div
      className={cn(
        "min-w-0 w-full [&_.recharts-surface]:overflow-visible",
        className
      )}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border/50"
            />
          )}
          <XAxis
            dataKey={xKey}
            tickFormatter={xAxisFormatter}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
            className="fill-muted-foreground"
          />
          <YAxis
            tickFormatter={yAxisFormatter}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={65}
            className="fill-muted-foreground"
          />
          {showTooltip && (
            <Tooltip
              content={
                <CustomTooltip
                  labelFormatter={tooltipLabelFormatter ?? xAxisFormatter}
                  valueFormatter={tooltipFormatter ?? yAxisFormatter}
                />
              }
              cursor={{ className: "stroke-border" }}
            />
          )}
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
          )}
          {referenceLines?.map((refLine, i) => (
            <ReferenceLine
              key={`ref-${i}`}
              y={refLine.y}
              label={{
                value: refLine.label,
                position: "insideTopRight",
                className: "fill-muted-foreground text-[10px]"
              }}
              stroke={refLine.color ?? "hsl(var(--muted-foreground))"}
              strokeDasharray={refLine.dashed !== false ? "6 4" : undefined}
              strokeOpacity={0.6}
            />
          ))}
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeWidth={1.5}
              strokeDasharray={line.dashed ? "6 3" : undefined}
              dot={false}
              activeDot={
                showDots !== false
                  ? { r: 4, strokeWidth: 1.5, fill: "hsl(var(--card))" }
                  : false
              }
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
