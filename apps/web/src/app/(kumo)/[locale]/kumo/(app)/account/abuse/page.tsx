"use client"

import { useAbuseReports } from "@/api/account/hooks/use-account"
import { ROUTES } from "@/constants/routes"
import { useAuth } from "@/providers/auth-provider"
import { toLoadable, useAccountApps } from "../../_lib/use-account-apps"
import { AbuseReportsView } from "../../../_components/account/abuse-reports-view"
import { AppShell } from "../../../_components/app-shell"

const TITLE = "Abuse reports"

/** Kumo prototype of the abuse reports list, on live account data. */
export default function KumoAbuseReportsPage() {
  const { user, logout } = useAuth()
  const { searchGroups } = useAccountApps()
  const reports = useAbuseReports()

  const userName = user.alias || user.firstname || user.email

  return (
    <AppShell
      width="wide"
      title={TITLE}
      currentDesignHref={ROUTES.ABUSE_REPORTS}
      user={{ name: userName, email: user.email }}
      search={searchGroups}
      onSignOut={() => void logout()}
    >
      <AbuseReportsView reports={toLoadable(reports, (data) => data ?? [])} />
    </AppShell>
  )
}
