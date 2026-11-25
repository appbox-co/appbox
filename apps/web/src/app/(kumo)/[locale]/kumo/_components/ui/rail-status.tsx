import type { ReactNode } from "react"

export interface RailStatusEntry {
  value: string
  /** How the status is shown in the list itself, usually its badge. */
  badge: ReactNode
  count: number
  /** Tooltip, e.g. "Show only online apps". */
  hint: string
}

/**
 * How many items are in each status, for the shell's right-hand column. Each
 * row filters the page's list to that status.
 */
export function RailStatusCard({
  title,
  entries,
  active,
  onSelect
}: {
  title: string
  entries: RailStatusEntry[]
  /** The status the list is filtered to, if any. */
  active: string
  /** Called with the row's status; the page decides whether that turns the filter on or off. */
  onSelect: (value: string) => void
}) {
  if (entries.length === 0) return null

  return (
    <div className="p-4">
      <section className="rounded-lg bg-kumo-base px-4 pt-3.5 pb-2 shadow-xs ring ring-kumo-line">
        <h2 className="font-medium">{title}</h2>
        <ul className="mt-1.5 grid list-none grid-cols-1 divide-y divide-kumo-hairline">
          {entries.map((entry) => (
            <li key={entry.value}>
              <button
                type="button"
                aria-pressed={active === entry.value}
                title={entry.hint}
                onClick={() => onSelect(entry.value)}
                className="-mx-2 my-1 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-kumo-tint focus-visible:outline-2 focus-visible:outline-kumo-brand aria-pressed:bg-kumo-tint"
              >
                {entry.badge}
                <span className="tabular-nums">{entry.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
