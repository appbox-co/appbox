"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { cn, Empty, LinkButton, SkeletonLine } from "@cloudflare/kumo"
import { CheckCircleIcon, FlagIcon } from "@phosphor-icons/react"
import {
  ABUSE_STATUS_LABELS,
  type AbuseReportDetail,
  type AbuseTimelineEntry
} from "@/api/account/account"
import { RAIL_FALLBACK, ShellRail } from "../app-shell"
import { kumoRoutes } from "../kumo-routes"
import { Panel } from "../panel"
import { EMPTY_IN_CARD, type Loadable } from "../shared"
import { ShortDate } from "../short-date"
import { abuseGroup, AbuseStatusBadge, type AbuseGroup } from "./abuse-status"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed. Several of
 * these are hard-coded English in the current page too.
 */
const COPY = {
  timeline: "Timeline",
  noTimeline: "No timeline entries yet.",
  reportDetails: "Report details",
  details: "Details",
  appbox: "Appbox",
  adminResponse: "Admin response",
  noDescription: "No description was given.",
  loadFailedTitle: "This report could not be loaded",
  loadFailedHint: "It may not exist, or it may belong to another account.",
  backToList: "Back to abuse reports"
} as const

/** What each status means for the case, as the current page words it. */
const TIMELINE_MESSAGES: Record<number, string> = {
  [-1]: "The case has been created and is awaiting investigation.",
  0: "The user has resolved the case and the files have been deleted.",
  1: "The user has not responded to the case and the files have been quarantined.",
  2: "The case was resolved automatically and the files have been deleted.",
  3: "The case was resolved automatically and the files were not found.",
  4: "The case was resolved automatically and the Appbox no longer exists.",
  5: "The case is currently being investigated.",
  6: "The case is currently being investigated.",
  7: "We're searching for the data.",
  8: "The case was investigated by a team member and is now resolved.",
  9: "The case is currently being investigated.",
  10: "The case is currently being investigated.",
  11: "The case is currently being investigated.",
  12: "Closed by complainant."
}

/** The current page's rule: relative for a month, then the date. */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour(s) ago`
  if (diffDays < 30) return `${diffDays} day(s) ago`
  return date.toLocaleDateString()
}

export interface AbuseReportViewProps {
  report: Loadable<AbuseReportDetail>
  /**
   * The conversation about the report, supplied by the page (`LiveComments`).
   * It brings its own card.
   */
  conversation: ReactNode
}

/* -------------------------------------------------------------------------- */
/*  Timeline                                                                   */
/* -------------------------------------------------------------------------- */

/** The colour of the step the case is at now; earlier steps stay quiet. */
const CURRENT_STEP_TONE: Record<AbuseGroup, string> = {
  waiting: "text-kumo-danger",
  open: "text-kumo-warning",
  resolved: "text-kumo-success",
  closed: "text-kumo-subtle"
}

function Timeline({ entries }: { entries: AbuseTimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-kumo-subtle">{COPY.noTimeline}</p>
  }

  return (
    <ol className="grid list-none grid-cols-1">
      {entries.map((entry, index) => {
        const label =
          ABUSE_STATUS_LABELS[entry.status] ?? `Status ${entry.status}`
        const message = TIMELINE_MESSAGES[entry.status] ?? ""
        const last = index === entries.length - 1
        return (
          <li
            key={
              entry.id ??
              `${entry.abuse_id}-${entry.status}-${entry.created_at}`
            }
            className="relative flex gap-3 pb-5 last:pb-0"
          >
            {/* The line down to the next step. */}
            {!last && (
              <span
                aria-hidden="true"
                className="absolute start-[7.5px] top-6 bottom-0.5 w-px bg-kumo-line"
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "flex h-lh shrink-0 items-center",
                last
                  ? CURRENT_STEP_TONE[abuseGroup(label, entry.status)]
                  : "text-kumo-inactive"
              )}
            >
              <CheckCircleIcon size={16} weight="fill" />
            </span>
            <div className="grid min-w-0 gap-0.5">
              <p className="font-medium">{label}</p>
              <time
                dateTime={entry.created_at}
                title={new Date(entry.created_at).toLocaleString()}
                className="text-kumo-subtle tabular-nums"
                suppressHydrationWarning
              >
                {formatRelativeTime(entry.created_at)}
              </time>
              {message && <p className="mt-1 text-kumo-subtle">{message}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* -------------------------------------------------------------------------- */
/*  Details                                                                    */
/* -------------------------------------------------------------------------- */

function DetailRow({
  label,
  children
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-kumo-subtle">{label}</dt>
      <dd className="flex min-w-0 justify-end text-end font-medium">
        {children}
      </dd>
    </div>
  )
}

/** The report's facts: shown beside the page, wherever there is room for them. */
function Details({ report }: { report: AbuseReportDetail }) {
  const t = useTranslations("account")

  return (
    <dl className="grid grid-cols-1 divide-y divide-kumo-hairline">
      <DetailRow label={t("abuse.id")}>
        <span className="font-mono text-[0.9em]">#{report.id}</span>
      </DetailRow>
      <DetailRow label={t("abuse.status")}>
        <AbuseStatusBadge
          status={report.status}
          statusCode={report.statusCode}
        />
      </DetailRow>
      {report.complainant && (
        <DetailRow label={t("abuse.complainant")}>
          <span title={report.complainant} className="truncate">
            {report.complainant}
          </span>
        </DetailRow>
      )}
      {report.cyloname && (
        <DetailRow label={COPY.appbox}>
          <span className="truncate font-mono text-[0.9em]">
            {report.cyloname}
          </span>
        </DetailRow>
      )}
      <DetailRow label={t("abuse.date")}>
        <span className="font-normal">
          <ShortDate value={report.created_at} />
        </span>
      </DetailRow>
    </dl>
  )
}

function ViewSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-8">
      <div className="flex items-start gap-4">
        <SkeletonLine className="size-14 rounded-xl" />
        <div className="grid flex-1 gap-3 pt-1">
          <SkeletonLine className="h-4 w-72 max-w-full rounded-full" />
          <SkeletonLine className="h-2.5 w-96 max-w-full rounded-full" />
        </div>
      </div>
      <SkeletonLine className="h-48 rounded-lg" />
      <SkeletonLine className="h-64 rounded-lg" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * One abuse report: how the case has moved, what was reported, any response
 * from the Appbox team and the conversation about it, down a main column. The
 * report's facts sit beside it: in the shell's right-hand column once that
 * docks, in a column of the page until then, and first on a phone.
 */
export function AbuseReportView({
  report: reportState,
  conversation
}: AbuseReportViewProps) {
  const t = useTranslations("account")

  if (reportState.status === "loading") return <ViewSkeleton />

  if (reportState.status === "error") {
    return (
      <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
        <Empty
          className={EMPTY_IN_CARD}
          icon={<FlagIcon size={40} />}
          title={COPY.loadFailedTitle}
          description={COPY.loadFailedHint}
          contents={
            <LinkButton href={kumoRoutes.abuseReports} variant="secondary">
              {COPY.backToList}
            </LinkButton>
          }
        />
      </div>
    )
  }

  const report = reportState.data
  // Oldest first, as the current page orders it.
  const timeline = [...(report.timeline ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-kumo-base text-kumo-subtle ring ring-kumo-line">
          <FlagIcon size={26} />
        </span>
        <div className="grid min-w-0 gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="min-w-0 text-2xl font-semibold break-words">
              {report.subject}
            </h1>
            <AbuseStatusBadge
              status={report.status}
              statusCode={report.statusCode}
            />
          </div>
          <p className="text-kumo-subtle">{t("abuse.detailDescription")}</p>
        </div>
      </header>

      {/* The facts sit in the shell's right-hand column once it docks. */}
      <ShellRail>
        <div className="p-4">
          <section className="rounded-lg bg-kumo-base px-4 pt-3.5 pb-2 shadow-xs ring ring-kumo-line">
            <h2 className="font-medium">{COPY.details}</h2>
            <div className="mt-1.5">
              <Details report={report} />
            </div>
          </section>
        </div>
      </ShellRail>

      {/* Until then they are a column of the page, or lead it on a small screen. */}
      {/* The second column sizes itself, so it leaves no gap once it hides. */}
      <div className="grid grid-cols-1 items-start gap-y-6 xl:grid-cols-[minmax(0,1fr)_auto]">
        <aside
          className={cn(
            "xl:sticky xl:top-0 xl:order-last xl:ms-6 xl:w-80",
            RAIL_FALLBACK
          )}
        >
          <Panel title={COPY.details}>
            <div className="-my-2">
              <Details report={report} />
            </div>
          </Panel>
        </aside>

        <div className="grid min-w-0 grid-cols-1 gap-6">
          <Panel title={COPY.timeline}>
            <Timeline entries={timeline} />
          </Panel>

          <Panel title={COPY.reportDetails}>
            <div className="grid gap-2">
              <h3 className="font-medium text-kumo-subtle">
                {t("abuse.description")}
              </h3>
              {report.description ? (
                <p className="rounded-lg bg-kumo-tint px-4 py-3 break-words whitespace-pre-wrap">
                  {report.description}
                </p>
              ) : (
                <p className="text-kumo-subtle">{COPY.noDescription}</p>
              )}
            </div>
          </Panel>

          {report.admin_response && (
            <Panel title={COPY.adminResponse}>
              <p className="break-words whitespace-pre-wrap">
                {report.admin_response}
              </p>
            </Panel>
          )}

          {conversation}
        </div>
      </div>
    </div>
  )
}
