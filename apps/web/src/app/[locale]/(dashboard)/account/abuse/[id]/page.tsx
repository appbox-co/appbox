"use client"

import { use, useMemo } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  User
} from "lucide-react"
import { ABUSE_STATUS_LABELS } from "@/api/account/account"
import { useAbuseReport } from "@/api/account/hooks/use-account"
import { Comments } from "@/components/dashboard/comments"
import { HistoryBackButton } from "@/components/dashboard/navigation/history-back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

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

/* -------------------------------------------------------------------------- */
/*  Status badge (same colors as list page)                                    */
/* -------------------------------------------------------------------------- */

const statusCodeStyles: Record<number, string> = {
  [-1]: "border-blue-500/25 bg-blue-500/15 text-blue-700 dark:text-blue-400",
  0: "border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  1: "border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-400",
  2: "border-slate-500/25 bg-slate-500/15 text-slate-700 dark:text-slate-400",
  3: "border-slate-500/25 bg-slate-500/15 text-slate-700 dark:text-slate-400",
  4: "border-slate-500/25 bg-slate-500/15 text-slate-700 dark:text-slate-400",
  5: "border-orange-500/25 bg-orange-500/15 text-orange-700 dark:text-orange-400",
  6: "border-orange-500/25 bg-orange-500/15 text-orange-700 dark:text-orange-400",
  7: "border-cyan-500/25 bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  8: "border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  9: "border-orange-500/25 bg-orange-500/15 text-orange-700 dark:text-orange-400",
  10: "border-orange-500/25 bg-orange-500/15 text-orange-700 dark:text-orange-400",
  11: "border-orange-500/25 bg-orange-500/15 text-orange-700 dark:text-orange-400",
  12: "border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
}

const defaultStatusStyle =
  "border-zinc-500/25 bg-zinc-500/15 text-zinc-700 dark:text-zinc-400"

function AbuseStatusBadge({
  status,
  statusCode
}: {
  status: string
  statusCode: number
}) {
  const style =
    statusCodeStyles[statusCode] ??
    (status.toLowerCase().includes("waiting")
      ? statusCodeStyles[1]
      : defaultStatusStyle)

  return (
    <Badge variant="outline" className={cn("font-medium", style)}>
      {status}
    </Badge>
  )
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                           */
/* -------------------------------------------------------------------------- */

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-[300px] animate-pulse rounded-xl border bg-muted" />
      <div className="h-[200px] animate-pulse rounded-xl border bg-muted" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                  */
/* -------------------------------------------------------------------------- */

interface AbuseReportDetailPageProps {
  params: Promise<{ id: string; locale: string }>
}

export default function AbuseReportDetailPage({
  params
}: AbuseReportDetailPageProps) {
  const { id } = use(params)
  const reportId = Number(id)
  const t = useTranslations("account")
  const { data: report, isLoading, error } = useAbuseReport(reportId)
  const sortedTimeline = useMemo(() => {
    const list = report?.timeline ?? []
    return [...list].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [report?.timeline])

  if (isLoading) return <DetailSkeleton />

  if (error || !report) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="gap-1.5" asChild>
          <Link href={ROUTES.ABUSE_REPORTS}>
            <ArrowLeft className="size-4" />
            {t("abuse.backToList")}
          </Link>
        </Button>
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          Failed to load abuse report.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <HistoryBackButton
        fallbackHref={ROUTES.ABUSE_REPORTS}
        fallbackLabel={t("abuse.backToList")}
        currentLabel={report.subject}
        className="gap-1.5"
      />

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{report.subject}</h1>
        <AbuseStatusBadge
          status={report.status}
          statusCode={report.statusCode}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-muted-foreground" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineList timeline={sortedTimeline} />
        </CardContent>
      </Card>

      {/* Report info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("abuse.reportDetails")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {t("abuse.id")}
              </p>
              <p className="font-mono text-sm">#{report.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {t("abuse.status")}
              </p>
              <AbuseStatusBadge
                status={report.status}
                statusCode={report.statusCode}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {t("abuse.complainant")}
              </p>
              <div className="flex items-center gap-1.5 text-sm">
                <User className="size-3.5 text-muted-foreground" />
                {report.complainant}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {t("abuse.date")}
              </p>
              <div className="flex items-center gap-1.5 text-sm">
                <Calendar className="size-3.5 text-muted-foreground" />
                {new Date(report.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("abuse.description")}
            </p>
            <div className="rounded-lg border bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {report.description}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin response card */}
      {report.admin_response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4 text-muted-foreground" />
              {t("abuse.adminResponse")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {report.admin_response}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation: reuse shared Comments with type=abuseReportUser, no voting/replies */}
      <Comments
        commentType="abuseReportUser"
        relId={reportId}
        enableVoting={false}
        enableReplies={false}
        title={t("abuse.conversation")}
      />
    </div>
  )
}

function TimelineList({
  timeline
}: {
  timeline: {
    id?: number
    abuse_id: number
    status: number
    created_at: string
  }[]
}) {
  if (timeline.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No timeline entries yet.</p>
    )
  }
  return (
    <ul className="space-y-4">
      {timeline.map((entry) => {
        const label =
          ABUSE_STATUS_LABELS[entry.status] ?? `Status ${entry.status}`
        const message = TIMELINE_MESSAGES[entry.status] ?? ""
        return (
          <li
            key={
              entry.id ??
              `${entry.abuse_id}-${entry.status}-${entry.created_at}`
            }
          >
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <CheckCircle2 className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(entry.created_at)}
                </p>
                {message && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {message}
                  </p>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
