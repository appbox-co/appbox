"use client"

import { useMemo, useState } from "react"
import type { AppStoreItem } from "@/api/apps/app-store"
import type { CommentSortOrder } from "@/api/comments/comments"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { ROUTES } from "@/constants/routes"
import { DemoSession } from "../../../_lib/demo-session"
import { AppDetailView } from "../../../../_components/app-detail-view"
import type { InstanceAction } from "../../../../_components/app-instances"
import { AppShell } from "../../../../_components/app-shell"
import { CommentsView } from "../../../../_components/comments/comments-view"
import {
  demoComments,
  demoCommentsViewer,
  demoCommentTotal
} from "../../../../_components/comments/fixtures"
import {
  InstallGuardsPanel,
  type GuardTarget
} from "../../../../_components/dev/install-guards-panel"
import { InstallDialog } from "../../../../_components/install/install-dialog"
import { kumoRoutes } from "../../../../_components/kumo-routes"
import { buildSearchGroups } from "../../../../_components/quick-search"
import {
  appsByCylo,
  cylos,
  demoAppDetail,
  demoInstances,
  demoUser,
  demoVersions,
  RESULTING_STATUS
} from "../../../fixtures"

/** The sample app carrying its versions, as the live detail response does. */
function sampleApp(id: number): AppStoreItem | undefined {
  const app = demoAppDetail(id)
  return app && { ...app, versions: demoVersions(app) }
}

/** Same arithmetic as the live vote mutation's optimistic update. */
function applyVote(
  app: AppStoreItem,
  direction: "up" | "down" | null
): AppStoreItem {
  let { upvotes, downvotes } = app
  if (app.uservote === 1) upvotes -= 1
  if (app.uservote === 0) downvotes -= 1
  if (direction === "up") upvotes += 1
  if (direction === "down") downvotes += 1
  return {
    ...app,
    upvotes,
    downvotes,
    uservote: direction === "up" ? 1 : direction === "down" ? 0 : null
  }
}

export function DemoAppDetail({ id }: { id: number }) {
  const [app, setApp] = useState(() => sampleApp(id))
  const [instances, setInstances] = useState<InstalledApp[]>(() =>
    app ? demoInstances(app) : []
  )
  const [installOpen, setInstallOpen] = useState(false)
  const [commentSort, setCommentSort] = useState<CommentSortOrder>("rating")
  const routes = kumoRoutes(true)
  // The developer panel overrides the app held in state above, and gets the
  // sample back when it resets.
  const guardTarget = useMemo<GuardTarget>(
    () => ({
      read: () => sampleApp(id),
      write: setApp,
      reload: async () => {
        const fresh = sampleApp(id)
        setApp(fresh)
        return fresh
      }
    }),
    [id]
  )
  // An app nobody has installed also has no comments, to show both empty states.
  const hasComments = instances.length > 0

  // Pretend the request takes a moment, then show the state it would lead to.
  const runAction = async (action: InstanceAction, ids: number[]) => {
    await new Promise((resolve) => setTimeout(resolve, 700))
    setInstances((current) =>
      current.map((instance) =>
        ids.includes(instance.id)
          ? { ...instance, status: RESULTING_STATUS[action] }
          : instance
      )
    )
  }

  return (
    <AppShell
      demo
      width="wide"
      title={app?.display_name ?? "App"}
      parents={[{ label: "App Store", href: routes.appStore }]}
      currentDesignHref={ROUTES.APP_STORE_APP(id)}
      user={demoUser}
      search={buildSearchGroups(cylos, appsByCylo, true)}
    >
      <AppDetailView
        app={app ? { status: "ready", data: app } : { status: "error" }}
        versions={{ status: "ready", data: app ? demoVersions(app) : [] }}
        instances={{ status: "ready", data: instances }}
        // Shown on one app so the restricted-plan state can be seen.
        minimumPlan={
          app?.display_name === "Windows 11 Pro VPS"
            ? { name: "Pro", upgradeUrl: "https://billing.appbox.co" }
            : null
        }
        onVote={(direction) =>
          setApp((current) => current && applyVote(current, direction))
        }
        onInstall={() => setInstallOpen(true)}
        onInstanceAction={runAction}
        // Sample comments are read-only: posting, editing and voting do nothing.
        comments={
          <CommentsView
            comments={{
              status: "ready",
              data: hasComments
                ? { items: demoComments, total: demoCommentTotal }
                : { items: [], total: 0 }
            }}
            currentUser={demoCommentsViewer}
            sortOrder={commentSort}
            onSortChange={setCommentSort}
            onPost={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onVote={() => {}}
          />
        }
      />

      {/* The real install dialog, fed sample data. The session's fetch guard
          keeps every request it makes away from the real API. */}
      <DemoSession>
        {app && (
          <InstallDialog
            app={app}
            open={installOpen}
            onOpenChange={setInstallOpen}
          />
        )}
      </DemoSession>

      {/* Every state the install dialog guards against, on sample data. The
          flags are kept in the browser under the app's id, where the dialog
          reads them, so they also apply to the real app with that id. */}
      {app && (
        <InstallGuardsPanel
          appId={id}
          target={guardTarget}
          role="user"
          appboxCount={cylos.length}
        />
      )}
    </AppShell>
  )
}
