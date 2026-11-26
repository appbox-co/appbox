import {
  DatabaseIcon,
  HardDrivesIcon,
  InfoIcon,
  WarningCircleIcon,
  WarningIcon,
  type Icon
} from "@phosphor-icons/react"
import type { Notification } from "@/api/notifications/notifications"
import { kumoRoutes } from "../kumo-routes"

const NOTIFICATION_ICONS: Record<string, { icon: Icon; className: string }> = {
  warning: { icon: WarningIcon, className: "text-kumo-warning" },
  quota: { icon: WarningIcon, className: "text-kumo-warning" },
  error: { icon: WarningCircleIcon, className: "text-kumo-danger" },
  critical: { icon: WarningCircleIcon, className: "text-kumo-danger" },
  server: { icon: HardDrivesIcon, className: "text-kumo-info" },
  storage: { icon: DatabaseIcon, className: "text-kumo-info" }
}

const DEFAULT_NOTIFICATION_ICON = {
  icon: InfoIcon,
  className: "text-kumo-subtle"
}

export function notificationIcon(type: string) {
  return NOTIFICATION_ICONS[type] ?? DEFAULT_NOTIFICATION_ICON
}

const ABUSE_REPORT_ACTIONS = new Set([
  "abuse_unresolvable",
  "abuse_reply_admin",
  "abuse_user_new",
  "abuse_user_closed",
  "abuse_reply_user"
])

/** The Kumo page a notification opens, as the current design's notification menu maps them. */
export function notificationRoute({
  type,
  action,
  relid
}: Notification): string | null {
  if (type === "instance") return kumoRoutes.installedApp(relid)
  if (type === "cylo" || type === "throttled" || type === "throttledcylo") {
    return kumoRoutes.appbox(relid)
  }
  if (type === "abuse" && ABUSE_REPORT_ACTIONS.has(action)) {
    return kumoRoutes.abuseReport(relid)
  }
  if (type === "hwfailure") return kumoRoutes.appboxes
  if (type === "criticalalert") return kumoRoutes.home
  return null
}
