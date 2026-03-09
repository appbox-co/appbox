"use client"

import { Fragment, type ReactNode } from "react"
import { BarChart2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  SeriesStat — rich legend replacement                                       */
/* -------------------------------------------------------------------------- */

export interface SeriesStat {
  /** Display name shown in the stat strip */
  label: string
  /** Hex/hsl colour that matches the chart series */
  color: string
  /** Optional Lucide icon node (e.g. <ArrowUpFromLine className="size-3" />) */
  icon?: ReactNode
  /** Highest value in the visible window — shown in amber */
  peak: number | null
  /** Most recent / last data-point value */
  current: number | null
  /** Mean over the visible window — omit (undefined) to hide */
  avg?: number | null
  /** Formats a raw number into a display string */
  formatter: (v: number) => string
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                       */
/* -------------------------------------------------------------------------- */

interface TimeRange {
  label: string
  value: string
}

interface ChartWrapperProps {
  title: string
  children: ReactNode
  timeRanges?: TimeRange[]
  selectedRange?: string
  onRangeChange?: (range: string) => void
  isLoading?: boolean
  /** Show an empty-data placeholder instead of the chart */
  isEmpty?: boolean
  /** When provided, renders a stat strip below the chart replacing the legend */
  seriesStats?: SeriesStat[]
  className?: string
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export function ChartWrapper({
  title,
  children,
  timeRanges,
  selectedRange,
  onRangeChange,
  isLoading = false,
  isEmpty = false,
  seriesStats,
  className
}: ChartWrapperProps) {
  return (
    <Card className={cn("card-glow flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>

        {timeRanges && timeRanges.length > 0 && (
          <Tabs
            value={selectedRange ?? timeRanges[0].value}
            onValueChange={onRangeChange}
          >
            <TabsList className="h-8">
              {timeRanges.map((range) => (
                <TabsTrigger
                  key={range.value}
                  value={range.value}
                  className="px-2.5 text-xs"
                >
                  {range.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col pt-2">
        {/* Empty-data overlay — takes priority over loading */}
        {isEmpty ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-xl">
            <div className="flex flex-col items-center gap-2">
              <BarChart2 className="size-6 text-muted-foreground/30" />
              <span className="text-xs text-muted-foreground">
                Not enough data
              </span>
            </div>
          </div>
        ) : isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-xl bg-card/80 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
              <span className="text-xs text-muted-foreground">Loading…</span>
            </div>
          </div>
        ) : null}

        {/* Chart */}
        {children}

        {/* ── Stat strip ─────────────────────────────────────────────────── */}
        {seriesStats &&
          seriesStats.length > 0 &&
          (() => {
            const hasAvg = seriesStats.some((s) => s.avg != null)
            return (
              <div
                className="mt-3 grid items-center gap-x-4 gap-y-1.5 border-t border-border/40 pt-3 text-[11px]"
                style={{
                  gridTemplateColumns: hasAvg
                    ? "auto auto auto auto"
                    : "auto auto auto"
                }}
              >
                {seriesStats.map((s, i) => (
                  <Fragment key={i}>
                    {/* Col 1 — icon + label */}
                    <div
                      className="flex items-center gap-1.5 font-medium"
                      style={{ color: s.color }}
                    >
                      {s.icon}
                      <span className="truncate">{s.label}</span>
                    </div>

                    {/* Col 2 — peak */}
                    <div className="flex items-center gap-1 tabular-nums">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500">
                        pk
                      </span>
                      <span className="font-semibold text-amber-400/90">
                        {s.peak !== null ? s.formatter(s.peak) : "—"}
                      </span>
                    </div>

                    {/* Col 3 — current */}
                    <div className="flex items-center gap-1 tabular-nums text-foreground/70">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">
                        now
                      </span>
                      <span className="font-semibold">
                        {s.current !== null ? s.formatter(s.current) : "—"}
                      </span>
                    </div>

                    {/* Col 4 — avg (only rendered when any series has avg) */}
                    {hasAvg && (
                      <div
                        className={cn(
                          "flex items-center gap-1 tabular-nums text-muted-foreground",
                          s.avg == null && "invisible"
                        )}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                          avg
                        </span>
                        <span className="font-medium">
                          {s.avg != null ? s.formatter(s.avg) : "—"}
                        </span>
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            )
          })()}
      </CardContent>
    </Card>
  )
}
