"use client"

import { use, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2
} from "lucide-react"
import {
  ABUSE_STATUS_LABELS,
  getAbuseReportWithToken,
  resolveAbuseReportWithToken,
  type AbuseReportDetail,
  type AbuseTimelineEntry
} from "@/api/account/account"
import { Comments } from "@/components/dashboard/comments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

/* -------------------------------------------------------------------------- */
/*  Complainant resolve button: label and enabled per status                  */
/* -------------------------------------------------------------------------- */

const COMPLAINANT_RESOLVE_LABELS: Record<number, string> = {
  [-1]: "New complaint",
  0: "Closed by user",
  1: "Resolve",
  2: "Resolved automatically",
  3: "Files not found",
  4: "Appbox no longer exists",
  5: "Awaiting investigation",
  6: "Awaiting investigation",
  7: "Searching for data",
  8: "Resolved by team member",
  9: "Awaiting investigation",
  10: "Awaiting investigation",
  11: "Awaiting investigation",
  12: "Closed by complainant"
}

/** Complainant can only click resolve when status is 1 (waiting for response). */
function canComplainantResolve(statusCode: number): boolean {
  return statusCode === 1
}

/* -------------------------------------------------------------------------- */
/*  Timeline body messages (complainant-facing)                                */
/* -------------------------------------------------------------------------- */

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
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

interface AbuseComplainantPageProps {
  params: Promise<{ id: string; locale: string }>
}

export default function AbuseComplainantPage({
  params
}: AbuseComplainantPageProps) {
  const { id: idParam } = use(params)
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const reportIdOrIspId = idParam
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const {
    data: report,
    isLoading,
    error
  } = useQuery({
    queryKey: ["abuseReports", "complainant", reportIdOrIspId, token],
    queryFn: () => getAbuseReportWithToken(reportIdOrIspId, token),
    enabled: reportIdOrIspId.length > 0 && token.length > 0
  })

  const resolveMutation = useMutation({
    mutationFn: () => resolveAbuseReportWithToken(reportIdOrIspId, token),
    onSuccess: () => {
      setConfirmOpen(false)
      queryClient.invalidateQueries({
        queryKey: ["abuseReports", "complainant", reportIdOrIspId, token]
      })
    }
  })

  const sortedTimeline = useMemo(() => {
    const list = report?.timeline ?? []
    return [...list].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [report?.timeline])

  const resolveLabel = report
    ? (COMPLAINANT_RESOLVE_LABELS[report.statusCode] ?? report.status)
    : ""
  const resolveEnabled = report
    ? canComplainantResolve(report.statusCode)
    : false

  if (!token) {
    return (
      <div className="container max-w-2xl py-12 text-center">
        <AlertCircle className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Invalid or missing link</h1>
        <p className="mt-2 text-muted-foreground">
          This page requires a valid token from your abuse report email. Please
          use the link from the email we sent you.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container flex max-w-4xl justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="container max-w-2xl py-12 text-center">
        <AlertCircle className="mx-auto size-12 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">Report not found</h1>
        <p className="mt-2 text-muted-foreground">
          This report may be invalid or the link has expired.
        </p>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Abuse Report</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column: intro + resolve, summary, communication */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Abuse Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Thank you for submitting a notification with Appbox&apos;s
                automated Abuse Prevention tool. We will proceed to process it
                now. You can track the status of your notification anytime by
                visiting this page.
              </p>
              <p>
                Please use the comments section below to submit an update or
                provide further information if needed.
              </p>
              <p>
                For further information, please visit{" "}
                <a
                  href="https://www.appbox.co/policies/content-abuse-policy"
                  className="text-primary underline underline-offset-2"
                >
                  https://www.appbox.co/policies/content-abuse-policy
                </a>
                . This page also describes Appbox&apos;s requirements for abuse
                notifications.
              </p>
              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={!resolveEnabled}
                  variant={resolveEnabled ? "default" : "secondary"}
                >
                  {resolveLabel}
                </Button>
              </div>
            </CardContent>
          </Card>

          <SummaryCard report={report} />
          <Comments
            commentType="abuseReportComplainant"
            relId={report.id}
            enableVoting={false}
            enableReplies={false}
            title="Communication"
            authToken={token}
          />
        </div>

        {/* Right column: full report + timeline */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" />
                Full Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {report.description}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineList timeline={sortedTimeline} />
            </CardContent>
          </Card>
        </div>
      </div>

      <ResolveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => resolveMutation.mutate()}
        isSubmitting={resolveMutation.isPending}
      />
    </div>
  )
}

function SummaryCard({ report }: { report: AbuseReportDetail }) {
  const rows = [
    { label: "Report ID", value: String(report.isp_id ?? report.id) },
    {
      label: "Alleged date",
      value: report.timestamp
        ? new Date(report.timestamp).toLocaleDateString()
        : "—"
    },
    { label: "Notifier", value: report.complainant || "—" },
    { label: "Subject", value: report.subject || "—" },
    { label: "IP", value: report.ip ?? "—" },
    { label: "Port", value: report.port != null ? String(report.port) : "—" },
    { label: "Filename", value: report.filename ?? "—" }
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {rows.map(({ label, value }) => (
            <div key={label}>
              <dt className="font-medium text-muted-foreground">{label}</dt>
              <dd className="mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function TimelineList({ timeline }: { timeline: AbuseTimelineEntry[] }) {
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

function ResolveDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isSubmitting: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve abuse report?</DialogTitle>
          <DialogDescription>
            Are you sure you&apos;d like to resolve and close this case?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
