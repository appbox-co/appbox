"use client"

import { useAbuseReports } from "@/api/account/hooks/use-account"
import { ROUTES } from "@/constants/routes"
import { toLoadable } from "../../_lib/use-account-apps"
import { useAccountShell } from "../../_lib/use-account-shell"
import { AbuseReportsView } from "../../../_components/account/abuse-reports-view"
import { AppShell } from "../../../_components/app-shell"

const TITLE = "Abuse reports"

/** Kumo prototype of the abuse reports list, on live account data. */
export default function KumoAbuseReportsPage() {
  const { shell } = useAccountShell()
  const reports = useAbuseReports()

  return (
    <AppShell
      width="wide"
      title={TITLE}
      currentDesignHref={ROUTES.ABUSE_REPORTS}
      {...shell}
    >
      <AbuseReportsView reports={toLoadable(reports, (data) => data ?? [])} />
    </AppShell>
  )
}
