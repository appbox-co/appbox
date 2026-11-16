"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Select } from "@cloudflare/kumo"
import type { AbuseReportDetail } from "@/api/account/account"
import type { Comment, CommentSortOrder } from "@/api/comments/comments"
import { ROUTES } from "@/constants/routes"
import { usePathname, useRouter } from "@/i18n/routing"
import { AbuseReportView } from "../../../../_components/account/abuse-report-view"
import { AppShell } from "../../../../_components/app-shell"
import { CommentsView } from "../../../../_components/comments/comments-view"
import { demoCommentsViewer } from "../../../../_components/comments/fixtures"
import { kumoRoutes } from "../../../../_components/kumo-routes"
import { buildSearchGroups } from "../../../../_components/quick-search"
import type { Loadable } from "../../../../_components/shared"
import { appsByCylo, cylos, demoUser } from "../../../fixtures"
import {
  SAMPLE_AUTHOR,
  sampleAbuseReport,
  sampleConversation
} from "../sample-reports"

/** States the page has to handle that the sample data does not otherwise reach. */
const STATES = [
  { value: "normal", label: "As reported" },
  { value: "loading", label: "Loading" },
  { value: "error", label: "Failed to load" }
] as const

type SampleState = (typeof STATES)[number]["value"]

/** The abuse report conversation takes long messages, as on live data. */
const MAX_LENGTH = 10000

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * One abuse report on sample data. Posting, editing and deleting in the
 * conversation change local state only; nothing is sent anywhere.
 */
export function DemoAbuseReport({ id }: { id: number }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [comments, setComments] = useState<Comment[]>(() =>
    sampleConversation(id)
  )
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>("rating")

  const requested = searchParams.get("state")
  const state: SampleState =
    STATES.find((entry) => entry.value === requested)?.value ?? "normal"

  const sample = sampleAbuseReport(id)
  const report: Loadable<AbuseReportDetail> =
    state === "loading"
      ? { status: "loading" }
      : state === "error" || !sample
        ? { status: "error" }
        : { status: "ready", data: sample }

  return (
    <AppShell
      demo
      width="wide"
      title={sample?.subject ?? "Abuse report"}
      parents={[
        { label: "Abuse reports", href: kumoRoutes(true).abuseReports }
      ]}
      currentDesignHref={ROUTES.ABUSE_REPORT_DETAIL(id)}
      user={demoUser}
      search={buildSearchGroups(cylos, appsByCylo, true)}
    >
      <div className="grid grid-cols-1 gap-6">
        {/* Sample page only: a way to see the states real data rarely shows. */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-kumo-line px-4 py-2.5">
          <span className="text-kumo-subtle">Sample state</span>
          <Select
            aria-label="Sample state"
            size="sm"
            className="w-52"
            value={state}
            onValueChange={(value) =>
              router.replace(
                value && value !== "normal"
                  ? `${pathname}?state=${String(value)}`
                  : pathname
              )
            }
            renderValue={(value) =>
              STATES.find((entry) => entry.value === value)?.label
            }
          >
            {STATES.map((entry) => (
              <Select.Option key={entry.value} value={entry.value}>
                {entry.label}
              </Select.Option>
            ))}
          </Select>
        </div>

        <AbuseReportView
          report={report}
          conversation={
            <CommentsView
              comments={{
                status: "ready",
                data: { items: comments, total: comments.length }
              }}
              currentUser={demoCommentsViewer}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              // Pretend each request takes a moment, then apply it here.
              onPost={async ({ comment }) => {
                await wait(500)
                const now = new Date().toISOString()
                setComments((current) => [
                  ...current,
                  {
                    id: Date.now(),
                    parent_id: null,
                    app_id: id,
                    comment,
                    rating: 0,
                    children: [],
                    created_at: now,
                    updated_at: now,
                    ...SAMPLE_AUTHOR
                  }
                ])
              }}
              onEdit={async (commentId, comment) => {
                await wait(400)
                setComments((current) =>
                  current.map((entry) =>
                    entry.id === commentId ? { ...entry, comment } : entry
                  )
                )
              }}
              onDelete={async (commentId) => {
                await wait(400)
                setComments((current) =>
                  current.filter((entry) => entry.id !== commentId)
                )
              }}
              onVote={() => {}}
              title="Conversation"
              enableVoting={false}
              enableReplies={false}
              maxLength={MAX_LENGTH}
            />
          }
        />
      </div>
    </AppShell>
  )
}
