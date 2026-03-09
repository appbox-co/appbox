import {
  AlertCircle,
  AlertTriangle,
  HardDrive,
  Info,
  Server
} from "lucide-react"

export function getNotificationIcon(type: string) {
  switch (type) {
    case "warning":
    case "quota":
      return <AlertTriangle className="size-4 text-orange-500" />
    case "error":
    case "critical":
      return <AlertCircle className="size-4 text-destructive" />
    case "server":
      return <Server className="size-4 text-blue-500" />
    case "storage":
      return <HardDrive className="size-4 text-indigo-500" />
    default:
      return <Info className="size-4 text-muted-foreground" />
  }
}

export function getNotificationSubtext(
  t: (key: string) => string,
  type: string,
  action: string
): string | null {
  if (type === "instance") {
    if (action === "add") return t("subtext.instance_add")
    if (action === "removed") return t("subtext.instance_removed")
    if (action === "removing") return t("subtext.instance_removing")
    if (action === "restart") return t("subtext.instance_restart")
    if (action === "updating") return t("subtext.instance_updating")
    if (action === "updated") return t("subtext.instance_updated")
    if (action === "stop") return t("subtext.instance_stop")
    if (action === "start") return t("subtext.instance_start")
  }
  if (type === "user" && action === "updated") return t("subtext.user_updated")
  if (type === "cylo") {
    if (action === "add") return t("subtext.cylo_add")
    if (action === "remove") return t("subtext.cylo_remove")
    if (action === "migrating") return t("subtext.cylo_migrating")
    if (action === "migrated") return t("subtext.cylo_migrated")
    if (action === "userdecreasingquota")
      return t("subtext.cylo_userdecreasingquota")
    if (action === "userlowquota") return t("subtext.cylo_userlowquota")
    if (action === "adminlowquota") return t("subtext.cylo_adminlowquota")
    if (action === "brokenmount") return t("subtext.cylo_brokenmount")
    if (action === "usernormalquota") return t("subtext.cylo_usernormalquota")
    if (action === "adminnormalquota") return t("subtext.cylo_adminnormalquota")
    if (action === "restarting") return t("subtext.cylo_restarting")
    if (action === "restarted") return t("subtext.cylo_restarted")
  }
  if (type === "blog") return t("subtext.blog")
  if (type === "hwfailure" && action === "newfailure")
    return t("subtext.hwfailure_newfailure")
  if (type === "criticalalert" && action === "newalert")
    return t("subtext.criticalalert_newalert")
  if (type === "abuse") {
    if (action === "abuse_unresolvable") return t("subtext.abuse_unresolvable")
    if (action === "abuse_reply_admin" || action === "abuse_reply_user")
      return t("subtext.abuse_reply")
    if (action === "abuse_user_new") return t("subtext.abuse_user_new")
    if (action === "abuse_user_closed") return t("subtext.abuse_user_closed")
  }
  if (type === "throttledcylo") {
    if (action === "throttled") return t("subtext.throttledcylo_throttled")
    if (action === "unthrottled") return t("subtext.throttledcylo_unthrottled")
  }
  if (type === "throttled") {
    if (action === "throttled") return t("subtext.throttled_throttled")
    if (action === "warning") return t("subtext.throttled_warning")
    if (action === "unthrottled") return t("subtext.throttled_unthrottled")
  }
  return null
}
