import { cn } from "@cloudflare/kumo"

interface SparklineSeries {
  data: number[]
  /** Sets the line colour, e.g. `stroke-kumo-brand`. */
  className: string
}

const WIDTH = 100
const HEIGHT = 24
/** Room for the stroke at the top and bottom edges. */
const INSET = 1.5
/** More readings than this are averaged into buckets, so the line stays calm. */
const MAX_POINTS = 48

function bucket(data: number[]) {
  if (data.length <= MAX_POINTS) return data
  const size = data.length / MAX_POINTS
  return Array.from({ length: MAX_POINTS }, (_, index) => {
    const slice = data.slice(
      Math.floor(index * size),
      Math.max(Math.floor((index + 1) * size), Math.floor(index * size) + 1)
    )
    return slice.reduce((sum, value) => sum + value, 0) / slice.length
  })
}

function pathOf(data: number[], max: number) {
  return data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * WIDTH
      const y = HEIGHT - INSET - (value / max) * (HEIGHT - 2 * INSET)
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join("")
}

/**
 * The shape of one or two series, with no axes: for a table cell, where the
 * figures are written beside it. Series share one scale, starting at zero.
 * Decorative, so it is hidden from assistive technology.
 */
export function Sparkline({
  series,
  className
}: {
  series: SparklineSeries[]
  /** Sets the size, e.g. `h-7 w-24`. */
  className?: string
}) {
  const lines = series
    .map((entry) => ({
      ...entry,
      data: bucket(entry.data.filter((value) => Number.isFinite(value)))
    }))
    .filter((entry) => entry.data.length > 1)
  const max = Math.max(0, ...lines.flatMap((entry) => entry.data)) || 1

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={cn("h-7 w-24 shrink-0 overflow-visible", className)}
    >
      {lines.length === 0 ? (
        // Nothing to draw yet: a quiet baseline keeps the cell from jumping.
        <line
          x1="0"
          x2={WIDTH}
          y1={HEIGHT - INSET}
          y2={HEIGHT - INSET}
          strokeWidth="1.5"
          strokeDasharray="2 3"
          vectorEffect="non-scaling-stroke"
          className="stroke-kumo-line"
        />
      ) : (
        lines.map((entry, index) => (
          <path
            key={index}
            d={pathOf(entry.data, max)}
            fill="none"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className={entry.className}
          />
        ))
      )}
    </svg>
  )
}
