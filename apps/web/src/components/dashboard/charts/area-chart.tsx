"use client"

import {
  Area,
  CartesianGrid,
  AreaChart as RechartsAreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { cn } from "@/lib/utils"

interface YKeyConfig {
  key: string
  color: string
  label: string
}

interface ReferenceLineConfig {
  y: number
  label?: string
  color?: string
  dashed?: boolean
}

interface DashboardAreaChartProps {
  data: Array<Record<string, number | string>>
  xKey: string
  yKeys: YKeyConfig[]
  height?: number
  showGrid?: boolean
  showTooltip?: boolean
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

export function DashboardAreaChart({
  data,
  xKey,
  yKeys,
  height = 300,
  showGrid = true,
  showTooltip = true,
  referenceLines,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  className
}: DashboardAreaChartProps) {
  return (
    <div
      className={cn(
        "min-w-0 w-full [&_.recharts-surface]:overflow-visible",
        className
      )}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
        >
          <defs>
            {yKeys.map((yKey) => (
              <linearGradient
                key={yKey.key}
                id={`gradient-${yKey.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={yKey.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={yKey.color} stopOpacity={0.03} />
              </linearGradient>
            ))}
          </defs>

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

          {referenceLines?.map((ref, i) => (
            <ReferenceLine
              key={`ref-${i}`}
              y={ref.y}
              stroke={ref.color ?? "hsl(var(--muted-foreground))"}
              strokeDasharray={ref.dashed !== false ? "6 4" : undefined}
              strokeOpacity={0.55}
              label={
                ref.label
                  ? {
                      value: ref.label,
                      position: "insideTopRight",
                      fontSize: 10,
                      className: "fill-muted-foreground"
                    }
                  : undefined
              }
            />
          ))}

          {yKeys.map((yKey) => (
            <Area
              key={yKey.key}
              type="monotone"
              dataKey={yKey.key}
              name={yKey.label}
              stroke={yKey.color}
              strokeWidth={1.5}
              fill={`url(#gradient-${yKey.key})`}
              activeDot={{ r: 4, strokeWidth: 1.5 }}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
