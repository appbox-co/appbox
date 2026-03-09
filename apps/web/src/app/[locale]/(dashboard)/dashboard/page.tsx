"use client"

import { useEffect, useMemo } from "react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import {
  AlertCircle,
  Bell,
  Inbox,
  Newspaper,
  Package,
  RefreshCw,
  Server,
  Sparkles
} from "lucide-react"
import {
  useNewestApps,
  useRecentlyUpdatedApps
} from "@/api/apps/hooks/use-app-store"
import { useRecentBlogPosts } from "@/api/blog/hooks/use-blog"
import { useCylosSummary } from "@/api/cylos/hooks/use-cylos"
import { useNotifications } from "@/api/notifications/hooks/use-notifications"
import type { Notification } from "@/api/notifications/notifications"
import {
  getNotificationIcon,
  getNotificationSubtext
} from "@/components/dashboard/notification-helpers"
import { useMarketingScreenshotMode } from "@/components/marketing/use-marketing-screenshot-mode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isLaunchWeekEnabled } from "@/config/launch-week-flags"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"
import { useWebSocket } from "@/providers/websocket-provider"
import { AppCardSmall } from "./_components/app-card-small"
import { RecoveryCodesWarning } from "./_components/recovery-codes-warning"
import { ServiceOverviewCard } from "./_components/service-overview-card"
import { TwoFactorPrompt } from "./_components/two-factor-prompt"

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function timeAgo(
  dateString: string,
  tc: ReturnType<typeof useTranslations<"common">>,
  locale: string
): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return tc("timeAgo.justNow")
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return tc("timeAgo.minutesAgo", { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return tc("timeAgo.hoursAgo", { count: hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return tc("timeAgo.daysAgo", { count: days })
  return new Date(dateString).toLocaleDateString(locale)
}

/* -------------------------------------------------------------------------- */
/*  Section: Loading skeleton                                                  */
/* -------------------------------------------------------------------------- */

function SectionSkeleton({
  rows = 3,
  variant = "app"
}: {
  rows?: number
  variant?: "app" | "notification"
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border bg-card p-3"
        >
          <div className="size-10 shrink-0 animate-pulse rounded-lg bg-muted" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-full animate-pulse rounded bg-muted" />
            {variant === "notification" && (
              <div className="h-2 w-1/4 animate-pulse rounded bg-muted/60" />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Section: Error state                                                       */
/* -------------------------------------------------------------------------- */

function SectionError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <AlertCircle className="size-4 shrink-0" />
      {message}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Section: Notification item                                                 */
/* -------------------------------------------------------------------------- */

function NotificationRow({ notification }: { notification: Notification }) {
  const ntc = useTranslations("common")
  const nt = useTranslations("dashboard.notifications")
  const ntLocale = useLocale()
  const subtext = getNotificationSubtext(
    nt,
    notification.type,
    notification.action
  )
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
        !notification.is_read && "bg-accent/30"
      )}
    >
      <div className="mt-0.5 shrink-0">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm",
            !notification.is_read
              ? "font-medium text-foreground"
              : "text-foreground/80"
          )}
        >
          {notification.content}
        </p>
        {subtext && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {subtext}
          </p>
        )}
        <span className="mt-0.5 block text-[10px] text-muted-foreground/70">
          {timeAgo(notification.created_at, ntc, ntLocale)}
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const t = useTranslations("dashboard")
  const tc = useTranslations("common")
  const locale = useLocale()
  const { user, isAdmin } = useAuth()
  const screenshotMode = useMarketingScreenshotMode()

  const cylosSummary = useCylosSummary()
  const visibleCylos = useMemo(
    () =>
      (cylosSummary.data ?? []).filter(
        (c) => !(screenshotMode && c.server_name.toLowerCase() === "farm")
      ),
    [cylosSummary.data, screenshotMode]
  )
  const {
    connectToServers,
    disconnectFromServer,
    subscribe,
    unsubscribe,
    sendToServer
  } = useWebSocket()

  // Mirror the appboxes page: connect to every server, subscribe to each cylo
  // channel, and request 30d stats so quota + bandwidth widgets are live.
  useEffect(() => {
    const cylos = visibleCylos
    if (!cylos?.length) return
    const servers = [
      ...new Set(cylos.map((c) => c.server_name).filter(Boolean))
    ]
    connectToServers(servers)
    cylos.forEach((c) => {
      const channel = `cylo:${c.id}`
      subscribe(channel)
      sendToServer(
        { action: "stats_range", channel, range: "30d" },
        c.server_name
      )
    })
    return () => {
      cylos.forEach((c) => unsubscribe(`cylo:${c.id}`))
      servers.forEach((name) => disconnectFromServer(name))
    }
  }, [
    visibleCylos,
    connectToServers,
    disconnectFromServer,
    subscribe,
    unsubscribe,
    sendToServer
  ])

  const notifications = useNotifications(5)
  const newestApps = useNewestApps(6)
  const recentlyUpdated = useRecentlyUpdatedApps(6)
  const blogPosts = useRecentBlogPosts(4, locale)

  const unreadNotifications = notifications.data?.items.filter(
    (n) => !n.is_read
  )

  if (!isLaunchWeekEnabled("day_1", isAdmin)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("overview.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The new dashboard experience is not available yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("overview.title")}
        </h1>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  2FA Prompt / Recovery Codes Warning                               */}
      {/* ------------------------------------------------------------------ */}
      {!user.two_factor_enabled && <TwoFactorPrompt />}
      {user.two_factor_enabled && <RecoveryCodesWarning />}

      {/* ------------------------------------------------------------------ */}
      {/*  Blog Posts                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-linear-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-sm">
            <Newspaper className="size-[18px]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">
              {t("blogPosts.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("blogPosts.description")}
            </p>
          </div>
        </div>

        {blogPosts.isLoading ? (
          <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-60 animate-pulse rounded-xl border bg-muted"
              />
            ))}
          </div>
        ) : blogPosts.error ? (
          <SectionError message={tc("errors.loadBlogFailed")} />
        ) : !blogPosts.data || blogPosts.data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <Newspaper className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {tc("empty.noBlogPosts")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
            {[...blogPosts.data]
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .map((post) => (
                <Link
                  key={post.id}
                  href={`/${locale}/blog/${post.slug}`}
                  className="card-glow group block overflow-hidden rounded-xl border border-border bg-card no-underline"
                >
                  <div className="p-6">
                    <time className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6366f1] dark:text-[#a5b4fc]">
                      {new Date(post.date).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </time>
                    <h3 className="mt-3 line-clamp-2 text-[17px] font-bold leading-[1.4] text-foreground transition-colors duration-200 group-hover:text-[#4f46e5] dark:group-hover:text-[#6366f1]">
                      {post.title}
                    </h3>
                    <p className="mt-2.5 line-clamp-3 text-sm leading-[1.65] text-muted-foreground">
                      {post.excerpt}
                    </p>
                    <span className="mt-[18px] inline-flex items-center gap-[5px] text-[13px] font-semibold text-[#6366f1] transition-colors duration-200 group-hover:text-[#4f46e5] dark:text-[#a5b4fc] dark:group-hover:text-[#6366f1]">
                      {t("blogPosts.readMore")}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      >
                        <path d="M7 17l9.2-9.2M17 17V7.8H7.8" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Service Overview                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-linear-to-br from-[#3b82f6] to-[#2563eb] text-white shadow-sm">
            <Server className="size-[18px]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">
              {t("overview.services")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("overview.servicesDescription")}
            </p>
          </div>
        </div>

        {cylosSummary.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-xl border bg-muted"
              />
            ))}
          </div>
        ) : cylosSummary.error ? (
          <SectionError message={tc("errors.loadServicesFailed")} />
        ) : visibleCylos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Server className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {tc("empty.noServices")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCylos.map((cylo) => (
              <ServiceOverviewCard
                key={cylo.id}
                cylo={cylo}
                hideCyloDefaultApps={screenshotMode}
              />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Your Updates                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-linear-to-br from-[#06b6d4] to-[#0891b2] text-white shadow-sm">
            <Bell className="size-[18px]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">
              {t("yourUpdates.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("yourUpdates.description")}
            </p>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Notifications */}
          <Card className="card-glow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex size-6 items-center justify-center rounded-md bg-amber-500/10">
                    <Bell className="size-3.5 text-amber-500 dark:text-amber-400" />
                  </div>
                  {t("notifications.title")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {notifications.isLoading ? (
                <SectionSkeleton rows={3} variant="notification" />
              ) : notifications.error ? (
                <SectionError message={tc("errors.loadNotificationsFailed")} />
              ) : !unreadNotifications || unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Inbox className="size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {t("notifications.empty")}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {unreadNotifications.slice(0, 5).map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Newest Apps */}
          <Card className="card-glow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex size-6 items-center justify-center rounded-md bg-indigo-500/10">
                    <Sparkles className="size-3.5 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  {t("newestApps.title")}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  asChild
                >
                  <Link href="/appstore">{t("newestApps.viewAll")}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {newestApps.isLoading ? (
                <SectionSkeleton rows={3} />
              ) : newestApps.error ? (
                <SectionError message={tc("errors.loadAppsFailed")} />
              ) : !newestApps.data || newestApps.data.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Package className="size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {tc("empty.noApps")}
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {newestApps.data.map((app) => (
                    <AppCardSmall key={app.id} app={app} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Updated Apps */}
          <Card className="card-glow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500/10">
                    <RefreshCw className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  {t("recentlyUpdated.title")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recentlyUpdated.isLoading ? (
                <SectionSkeleton rows={3} />
              ) : recentlyUpdated.error ? (
                <SectionError message={tc("errors.loadAppsFailed")} />
              ) : !recentlyUpdated.data || recentlyUpdated.data.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Package className="size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {tc("empty.noRecentlyUpdated")}
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {recentlyUpdated.data.map((app) => (
                    <AppCardSmall key={app.id} app={app} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
