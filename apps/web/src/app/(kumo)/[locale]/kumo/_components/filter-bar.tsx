import type { ReactNode } from "react"

/** Class for the `InputGroup` that leads a `FilterBar`. */
export const FILTER_BAR_INPUT = "shadow-none"

/**
 * Class for each `Select` in a `FilterBar`. Kumo wraps the trigger in an
 * element of its own, which is what the bar rounds, so the trigger inherits.
 * Add a width from `@xl` up, e.g. `@xl:w-40`.
 */
export const FILTER_BAR_SELECT = "w-full rounded-[inherit] shadow-none"

/**
 * Search and filters joined into one bar inside a soft tray, as on Cloudflare's
 * list pages. Give it an `InputGroup` first, then any number of `Select`s.
 *
 * It is a two-column grid on small screens (search across the top, an odd last
 * filter across the bottom) and a single row once the bar is 36rem wide. The
 * joining itself is plain CSS: see `.kumo-filter-bar` in kumo-prototype.css.
 */
export function FilterBar({
  children,
  dropLastWhenWide = false
}: {
  children: ReactNode
  /** Hides the last filter once the bar is a single row. */
  dropLastWhenWide?: boolean
}) {
  return (
    <div className="@container rounded-xl bg-kumo-elevated p-1.5 ring ring-kumo-hairline">
      <div
        className="kumo-filter-bar shadow-xs"
        data-drop-last={dropLastWhenWide ? "" : undefined}
      >
        {children}
      </div>
    </div>
  )
}
