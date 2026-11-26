"use client"

import { use } from "react"
import { useTranslations } from "next-intl"
import { useAbuseReport } from "@/api/account/hooks/use-account"
import { ROUTES } from "@/constants/routes"
import { useAccountShell } from "../../../_lib/use-account-shell"
import { AbuseReportView } from "../../../../_components/account/abuse-report-view"
import { AppShell } from "../../../../_components/app-shell"
import { Comments } from "../../../../_components/comments/comments"
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
  const { shell } = useAccountShell()
  const { data: report, isLoading, error } = useAbuseReport(reportId)

  return (
    <AppShell
      width="wide"
      title={report?.subject || FALLBACK_TITLE}
      parents={[{ label: "Abuse reports", href: kumoRoutes.abuseReports }]}
      currentDesignHref={ROUTES.ABUSE_REPORT_DETAIL(reportId)}
      {...shell}
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
          <Comments
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
