import type { ReactNode } from "react"
import { LayerCard } from "@cloudflare/kumo"

/**
 * A titled card: the standard container for a section of a page. Never put one
 * inside another (a Kumo rule); use plain markup for inner groupings.
 */
export function Panel({
  title,
  count,
  action,
  flush = false,
  children
}: {
  title: string
  /** Shown as a pill beside the title. */
  count?: number
  /** Sits at the end of the header: a link, a small button, a range picker. */
  action?: ReactNode
  /** Body without padding, for tables that run edge to edge. */
  flush?: boolean
  children: ReactNode
}) {
  return (
    <LayerCard>
      <LayerCard.Secondary className={action ? "justify-between" : undefined}>
        <span className="flex min-w-0 items-center gap-2">
          <h2 className="truncate">{title}</h2>
          {count !== undefined && (
            <span className="rounded-full bg-kumo-fill px-1.5 text-xs/5 font-normal text-kumo-default tabular-nums">
              {count}
            </span>
          )}
        </span>
        {action && (
          <span className="flex shrink-0 items-center gap-2 font-normal">
            {action}
          </span>
        )}
      </LayerCard.Secondary>
      <LayerCard.Primary className={flush ? "gap-0 p-0" : "px-5 py-4"}>
        {children}
      </LayerCard.Primary>
    </LayerCard>
  )
}
