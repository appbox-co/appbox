import { Badge } from "@cloudflare/kumo"

/** Kumo's dot badges only come in success, warning, error and neutral. */
type Tone = "success" | "warning" | "error" | "neutral"

/** Where a report stands, in four broad groups: one per badge tone. */
export type AbuseGroup = "waiting" | "open" | "resolved" | "closed"

/**
 * The groups, in the order they need attention. Prototype-only copy, in
 * English and sentence case.
 */
export const ABUSE_GROUPS: { value: AbuseGroup; label: string; tone: Tone }[] =
  [
    { value: "waiting", label: "Waiting on you", tone: "error" },
    { value: "open", label: "In progress", tone: "warning" },
    { value: "resolved", label: "Resolved", tone: "success" },
    { value: "closed", label: "Closed", tone: "neutral" }
  ]

/**
 * Each backend status code's group: the tone the current design's badge gives
 * it (error, pending, success, neutral), unchanged.
 */
const GROUP_BY_CODE: Record<number, AbuseGroup> = {
  [-1]: "open",
  0: "resolved",
  1: "waiting",
  2: "resolved",
  3: "resolved",
  4: "closed",
  5: "open",
  6: "open",
  7: "open",
  8: "resolved",
  9: "open",
  10: "open",
  11: "open",
  12: "closed"
}

export function abuseGroup(status: string, statusCode: number): AbuseGroup {
  return (
    GROUP_BY_CODE[statusCode] ??
    (status.toLowerCase().includes("waiting") ? "open" : "closed")
  )
}

const toneOf = (group: AbuseGroup): Tone =>
  ABUSE_GROUPS.find((entry) => entry.value === group)?.tone ?? "neutral"

/**
 * The status labels are sentences with the outcome in brackets, such as
 * "Closed by user (files deleted)". This separates the two so the first part
 * fits a badge; the wording itself is untouched.
 */
export function splitAbuseStatus(status: string): {
  label: string
  detail: string | null
} {
  const match = status.match(/^(.*?)\s*\((.*)\)\s*$/)
  if (!match || !match[1]) return { label: status, detail: null }
  const detail = match[2]
  return {
    label: match[1],
    detail: detail.charAt(0).toUpperCase() + detail.slice(1)
  }
}

/** A report's status as a badge: the first part of its label, in its group's tone. */
export function AbuseStatusBadge({
  status,
  statusCode
}: {
  status: string
  statusCode: number
}) {
  return (
    // The full sentence stays available on hover.
    <span title={status} className="inline-flex max-w-full">
      <Badge
        variant={toneOf(abuseGroup(status, statusCode))}
        appearance="dot"
        className="shrink-0"
      >
        {splitAbuseStatus(status).label}
      </Badge>
    </span>
  )
}

/** One of the four groups as a badge, for filters and counts. */
export function AbuseGroupBadge({ group }: { group: AbuseGroup }) {
  const entry = ABUSE_GROUPS.find((item) => item.value === group)
  return (
    <Badge variant={entry?.tone ?? "neutral"} appearance="dot">
      {entry?.label ?? group}
    </Badge>
  )
}
