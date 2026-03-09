"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Path builder                                                               */
/* -------------------------------------------------------------------------- */

interface Point {
  x: number
  y: number
}

/**
 * Build a smooth cubic-bezier SVG path through the data points.
 * Uses horizontal control points at the midpoint X so the curve
 * stays flat at each data point (avoids overshooting).
 */
function buildPath(pts: Point[]): string {
  if (pts.length < 2) return ""
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1]
    const p1 = pts[i]
    const cpx = ((p0.x + p1.x) / 2).toFixed(1)
    d += ` C ${cpx} ${p0.y.toFixed(1)}, ${cpx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`
  }
  return d
}

function normalise(
  values: number[],
  W: number,
  H: number,
  padY: number
): Point[] {
  if (values.length < 2) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - padY - ((v - min) / range) * (H - padY * 2)
  }))
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

export interface SparklineProps {
  /** Primary data series */
  data: number[]
  /** Optional second series shown on the same chart */
  data2?: number[]
  /** CSS hex/hsl colour for the primary line */
  color?: string
  /** CSS hex/hsl colour for the second line */
  color2?: string
  /**
   * Unique string used for SVG gradient IDs.
   * Must be unique per mounted instance to avoid gradient cross-contamination.
   */
  uid: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

const W = 100
const H = 100
const PAD = 6 // viewBox units of top/bottom padding

export function Sparkline({
  data,
  data2,
  color = "#22d3ee",
  color2 = "#f472b6",
  uid,
  className
}: SparklineProps) {
  const pts1 = useMemo(() => {
    // When two series share the chart, normalise them together for a common scale
    const combined = data2 ? [...data, ...data2] : data
    const min = Math.min(...combined)
    const max = Math.max(...combined)
    const range = max - min || 1
    return data.length < 2
      ? []
      : data.map((v, i) => ({
          x: (i / (data.length - 1)) * W,
          y: H - PAD - ((v - min) / range) * (H - PAD * 2)
        }))
  }, [data, data2])

  const pts2 = useMemo(() => {
    if (!data2 || data2.length < 2) return []
    const combined = [...data, ...data2]
    const min = Math.min(...combined)
    const max = Math.max(...combined)
    const range = max - min || 1
    return data2.map((v, i) => ({
      x: (i / (data2.length - 1)) * W,
      y: H - PAD - ((v - min) / range) * (H - PAD * 2)
    }))
  }, [data, data2])

  const line1 = useMemo(() => buildPath(pts1), [pts1])
  const fill1 = useMemo(
    () => (pts1.length ? `${line1} L ${W} ${H} L 0 ${H} Z` : ""),
    [line1, pts1]
  )

  const line2 = useMemo(() => buildPath(pts2), [pts2])
  const fill2 = useMemo(
    () => (pts2.length ? `${line2} L ${W} ${H} L 0 ${H} Z` : ""),
    [line2, pts2]
  )

  if (!pts1.length) {
    // Loading / no data — show a faint flat line
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="h-px w-full rounded-full bg-muted-foreground/20" />
      </div>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
    >
      <defs>
        <linearGradient id={`sp-${uid}-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        {pts2.length > 0 && (
          <linearGradient id={`sp-${uid}-b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color2} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color2} stopOpacity="0" />
          </linearGradient>
        )}
      </defs>

      {/* Fills rendered beneath lines */}
      {pts2.length > 0 && <path d={fill2} fill={`url(#sp-${uid}-b)`} />}
      <path d={fill1} fill={`url(#sp-${uid}-a)`} />

      {/* Lines */}
      {pts2.length > 0 && (
        <path
          d={line2}
          fill="none"
          stroke={color2}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <path
        d={line1}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*  Convenience: single-series wrapper that also normalises independently      */
/* -------------------------------------------------------------------------- */

export function SingleSparkline({
  data,
  color = "#22d3ee",
  uid,
  className
}: Omit<SparklineProps, "data2" | "color2">) {
  const pts = useMemo(() => normalise(data, W, H, PAD), [data])
  const line = useMemo(() => buildPath(pts), [pts])
  const fill = useMemo(
    () => (pts.length ? `${line} L ${W} ${H} L 0 ${H} Z` : ""),
    [line, pts]
  )

  if (!pts.length) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="h-px w-full rounded-full bg-muted-foreground/20" />
      </div>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
    >
      <defs>
        <linearGradient id={`sp-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sp-${uid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
