import type { ReactNode } from "react"
import { cn } from "@cloudflare/kumo"

/**
 * One fact in a list of details (a `<dl>`): its label, and its value at the
 * end of the row. A text value is cut short to fit; pass `fit` when the value
 * is an element that fits itself, such as a badge or a span that truncates.
 */
export function DetailRow({
  label,
  fit = false,
  children
}: {
  label: string
  fit?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-kumo-subtle">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-end font-medium",
          fit ? "flex justify-end" : "truncate"
        )}
      >
        {children}
      </dd>
    </div>
  )
}
