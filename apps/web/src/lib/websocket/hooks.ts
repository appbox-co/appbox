"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { InfiniteData } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Comment, CommentsPage } from "@/api/comments/comments"
import type { CyloDetail, CyloSummary } from "@/api/cylos/cylos"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import type { Notification } from "@/api/notifications/notifications"
import { WS_EVENTS, WS_SERVER_EVENTS } from "@/constants/events"
import { queryKeys } from "@/constants/query-keys"
import type {
  AppBoostUpdatedData,
  CommentCreatedData,
  CommentDeletedData,
  CommentUpdatedData,
  ContainerStatsUpdateData,
  MigrationProgressData,
  NotificationCreatedData,
  StatsUpdateData,
  WsMessage
} from "./types"

/**
 * Trapezoidal integration of a Mbps time series to compute total bytes
 * transferred over the series' time span.
 *
 * 1 Mbps × 1 s = 1 megabit = 125 000 bytes
 */
function integrateMbpsHistory(
  history: { timestamp: string; upload: number; download: number }[]
): { upload_bytes: number; download_bytes: number } {
  let upload = 0
  let download = 0
  for (let i = 1; i < history.length; i++) {
    const dt =
      (Date.parse(history[i].timestamp) -
        Date.parse(history[i - 1].timestamp)) /
      1000
    if (dt <= 0) continue
    upload += ((history[i].upload + history[i - 1].upload) / 2) * dt * 125_000
    download +=
      ((history[i].download + history[i - 1].download) / 2) * dt * 125_000
  }
  return {
    upload_bytes: Math.round(upload),
    download_bytes: Math.round(download)
  }
}

/** Map notification type + action to a Sonner toast variant. */
function notificationToastVariant(
  type: string,
  action: string
): "default" | "success" | "warning" | "error" {
  // Skip UI update notifications — they're internal signals, not user messages
  if (type === "UIUpdate") return "default"

  const key = `${type}.${action}`

  const errors = new Set([
    "hwfailure.newfailure",
    "criticalalert.newalert",
    "cylo.userlowquota",
    "cylo.brokenmount",
    "abuse.abuse_unresolvable",
    "abuse.abuse_user_new"
  ])
  const warnings = new Set([
    "cylo.userdecreasingquota",
    "cylo.migrating",
    "cylo.restarting",
    "instance.installing",
    "instance.removing",
    "instance.stop",
    "instance.updating",
    "throttled.throttled",
    "throttledcylo.throttled",
    "abuse.abuse_reply_admin",
    "abuse.abuse_reply_user"
  ])
  const successes = new Set([
    "instance.add",
    "instance.updated",
    "instance.start",
    "instance.restart",
    "cylo.add",
    "cylo.migrated",
    "cylo.usernormalquota",
    "cylo.adminnormalquota",
    "cylo.restarted",
    "throttled.unthrottled",
    "throttledcylo.unthrottled",
    "abuse.abuse_user_closed"
  ])

  if (errors.has(key)) return "error"
  if (warnings.has(key)) return "warning"
  if (successes.has(key)) return "success"
  return "default"
}

function showNotificationToast(notif: NotificationCreatedData) {
  if (notif.type === "UIUpdate") return

  const variant = notificationToastVariant(notif.type, notif.action)

  switch (variant) {
    case "success":
      toast.success(notif.content)
      break
    case "error":
      toast.error(notif.content)
      break
    case "warning":
      toast.warning(notif.content)
      break
    default:
      toast(notif.content)
  }
}

function shouldSuppressBoostToast(instanceId: number): boolean {
  if (typeof window === "undefined") return false

  const key = `appBoostMutation:${instanceId}`
  const raw = sessionStorage.getItem(key)
  if (!raw) return false

  const ts = Number(raw)
  if (!Number.isFinite(ts)) {
    sessionStorage.removeItem(key)
    return false
  }

  // Suppress only very recent local boost actions from this tab.
  const isRecentLocalMutation = Date.now() - ts < 15_000
  sessionStorage.removeItem(key)
  return isRecentLocalMutation
}

type WsEventCallback<T = unknown> = (data: T, message: WsMessage<T>) => void

function asCyloId(value: unknown): number | null {
  const id =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN
  return Number.isFinite(id) ? id : null
}

/**
 * Subscribe to a specific WebSocket event type.
 * The handler is called whenever a message with the matching event type arrives.
 */
export function useWsEvent<T = unknown>(
  event: string,
  handler: WsEventCallback<T>,
  wsContext?: {
    on: (event: string, handler: (msg: WsMessage) => void) => () => void
  }
) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!wsContext) return

    const unsubscribe = wsContext.on(event, (message: WsMessage) => {
      handlerRef.current(message.data as T, message as WsMessage<T>)
    })

    return unsubscribe
  }, [event, wsContext])
}

/**
 * Subscribe to a WebSocket channel (e.g., cylo:45, app:42).
 * Automatically subscribes on mount and unsubscribes on unmount.
 */
export function useWsSubscribe(
  channel: string | null,
  wsContext?: {
    subscribe: (ch: string) => void
    unsubscribe: (ch: string) => void
  }
) {
  useEffect(() => {
    if (!channel || !wsContext) return

    wsContext.subscribe(channel)
    return () => {
      wsContext.unsubscribe(channel)
    }
  }, [channel, wsContext])
}

type CommentsInfinite = InfiniteData<CommentsPage>

function addChildComment(
  list: Comment[],
  parentId: number,
  newComment: Comment
): Comment[] {
  return list.map((c) => {
    if (c.id === parentId) {
      return { ...c, children: [...c.children, newComment] }
    }
    return { ...c, children: addChildComment(c.children, parentId, newComment) }
  })
}

function patchCommentTree(
  list: Comment[],
  commentId: number,
  updater: (c: Comment) => Comment
): Comment[] {
  return list.map((c) => {
    const current = c.id === commentId ? updater(c) : c
    return {
      ...current,
      children: patchCommentTree(current.children, commentId, updater)
    }
  })
}

function removeCommentTree(list: Comment[], commentId: number): Comment[] {
  return list
    .filter((c) => c.id !== commentId)
    .map((c) => ({
      ...c,
      children: removeCommentTree(c.children, commentId)
    }))
}

/**
 * Hook that automatically invalidates TanStack Query caches based on WS events.
 * Mount once in the dashboard layout.
 */
export function useWsQueryInvalidation(wsContext?: {
  onAny: (handler: (msg: WsMessage) => void) => () => void
}) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!wsContext) return

    const unsubscribe = wsContext.onAny((message: WsMessage) => {
      const data = message.data as Record<string, unknown>

      switch (message.event) {
        case WS_EVENTS.NOTIFICATION_CREATED: {
          const notif = data as unknown as NotificationCreatedData

          // Map raw backend shape → frontend Notification and prepend to all
          // notification list queries (they share the queryKeys.notifications.all prefix).
          const mapped: Notification = {
            id: notif.id,
            user_id: notif.user_id,
            type: notif.type,
            content: notif.content,
            is_read: notif.unread === 0,
            relid: notif.relid,
            action: notif.action,
            created_at: notif.created_at
          }

          const allQueries = queryClient.getQueriesData<Notification[]>({
            queryKey: queryKeys.notifications.all
          })
          for (const [key, list] of allQueries) {
            if (Array.isArray(list)) {
              queryClient.setQueryData(key, [mapped, ...list])
            }
          }

          // Set unread count directly from the event payload
          if (typeof notif.unread_count === "number") {
            queryClient.setQueryData(queryKeys.notifications.unread, {
              count: notif.unread_count
            })
          }

          // Show a toast for the incoming notification
          showNotificationToast(notif)

          // Keep the UI in sync when an app instance changes state.
          // `relid` may arrive as a string from the backend payload.
          const relid = Number(notif.relid)
          if (
            notif.type === "instance" &&
            Number.isFinite(relid) &&
            relid > 0
          ) {
            const instanceId = relid

            if (notif.action === "installing") {
              // Install started: refresh installed-app lists so the new
              // "installing" instance appears on appbox and installed-app pages.
              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.all
              })
              queryClient.invalidateQueries({
                queryKey: ["installedApps", "cylo"]
              })
              // Slot usage is tracked on cylo summaries/details, not instance lists.
              queryClient.invalidateQueries({ queryKey: queryKeys.cylos.all })
            } else if (notif.action === "add") {
              // Install finished: refresh both instance metadata (e.g. installed date)
              // and appbox slot counters.
              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.all
              })
              queryClient.invalidateQueries({
                queryKey: ["installedApps", "cylo"]
              })
              queryClient.invalidateQueries({ queryKey: queryKeys.cylos.all })
            } else if (notif.action === "updating") {
              // Update started: refresh all installed-app list variants so
              // appbox quick-lists and detail pages show transitional state.
              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.detail(instanceId)
              })
              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.all
              })
              queryClient.invalidateQueries({
                queryKey: ["installedApps", "cylo"]
              })
            } else if (notif.action === "updated") {
              // Update finished: refresh instance and cylo-scoped app lists.
              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.detail(instanceId)
              })
              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.all
              })
              queryClient.invalidateQueries({
                queryKey: ["installedApps", "cylo"]
              })
            } else if (notif.action === "removing") {
              // Optimistically mark the app as deleting so the detail page
              // reflects the change immediately without waiting for a refetch.
              queryClient.setQueriesData<InstalledApp[] | InstalledApp>(
                { queryKey: queryKeys.installedApps.all },
                (prev) => {
                  if (!prev) return prev
                  if (Array.isArray(prev)) {
                    return prev.map((app) =>
                      app.id === instanceId
                        ? { ...app, status: "deleting" as const }
                        : app
                    )
                  }
                  return (prev as InstalledApp).id === instanceId
                    ? { ...(prev as InstalledApp), status: "deleting" as const }
                    : prev
                }
              )
            } else if (notif.action === "removed") {
              // The app has been fully removed — evict its caches so stale data
              // is not returned if the user navigates back before the redirect fires.
              queryClient.removeQueries({
                queryKey: queryKeys.installedApps.detail(instanceId)
              })
              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.all
              })
              queryClient.invalidateQueries({ queryKey: queryKeys.cylos.all })
            } else if (
              notif.action === "start" ||
              notif.action === "stop" ||
              notif.action === "restart"
            ) {
              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.detail(instanceId)
              })
              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.all
              })
              queryClient.invalidateQueries({
                queryKey: ["installedApps", "cylo"]
              })
            }

            // Admin module uses a separate query-key namespace
            queryClient.invalidateQueries({
              queryKey: ["admin", "installedApps", instanceId]
            })
            queryClient.invalidateQueries({
              queryKey: ["admin", "installedApps"]
            })
            if (
              notif.action === "installing" ||
              notif.action === "add" ||
              notif.action === "removed"
            ) {
              queryClient.invalidateQueries({
                queryKey: ["admin", "cylos"]
              })
            }
          }

          // Keep the UI in sync when the appbox state changes.
          if (notif.type === "cylo" && Number.isFinite(relid) && relid > 0) {
            const cyloId = relid
            const markMigrating = (app: InstalledApp): InstalledApp => ({
              ...app,
              status: "migrating"
            })
            const clearMigrating = (app: InstalledApp): InstalledApp => {
              if (app.status !== "migrating") return app
              return { ...app, status: "online" }
            }

            // Always refresh the appbox itself
            queryClient.invalidateQueries({
              queryKey: queryKeys.cylos.detail(cyloId)
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.cylos.all })
            // Admin module uses a separate query-key namespace
            queryClient.invalidateQueries({
              queryKey: ["admin", "cylos", cyloId]
            })
            queryClient.invalidateQueries({ queryKey: ["admin", "cylos"] })
            if (
              notif.action === "userlowquota" ||
              notif.action === "usernormalquota" ||
              notif.action === "adminlowquota" ||
              notif.action === "adminnormalquota"
            ) {
              queryClient.invalidateQueries({
                queryKey: ["admin", "lowQuota"]
              })
            }

            if (notif.action === "migrating") {
              // Optimistically mark this appbox as migrating in both summary/detail caches.
              queryClient.setQueryData<CyloDetail>(
                queryKeys.cylos.detail(cyloId),
                (prev) =>
                  prev
                    ? {
                        ...prev,
                        is_migrating: true,
                        status: "migrating"
                      }
                    : prev
              )
              queryClient.setQueriesData<CyloSummary[]>(
                { queryKey: queryKeys.cylos.all },
                (prev) =>
                  Array.isArray(prev)
                    ? prev.map((c) =>
                        c.id === cyloId
                          ? { ...c, is_migrating: true, status: "migrating" }
                          : c
                      )
                    : prev
              )

              // While migration is running, app status chips should read "migrating".
              queryClient.setQueryData<InstalledApp[]>(
                queryKeys.installedApps.byCylo(cyloId),
                (prev) => prev?.map(markMigrating)
              )
              queryClient.setQueriesData<InstalledApp[] | InstalledApp>(
                { queryKey: queryKeys.installedApps.all },
                (prev) => {
                  if (!prev) return prev
                  if (Array.isArray(prev)) {
                    return prev.map((app) =>
                      app.cylo_id === cyloId ? markMigrating(app) : app
                    )
                  }
                  return (prev as InstalledApp).cylo_id === cyloId
                    ? markMigrating(prev as InstalledApp)
                    : prev
                }
              )
            } else if (notif.action === "migrated") {
              // Migration finished: clear migration flags and refetch real statuses.
              queryClient.setQueryData<CyloDetail>(
                queryKeys.cylos.detail(cyloId),
                (prev) =>
                  prev
                    ? {
                        ...prev,
                        is_migrating: false,
                        status:
                          prev.status === "migrating" ? "online" : prev.status
                      }
                    : prev
              )
              queryClient.setQueriesData<CyloSummary[]>(
                { queryKey: queryKeys.cylos.all },
                (prev) =>
                  Array.isArray(prev)
                    ? prev.map((c) =>
                        c.id === cyloId
                          ? {
                              ...c,
                              is_migrating: false,
                              status:
                                c.status === "migrating" ? "online" : c.status
                            }
                          : c
                      )
                    : prev
              )

              queryClient.setQueryData<InstalledApp[]>(
                queryKeys.installedApps.byCylo(cyloId),
                (prev) => prev?.map(clearMigrating)
              )
              queryClient.setQueriesData<InstalledApp[] | InstalledApp>(
                { queryKey: queryKeys.installedApps.all },
                (prev) => {
                  if (!prev) return prev
                  if (Array.isArray(prev)) {
                    return prev.map((app) =>
                      app.cylo_id === cyloId ? clearMigrating(app) : app
                    )
                  }
                  return (prev as InstalledApp).cylo_id === cyloId
                    ? clearMigrating(prev as InstalledApp)
                    : prev
                }
              )

              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.byCylo(cyloId)
              })
              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.all
              })
            } else if (notif.action === "restarting") {
              // Optimistically mark the cylo as restarting
              queryClient.setQueryData<CyloDetail>(
                queryKeys.cylos.detail(cyloId),
                (prev) => (prev ? { ...prev, status: "restarting" } : prev)
              )
              queryClient.setQueriesData<CyloSummary[]>(
                { queryKey: queryKeys.cylos.all },
                (prev) =>
                  Array.isArray(prev)
                    ? prev.map((c) =>
                        c.id === cyloId ? { ...c, status: "restarting" } : c
                      )
                    : prev
              )

              // Mark every installed app on this cylo as restarting
              const markRestarting = (app: InstalledApp): InstalledApp => ({
                ...app,
                status: "restarting"
              })

              queryClient.setQueryData<InstalledApp[]>(
                queryKeys.installedApps.byCylo(cyloId),
                (prev) => prev?.map(markRestarting)
              )
              queryClient.setQueriesData<InstalledApp[] | InstalledApp>(
                { queryKey: queryKeys.installedApps.all },
                (prev) => {
                  if (!prev) return prev
                  if (Array.isArray(prev)) {
                    return prev.map((app) =>
                      app.cylo_id === cyloId ? markRestarting(app) : app
                    )
                  }
                  return (prev as InstalledApp).cylo_id === cyloId
                    ? markRestarting(prev as InstalledApp)
                    : prev
                }
              )
            } else if (notif.action === "restarted") {
              // Clear the restarting flag on the cylo
              queryClient.setQueryData<CyloDetail>(
                queryKeys.cylos.detail(cyloId),
                (prev) =>
                  prev
                    ? {
                        ...prev,
                        status:
                          prev.status === "restarting" ? "online" : prev.status
                      }
                    : prev
              )
              queryClient.setQueriesData<CyloSummary[]>(
                { queryKey: queryKeys.cylos.all },
                (prev) =>
                  Array.isArray(prev)
                    ? prev.map((c) =>
                        c.id === cyloId && c.status === "restarting"
                          ? { ...c, status: "online" }
                          : c
                      )
                    : prev
              )

              // Refetch real statuses once the restart is complete
              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.byCylo(cyloId)
              })
              queryClient.invalidateQueries({
                queryKey: queryKeys.installedApps.all
              })
            }

            if (
              notif.action === "migrating" ||
              notif.action === "migrated" ||
              notif.action === "restarted"
            ) {
              queryClient.invalidateQueries({
                queryKey: ["admin", "installedApps"]
              })
            }
            if (notif.action === "migrating" || notif.action === "migrated") {
              queryClient.invalidateQueries({
                queryKey: ["admin", "migrations"]
              })
            }
          }
          break
        }

        case WS_EVENTS.NOTIFICATION_UNREAD_COUNT:
          queryClient.setQueryData(queryKeys.notifications.unread, data)
          break

        case WS_EVENTS.MIGRATION_PROGRESS:
          {
            const cyloId = asCyloId(data.cylo_id)
            if (cyloId === null) break
            const migration = data as unknown as MigrationProgressData
            queryClient.setQueryData(
              queryKeys.migration.status(cyloId),
              migration
            )
            queryClient.setQueryData<CyloDetail>(
              queryKeys.cylos.detail(cyloId),
              (prev) => {
                if (!prev) return prev
                const nextProgress = {
                  ...(prev.migration_progress ?? {
                    phase: 0,
                    complete: 0,
                    live_migration: 0,
                    total_sent: 0,
                    pre_migration_space_used: "0",
                    reason: "",
                    ETA: "",
                    avg_speed: "",
                    old_server_name: "",
                    new_server_name: "",
                    transferred_percent: 0
                  }),
                  phase: Number(
                    migration.phase ?? prev.migration_progress?.phase ?? 0
                  ),
                  complete: Number(
                    migration.complete_percent ??
                      prev.migration_progress?.complete ??
                      0
                  ),
                  transferred_percent: Number(
                    migration.transferred_percent ??
                      prev.migration_progress?.transferred_percent ??
                      0
                  ),
                  avg_speed: String(
                    migration.avg_speed ??
                      prev.migration_progress?.avg_speed ??
                      ""
                  ),
                  ETA: String(
                    migration.ETA ?? prev.migration_progress?.ETA ?? ""
                  ),
                  total_sent: Number(
                    migration.total_sent ??
                      prev.migration_progress?.total_sent ??
                      0
                  ),
                  pre_migration_space_used: String(
                    migration.pre_migration_space_used ??
                      prev.migration_progress?.pre_migration_space_used ??
                      "0"
                  ),
                  reason: String(
                    migration.reason ?? prev.migration_progress?.reason ?? ""
                  )
                }

                return {
                  ...prev,
                  status: "migrating",
                  is_migrating: true,
                  migration_progress: nextProgress
                }
              }
            )
            queryClient.setQueriesData<CyloSummary[]>(
              { queryKey: queryKeys.cylos.all },
              (prev) =>
                prev?.map((cylo) =>
                  cylo.id === cyloId
                    ? { ...cylo, status: "migrating", is_migrating: true }
                    : cylo
                )
            )
            // Keep app status chips in sync as soon as progress starts.
            queryClient.setQueryData<InstalledApp[]>(
              queryKeys.installedApps.byCylo(cyloId),
              (prev) => prev?.map((app) => ({ ...app, status: "migrating" }))
            )
            queryClient.setQueriesData<InstalledApp[] | InstalledApp>(
              { queryKey: queryKeys.installedApps.all },
              (prev) => {
                if (!prev) return prev
                if (Array.isArray(prev)) {
                  return prev.map((app) =>
                    app.cylo_id === cyloId
                      ? { ...app, status: "migrating" }
                      : app
                  )
                }
                return (prev as InstalledApp).cylo_id === cyloId
                  ? { ...(prev as InstalledApp), status: "migrating" }
                  : prev
              }
            )
            // Admin module uses a separate query-key namespace
            queryClient.invalidateQueries({
              queryKey: ["admin", "cylos", cyloId]
            })
            queryClient.invalidateQueries({
              queryKey: ["admin", "migrations"]
            })
          }
          break

        case WS_EVENTS.MIGRATION_COMPLETED:
          {
            const cyloId = asCyloId(data.cylo_id)
            if (cyloId === null) break
            queryClient.invalidateQueries({
              queryKey: queryKeys.cylos.detail(cyloId)
            })
            queryClient.invalidateQueries({
              queryKey: queryKeys.installedApps.byCylo(cyloId)
            })
            queryClient.invalidateQueries({
              queryKey: queryKeys.installedApps.all
            })
            // Admin module uses a separate query-key namespace
            queryClient.invalidateQueries({
              queryKey: ["admin", "cylos", cyloId]
            })
            queryClient.invalidateQueries({ queryKey: ["admin", "cylos"] })
            queryClient.invalidateQueries({
              queryKey: ["admin", "installedApps"]
            })
            queryClient.invalidateQueries({
              queryKey: ["admin", "migrations"]
            })
          }
          break

        case WS_EVENTS.CYLO_QUOTA_LOW:
        case WS_EVENTS.CYLO_QUOTA_NORMAL:
        case WS_EVENTS.CYLO_THROTTLE_CHANGED:
          if (typeof data.cylo_id === "number") {
            queryClient.invalidateQueries({
              queryKey: queryKeys.cylos.detail(data.cylo_id)
            })
            queryClient.invalidateQueries({
              queryKey: queryKeys.cylos.all
            })
            // Admin module uses a separate query-key namespace
            queryClient.invalidateQueries({
              queryKey: ["admin", "cylos", data.cylo_id]
            })
            queryClient.invalidateQueries({
              queryKey: ["admin", "cylos"]
            })
            if (
              message.event === WS_EVENTS.CYLO_QUOTA_LOW ||
              message.event === WS_EVENTS.CYLO_QUOTA_NORMAL
            ) {
              queryClient.invalidateQueries({
                queryKey: ["admin", "lowQuota"]
              })
            }
            if (message.event === WS_EVENTS.CYLO_THROTTLE_CHANGED) {
              queryClient.invalidateQueries({
                queryKey: ["admin", "throttles"]
              })
            }
          }
          break

        case WS_EVENTS.APP_BOOST_UPDATED: {
          const payload = data as unknown as AppBoostUpdatedData
          const instanceId = Number(payload.instance_id)
          const cyloId = Number(payload.cylo_id)

          if (Number.isFinite(instanceId) && instanceId > 0) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.installedApps.detail(instanceId)
            })
          }

          queryClient.invalidateQueries({
            queryKey: queryKeys.installedApps.all
          })

          if (Number.isFinite(cyloId) && cyloId > 0) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.installedApps.byCylo(cyloId)
            })
            queryClient.invalidateQueries({
              queryKey: queryKeys.cylos.detail(cyloId)
            })
          }

          queryClient.invalidateQueries({ queryKey: queryKeys.cylos.all })

          // Admin module uses a separate query-key namespace
          queryClient.invalidateQueries({
            queryKey: ["admin", "installedApps"]
          })
          queryClient.invalidateQueries({ queryKey: ["admin", "cylos"] })

          if (
            Number.isFinite(instanceId) &&
            instanceId > 0 &&
            !shouldSuppressBoostToast(instanceId)
          ) {
            toast("App boost settings were updated in another session.")
          }
          break
        }

        case WS_EVENTS.COMMENT_CREATED: {
          queryClient.invalidateQueries({ queryKey: ["admin", "comments"] })
          const c = data as unknown as CommentCreatedData & { relid?: number }
          if (typeof c.type === "string" && typeof c.relid === "number") {
            queryClient.invalidateQueries({
              queryKey: queryKeys.comments.byType(c.type, c.relid)
            })
            break
          }
          if (typeof c.app_id !== "number") break

          const newComment: Comment = {
            id: c.id,
            parent_id: c.parent_id,
            user_id: c.user_id ?? 0,
            app_id: c.app_id,
            comment: c.comment,
            rating: c.rating,
            alias: c.alias,
            is_admin: c.is_admin,
            children: [],
            created_at: c.created_at,
            updated_at: c.updated_at
          }

          queryClient.setQueryData<CommentsInfinite>(
            queryKeys.comments.byApp(c.app_id),
            (prev) => {
              if (!prev) return prev
              return {
                ...prev,
                pages: prev.pages.map((page, pageIndex) => {
                  if (c.parent_id) {
                    return {
                      ...page,
                      items: addChildComment(
                        page.items,
                        c.parent_id,
                        newComment
                      )
                    }
                  }
                  if (pageIndex === 0) {
                    return {
                      ...page,
                      items: [newComment, ...page.items],
                      totalComments: page.totalComments + 1
                    }
                  }
                  return page
                })
              }
            }
          )
          break
        }

        case WS_EVENTS.COMMENT_UPDATED: {
          queryClient.invalidateQueries({ queryKey: ["admin", "comments"] })
          const cu = data as unknown as CommentUpdatedData & { relid?: number }
          if (typeof cu.type === "string" && typeof cu.relid === "number") {
            queryClient.invalidateQueries({
              queryKey: queryKeys.comments.byType(cu.type, cu.relid)
            })
            break
          }
          if (typeof cu.app_id !== "number") break

          queryClient.setQueryData<CommentsInfinite>(
            queryKeys.comments.byApp(cu.app_id),
            (prev) => {
              if (!prev) return prev
              return {
                ...prev,
                pages: prev.pages.map((page) => ({
                  ...page,
                  items: patchCommentTree(
                    page.items,
                    cu.comment_id,
                    (comment) => ({
                      ...comment,
                      comment: cu.comment,
                      updated_at: cu.updated_at
                    })
                  )
                }))
              }
            }
          )
          break
        }

        case WS_EVENTS.COMMENT_DELETED: {
          queryClient.invalidateQueries({ queryKey: ["admin", "comments"] })
          const cd = data as unknown as CommentDeletedData & { relid?: number }
          if (typeof cd.type === "string" && typeof cd.relid === "number") {
            queryClient.invalidateQueries({
              queryKey: queryKeys.comments.byType(cd.type, cd.relid)
            })
            break
          }
          if (typeof cd.app_id !== "number") break

          queryClient.setQueryData<CommentsInfinite>(
            queryKeys.comments.byApp(cd.app_id),
            (prev) => {
              if (!prev) return prev
              return {
                ...prev,
                pages: prev.pages.map((page, pageIndex) => ({
                  ...page,
                  items: removeCommentTree(page.items, cd.comment_id),
                  totalComments:
                    pageIndex === 0
                      ? Math.max(0, page.totalComments - 1)
                      : page.totalComments
                }))
              }
            }
          )
          break
        }

        case WS_EVENTS.COMMENT_VOTED: {
          queryClient.invalidateQueries({ queryKey: ["admin", "comments"] })
          const cv = data as { app_id?: number; type?: string; relid?: number }
          if (typeof cv.type === "string" && typeof cv.relid === "number") {
            queryClient.invalidateQueries({
              queryKey: queryKeys.comments.byType(cv.type, cv.relid)
            })
            break
          }
          if (typeof cv.app_id === "number") {
            queryClient.invalidateQueries({
              queryKey: queryKeys.comments.byApp(cv.app_id)
            })
          }
          break
        }

        case WS_SERVER_EVENTS.INSTANCE_STATE:
          if (typeof data.instance_id === "number") {
            queryClient.invalidateQueries({
              queryKey: queryKeys.installedApps.detail(data.instance_id)
            })
            queryClient.invalidateQueries({
              queryKey: ["admin", "installedApps", data.instance_id]
            })
          }
          break

        case WS_SERVER_EVENTS.JOB_STARTED: {
          const jobId = data.job_id != null ? Number(data.job_id) : NaN
          const instanceId =
            data.instance_id != null ? Number(data.instance_id) : NaN
          const cyloId = data.cylo_id != null ? Number(data.cylo_id) : NaN
          if (!isNaN(jobId)) {
            queryClient.setQueryData(queryKeys.jobs.detail(jobId), data)
          }
          if (!isNaN(instanceId)) {
            queryClient.setQueryData(
              queryKeys.jobs.byInstance(instanceId),
              data
            )
            // Keep app status lists fresh even when no notification event is emitted.
            queryClient.invalidateQueries({
              queryKey: queryKeys.installedApps.detail(instanceId)
            })
            queryClient.invalidateQueries({
              queryKey: queryKeys.installedApps.all
            })
            queryClient.invalidateQueries({
              queryKey: ["installedApps", "cylo"]
            })
            // Admin module uses a separate query-key namespace
            queryClient.invalidateQueries({
              queryKey: ["admin", "installedApps"]
            })
          }
          if (!isNaN(cyloId)) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.cylos.detail(cyloId)
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.cylos.all })
            queryClient.invalidateQueries({
              queryKey: ["admin", "cylos"]
            })
          }
          break
        }

        case WS_SERVER_EVENTS.JOB_PROGRESS: {
          const jobId = data.job_id != null ? Number(data.job_id) : NaN
          const instanceId =
            data.instance_id != null ? Number(data.instance_id) : NaN
          if (!isNaN(jobId)) {
            queryClient.setQueryData(queryKeys.jobs.detail(jobId), data)
          }
          if (!isNaN(instanceId)) {
            queryClient.setQueryData(
              queryKeys.jobs.byInstance(instanceId),
              data
            )
          }
          break
        }

        case WS_SERVER_EVENTS.JOB_COMPLETED:
        case WS_SERVER_EVENTS.JOB_FAILED: {
          const instanceId =
            data.instance_id != null ? Number(data.instance_id) : NaN
          if (!isNaN(instanceId)) {
            queryClient.removeQueries({
              queryKey: queryKeys.jobs.byInstance(instanceId)
            })
            queryClient.invalidateQueries({
              queryKey: queryKeys.installedApps.detail(instanceId)
            })
            // Admin module uses a separate query-key namespace
            queryClient.invalidateQueries({
              queryKey: ["admin", "installedApps", instanceId]
            })
          }
          break
        }

        case WS_SERVER_EVENTS.STATS_UPDATE: {
          const stats = data as unknown as StatsUpdateData
          if (typeof stats.cylo_id !== "number") break

          const historyPayload = {
            disk_history: stats.disk_history,
            diskio_history: stats.diskio_history,
            network_history: stats.network_history
          }

          // Cache key includes the range: ["cylos", id, "stats", range]
          // (used by the detail-page charts that let the user pick a range)
          queryClient.setQueryData(
            [...queryKeys.cylos.stats(stats.cylo_id), stats.range],
            historyPayload
          )

          // Also write to the range-agnostic "latest" key so sparkline
          // mini-charts always have data regardless of which range arrives
          // first.  Guard: only overwrite when the incoming payload has at
          // least as many data points as what's cached — prevents a short
          // "24h" re-push from wiping out a "30d" dataset already stored.
          const existingStats = queryClient.getQueryData<{
            network_history?: unknown[]
          }>(queryKeys.cylos.stats(stats.cylo_id))
          const cachedPoints = existingStats?.network_history?.length ?? 0
          const incomingPoints = stats.network_history?.length ?? 0
          if (incomingPoints >= cachedPoints) {
            queryClient.setQueryData(
              queryKeys.cylos.stats(stats.cylo_id),
              historyPayload
            )
          }

          // Update bandwidth cache. Prefer the 30-day INTEGRAL totals from the
          // backend when non-zero. Guard against overwriting good cached data
          // with zeros, which happens when the INTEGRAL query returns no rows
          // (e.g. the net_93d RP hasn't populated yet for this cylo).
          if (stats.upload_total_bytes > 0 || stats.download_total_bytes > 0) {
            queryClient.setQueryData(queryKeys.cylos.bandwidth(stats.cylo_id), {
              upload_bytes: stats.upload_total_bytes,
              download_bytes: stats.download_total_bytes
            })
          } else {
            // Fallback: integrate the Mbps time series that's already in the
            // payload. This covers the case where the INTEGRAL query returns
            // nothing but the chart data is perfectly valid.
            const bw = integrateMbpsHistory(stats.network_history)
            if (bw.upload_bytes > 0 || bw.download_bytes > 0) {
              // Only write if the cache doesn't already have better (non-zero) data
              const existing = queryClient.getQueryData<{
                upload_bytes: number
                download_bytes: number
              }>(queryKeys.cylos.bandwidth(stats.cylo_id))
              if (
                !existing ||
                (existing.upload_bytes === 0 && existing.download_bytes === 0)
              ) {
                queryClient.setQueryData(
                  queryKeys.cylos.bandwidth(stats.cylo_id),
                  bw
                )
              }
            }
          }
          break
        }

        case WS_SERVER_EVENTS.CONTAINER_STATS_UPDATE: {
          const stats = data as unknown as ContainerStatsUpdateData
          if (typeof stats.instance_id !== "number") break

          // Cache keyed by instance + range so the UI can switch ranges
          queryClient.setQueryData(
            [
              ...queryKeys.installedApps.containerStats(stats.instance_id),
              stats.range
            ],
            {
              cpu_history: stats.cpu_history,
              mem_history: stats.mem_history,
              diskio_history: stats.diskio_history,
              network_history: stats.network_history
            }
          )
          break
        }

        case WS_SERVER_EVENTS.QUOTA_UPDATE:
          if (typeof data.cylo_id === "number") {
            queryClient.setQueryData(queryKeys.cylos.quota(data.cylo_id), {
              used_gb: data.used_gb as number
            })
          }
          break
      }
    })

    return unsubscribe
  }, [wsContext, queryClient])
}
