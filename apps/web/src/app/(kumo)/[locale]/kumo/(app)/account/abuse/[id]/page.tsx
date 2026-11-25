"use client"

import { use } from "react"
import { useTranslations } from "next-intl"
import { useAbuseReport } from "@/api/account/hooks/use-account"
import { ROUTES } from "@/constants/routes"
import { useAuth } from "@/providers/auth-provider"
import { useAccountApps } from "../../../_lib/use-account-apps"
import { AbuseReportView } from "../../../../_components/account/abuse-report-view"
import { AppShell } from "../../../../_components/app-shell"
import { LiveComments } from "../../../../_components/comments/live-comments"
import { kumoRoutes } from "../../../../_components/kumo-routes"

const FALLBACK_TITLE = "Abuse report"

interface KumoAbuseReportPageProps {
  params: Promise<{ id: string; locale: string }>
}

/** Kumo prototype of one abuse report's page, on live account data. */
export default function KumoAbuseReportPage({
  params
}: KumoAbuseReportPageProps) {
  const { id } = use(params)
  const reportId = Number(id)
  const t = useTranslations("account")
  const { user, logout } = useAuth()
  const { searchGroups } = useAccountApps()
  const { data: report, isLoading, error } = useAbuseReport(reportId)

  const userName = user.alias || user.firstname || user.email

  return (
    <AppShell
      width="wide"
      title={report?.subject || FALLBACK_TITLE}
      parents={[{ label: "Abuse reports", href: kumoRoutes.abuseReports }]}
      currentDesignHref={ROUTES.ABUSE_REPORT_DETAIL(reportId)}
      user={{ name: userName, email: user.email }}
      search={searchGroups}
      onSignOut={() => void logout()}
    >
      <AbuseReportView
        report={
          isLoading
            ? { status: "loading" }
            : error || !report
              ? { status: "error" }
              : { status: "ready", data: report }
        }
        // The current page's conversation, unchanged: comments of this type
        // on the report, with no voting and no replies.
        conversation={
          <LiveComments
            commentType="abuseReportUser"
            relId={reportId}
            enableVoting={false}
            enableReplies={false}
            title={t("abuse.conversation")}
          />
        }
      />
    </AppShell>
  )
}
