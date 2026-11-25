import { Badge, cn } from "@cloudflare/kumo"
import type { CyloSummary } from "@/api/cylos/cylos"

/** Kumo's dot badges only come in success, warning, error and neutral. */
type Tone = "success" | "warning" | "error" | "neutral"

export interface AppboxStatusFilter {
  value: string
  /** Prototype-only copy, in English and sentence case. */
  label: string
  tone: Tone
  /** A state the Appbox is in, shown as a dot; otherwise a warning beside it. */
  state: boolean
  test: (cylo: CyloSummary) => boolean
}

const state = (
  value: string,
  label: string,
  tone: Tone
): AppboxStatusFilter => ({
  value,
  label,
  tone,
  state: true,
  test: (cylo) => cylo.status === value
})

/** The states and warnings an Appbox can be in, and be filtered by. */
export const APPBOX_STATUS_FILTERS: AppboxStatusFilter[] = [
  state("online", "Online", "success"),
  state("offline", "Offline", "neutral"),
  state("restarting", "Restarting", "warning"),
  state("installing", "Installing", "warning"),
  {
    ...state("migrating", "Migrating", "warning"),
    test: (cylo) => cylo.is_migrating || cylo.status === "migrating"
  },
  {
    value: "throttled",
    label: "Throttled",
    tone: "warning",
    state: false,
    test: (cylo) => cylo.is_throttled
  },
  {
    value: "low-quota",
    label: "Low on storage",
    tone: "error",
    state: false,
    test: (cylo) => cylo.is_low_quota
  },
  state("suspended", "Suspended", "error")
]

export function AppboxStatusBadge({ filter }: { filter: AppboxStatusFilter }) {
  return (
    <Badge
      variant={filter.tone}
      appearance={filter.state ? "dot" : undefined}
      className="shrink-0"
    >
      {filter.label}
    </Badge>
  )
}

/** The Appbox's state, then any warnings that apply on top of it. */
export function AppboxStatusBadges({
  cylo,
  className
}: {
  cylo: CyloSummary
  /** Lays the badges out, e.g. in a row or stacked. */
  className?: string
}) {
  const current = APPBOX_STATUS_FILTERS.find(
    (filter) => filter.state && filter.value === cylo.status
  )
  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {current ? (
        <AppboxStatusBadge filter={current} />
      ) : (
        <Badge variant="neutral" appearance="dot">
          {cylo.status}
        </Badge>
      )}
      {APPBOX_STATUS_FILTERS.filter(
        (filter) => !filter.state && filter.test(cylo)
      ).map((filter) => (
        <AppboxStatusBadge key={filter.value} filter={filter} />
      ))}
    </span>
  )
}
