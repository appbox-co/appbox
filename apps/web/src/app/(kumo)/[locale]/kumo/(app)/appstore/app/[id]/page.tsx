"use client"

import { Suspense, use, useState } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import {
  useAppDetail,
  useAppVersions,
  useVoteApp
} from "@/api/apps/hooks/use-app-store"
import { useInstalledApps } from "@/api/installed-apps/hooks/use-installed-apps"
import { ROUTES } from "@/constants/routes"
import { useAuth } from "@/providers/auth-provider"
import { useAccountShell } from "../../../_lib/use-account-shell"
import { useInstanceActions } from "../../../_lib/use-instance-actions"
import { AppShell } from "../../../../_components/app-shell"
import { AppDetailView } from "../../../../_components/appstore/app-detail-view"
import { Comments } from "../../../../_components/comments/comments"
import { InstallGuardsPanel } from "../../../../_components/dev/install-guards-panel"
import { InstallDialog } from "../../../../_components/install/install-dialog"
import { useMinimumPlan } from "../../../../_components/install/use-plan-restrictions"
import { kumoRoutes } from "../../../../_components/kumo-routes"
import type { Loadable } from "../../../../_components/shared"

function KumoAppDetail({ appId }: { appId: number }) {
  const t = useTranslations("appstore")
  const searchParams = useSearchParams()
  const { cylos } = useAuth()
  const { shell } = useAccountShell()

  const appQuery = useAppDetail(appId)
  const versionsQuery = useAppVersions(appId)
  const installedApps = useInstalledApps(undefined, undefined, {
    watchVmControl: true
  })
  const voteMutation = useVoteApp(appId)
  const runAction = useInstanceActions()

  const app = appQuery.data
  const minimumPlan = useMinimumPlan(app, cylos ?? [])

  // `?install=1` opens the install dialog once, as on the current app page.
  // Adjusted during render rather than in an effect, so it opens with the page.
  const [installOpen, setInstallOpen] = useState(false)
  const [autoInstallHandled, setAutoInstallHandled] = useState(false)
  if (
    !autoInstallHandled &&
    app &&
    app.enabled !== 0 &&
    searchParams.get("install") === "1"
  ) {
    setAutoInstallHandled(true)
    setInstallOpen(true)
  }

  // The detail response usually carries its versions; fall back to the list endpoint.
  const nestedVersions = app?.versions ?? []
  const versions: Loadable<NonNullable<typeof versionsQuery.data>> =
    nestedVersions.length > 0
      ? { status: "ready", data: nestedVersions }
      : versionsQuery.isLoading
        ? { status: "loading" }
        : { status: "ready", data: versionsQuery.data ?? [] }

  return (
    <AppShell
      width="wide"
      title={app?.display_name ?? t("title")}
      parents={[{ label: t("title"), href: kumoRoutes.appStore }]}
      currentDesignHref={ROUTES.APP_STORE_APP(appId)}
      {...shell}
    >
      <AppDetailView
        app={
          appQuery.isLoading
            ? { status: "loading" }
            : appQuery.error || !app
              ? { status: "error" }
              : { status: "ready", data: app }
        }
        versions={versions}
        instances={
          installedApps.isLoading
            ? { status: "loading" }
            : installedApps.error
              ? { status: "error" }
              : {
                  status: "ready",
                  data: (installedApps.data ?? []).filter(
                    (instance) => instance.app_id === appId
                  )
                }
        }
        minimumPlan={minimumPlan}
        votePending={voteMutation.isPending}
        onVote={(direction) => voteMutation.mutate(direction)}
        onInstall={() => setInstallOpen(true)}
        onInstanceAction={runAction}
        comments={app ? <Comments appId={app.id} /> : null}
      />

      {app && (
        <InstallDialog
          app={app}
          open={installOpen}
          onOpenChange={setInstallOpen}
        />
      )}

      {/* Development server only. It copies the app when it appears, so it
          waits for the app to load. */}
      {app && <InstallGuardsPanel appId={appId} />}
    </AppShell>
  )
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function KumoAppDetailPage({ params }: PageProps) {
  const { id } = use(params)

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <KumoAppDetail appId={Number(id)} />
    </Suspense>
  )
}
