"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react"
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount
} from "@/api/notifications/hooks/use-notifications"
import type { Notification } from "@/api/notifications/notifications"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { WS_EVENTS } from "@/constants/events"
import { queryKeys } from "@/constants/query-keys"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { useWsEvent } from "@/lib/websocket/hooks"
import { useWebSocket } from "@/providers/websocket-provider"
import {
  getNotificationIcon,
  getNotificationSubtext
} from "./notification-helpers"

/** Map a notification type + action to a destination route. Returns null for
 *  notification types that don't have a navigable destination. */
function getNotificationRoute(notification: Notification): string | null {
  const { type, action, relid } = notification

  if (type === "instance") {
    return ROUTES.INSTALLED_APP_DETAIL(relid)
  }
  if (type === "cylo") {
    if (action === "adminlowquota" || action === "brokenmount") {
      // Admin-only view — fall back to appbox detail for regular users
      return ROUTES.APPBOX_DETAIL(relid)
    }
    return ROUTES.APPBOX_DETAIL(relid)
  }
  if (type === "throttled" || type === "throttledcylo") {
    return ROUTES.APPBOX_DETAIL(relid)
  }
  if (type === "abuse") {
    if (action === "abuse_unresolvable" || action === "abuse_reply_admin") {
      return ROUTES.ABUSE_REPORT_DETAIL(relid)
    }
    if (
      action === "abuse_user_new" ||
      action === "abuse_user_closed" ||
      action === "abuse_reply_user"
    ) {
      return ROUTES.ABUSE_REPORT_DETAIL(relid)
    }
  }
  if (type === "hwfailure") {
    return ROUTES.APPBOXES
  }
  if (type === "criticalalert") {
    return ROUTES.DASHBOARD
  }
  return null
}

const PAGE_SIZE = 20

function timeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateString).toLocaleDateString()
}

interface NotificationItemProps {
  notification: Notification
  onRead: (id: number) => void
  onNavigate: (route: string) => void
}

function NotificationItem({
  notification,
  onRead,
  onNavigate
}: NotificationItemProps) {
  const t = useTranslations("dashboard.notifications")
  const route = getNotificationRoute(notification)
  const subtext = getNotificationSubtext(
    t,
    notification.type,
    notification.action
  )

  const handleClick = () => {
    if (!notification.is_read) onRead(notification.id)
    if (route) onNavigate(route)
  }

  return (
    <button
      type="button"
      className={cn(
        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50",
        !notification.is_read && "bg-accent/30",
        route && "cursor-pointer"
      )}
      onMouseDown={handleClick}
    >
      <div className="mt-0.5 shrink-0">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "line-clamp-2 text-sm",
              !notification.is_read
                ? "font-medium text-foreground"
                : "text-foreground/80"
            )}
          >
            {notification.content}
          </p>
          {!notification.is_read && (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        {subtext && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {subtext}
          </p>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          {timeAgo(notification.created_at)}
        </p>
      </div>
    </button>
  )
}

export function NotificationDropdown() {
  const t = useTranslations("dashboard.notifications")
  const queryClient = useQueryClient()
  const ws = useWebSocket()
  const router = useRouter()

  const [limit, setLimit] = useState(PAGE_SIZE)
  const [open, setOpen] = useState(false)
  const loadingMoreRef = useRef(false)

  const { data, isLoading, isFetching } = useNotifications(limit)
  const notifications = data?.items
  const totalCount = data?.totalCount ?? 0
  const hasMore = (notifications?.length ?? 0) < totalCount

  const { data: unreadData } = useUnreadCount()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const unreadCount = unreadData?.count ?? 0

  // Real-time push: refetch on new notification
  useWsEvent(
    WS_EVENTS.NOTIFICATION_CREATED,
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread
      })
    }, [queryClient]),
    ws
  )

  // Real-time: update unread count directly from WS
  useWsEvent(
    WS_EVENTS.NOTIFICATION_UNREAD_COUNT,
    useCallback(
      (data) => {
        const d = data as { count?: number }
        if (typeof d.count === "number") {
          queryClient.setQueryData(queryKeys.notifications.unread, {
            count: d.count
          })
        }
      },
      [queryClient]
    ),
    ws
  )

  const handleMarkRead = useCallback(
    (id: number) => markRead.mutate(id),
    [markRead]
  )

  const handleMarkAllRead = useCallback(
    () => markAllRead.mutate(),
    [markAllRead]
  )

  const handleNavigate = useCallback(
    (route: string) => {
      setOpen(false)
      router.push(route)
    },
    [router]
  )

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (loadingMoreRef.current || isFetching || !hasMore) return
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      if (scrollHeight - scrollTop - clientHeight < 80) {
        loadingMoreRef.current = true
        setLimit((prev) => prev + PAGE_SIZE)
        // Reset after short delay so next scroll can trigger again
        setTimeout(() => {
          loadingMoreRef.current = false
        }, 500)
      }
    },
    [isFetching, hasMore]
  )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[360px] p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="text-sm font-semibold text-foreground">
            {t("dropdown_title")}
          </h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              disabled={markAllRead.isPending}
              onMouseDown={(e) => {
                e.preventDefault()
                handleMarkAllRead()
              }}
            >
              {markAllRead.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCheck className="size-3.5" />
              )}
              {t("mark_all_read")}
            </Button>
          )}
        </div>

        {/* Notification list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <Check className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {t("no_notifications")}
            </p>
          </div>
        ) : (
          <div
            className="h-[400px] overflow-y-auto divide-y divide-border"
            onScroll={handleScroll}
          >
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleMarkRead}
                onNavigate={handleNavigate}
              />
            ))}

            {/* Infinite scroll loading indicator */}
            {isFetching && !isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* End of list */}
            {!hasMore && notifications.length > 0 && (
              <div className="py-4 text-center text-[11px] text-muted-foreground/50">
                {t("all_caught_up")}
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
