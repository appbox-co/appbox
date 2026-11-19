"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Button, Tooltip } from "@cloudflare/kumo"
import {
  ArrowClockwiseIcon,
  PlayIcon,
  SnowflakeIcon,
  StopIcon,
  type Icon
} from "@phosphor-icons/react"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"

export type InstanceAction =
  "start" | "stop" | "restart" | "freeze" | "unfreeze"

export const INSTANCE_ACTIONS = [
  "start",
  "stop",
  "restart",
  "freeze",
  "unfreeze"
] as const

/** Every status an install can report, in the order the filters list them. */
export const INSTANCE_STATUSES = [
  "online",
  "offline",
  "inactive",
  "restarting",
  "frozen",
  "migrating",
  "installing",
  "updating",
  "deleting"
] as const

/** Statuses during which an install cannot be started, stopped or frozen. */
const TRANSITIONAL = new Set([
  "restarting",
  "migrating",
  "installing",
  "updating",
  "deleting"
])

const ACTION_ICONS: Record<InstanceAction, Icon> = {
  start: PlayIcon,
  stop: StopIcon,
  restart: ArrowClockwiseIcon,
  freeze: SnowflakeIcon,
  unfreeze: PlayIcon
}

function describe(app: InstalledApp) {
  return {
    running: app.status === "online",
    stopped: app.status === "offline" || app.status === "inactive",
    frozen: app.status === "frozen",
    transitioning: TRANSITIONAL.has(app.status)
  }
}

/** Whether a bulk action applies to this install (same rules as the current design). */
export function canRunInBulk(action: InstanceAction, app: InstalledApp) {
  if (app.vm_control_pending) return false
  const { stopped, frozen, transitioning } = describe(app)
  if (action === "start") return !transitioning && !frozen && stopped
  if (action === "stop")
    return !transitioning && !frozen && app.status === "online"
  if (action === "restart") return !transitioning && !frozen && !stopped
  if (action === "freeze") return !transitioning && !frozen
  return frozen
}

/** Row buttons are slightly more permissive than bulk, again matching the current design. */
function rowDisabled(action: InstanceAction, app: InstalledApp) {
  const { running, stopped, frozen } = describe(app)
  const transitioning =
    app.vm_control_pending === true || TRANSITIONAL.has(app.status)
  if (action === "start") return running || frozen || transitioning
  if (action === "stop" || action === "restart")
    return stopped || frozen || transitioning
  return transitioning
}

export function statusLabel(status: string) {
  const value = String(status ?? "inactive").toLowerCase()
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function InstanceStatusBadge({ status }: { status: string }) {
  const value = String(status ?? "inactive").toLowerCase()
  const label = statusLabel(value)

  if (value === "frozen") return <Badge variant="info">{label}</Badge>
  const variant =
    value === "online"
      ? "success"
      : TRANSITIONAL.has(value)
        ? value === "deleting"
          ? "error"
          : "warning"
        : "neutral"
  return (
    <Badge variant={variant} appearance="dot" className="shrink-0">
      {label}
    </Badge>
  )
}

/**
 * Tracks which installs have a request in flight, for the row and bulk
 * spinners. Failures are reported by the requests themselves (a toast), so
 * they are not rethrown here.
 */
export function useInstanceRunner(
  onAction: (action: InstanceAction, ids: number[]) => Promise<unknown>
) {
  /** Install id → action in flight. */
  const [busy, setBusy] = useState<ReadonlyMap<number, InstanceAction>>(
    new Map()
  )
  const [bulk, setBulk] = useState<InstanceAction | null>(null)

  const runRow = async (action: InstanceAction, app: InstalledApp) => {
    setBusy((current) => new Map(current).set(app.id, action))
    try {
      await onAction(action, [app.id])
    } catch {
      // Reported by the request.
    } finally {
      setBusy((current) => {
        const next = new Map(current)
        next.delete(app.id)
        return next
      })
    }
  }

  /** Runs the action on the installs it applies to. Resolves true once they all succeed. */
  const runBulk = async (action: InstanceAction, apps: InstalledApp[]) => {
    const ids = apps
      .filter((app) => canRunInBulk(action, app))
      .map((app) => app.id)
    if (ids.length === 0) return false
    setBulk(action)
    try {
      await onAction(action, ids)
      return true
    } catch {
      return false
    } finally {
      setBulk(null)
    }
  }

  return { busy, bulk, runRow, runBulk }
}

/** Start, stop, restart, and freeze or unfreeze for one install. */
export function InstanceRowActions({
  app,
  busy,
  onRun
}: {
  app: InstalledApp
  /** The action this install has in flight, if any. */
  busy?: InstanceAction
  onRun: (action: InstanceAction) => void
}) {
  const t = useTranslations("appboxmanager.appDetail")
  const actions: InstanceAction[] = [
    "start",
    "stop",
    "restart",
    app.status === "frozen" ? "unfreeze" : "freeze"
  ]

  return (
    <span className="flex items-center gap-1">
      {actions.map((action) => (
        <Tooltip
          key={action}
          content={t(action)}
          render={
            <Button
              size="sm"
              shape="square"
              icon={ACTION_ICONS[action]}
              aria-label={`${t(action)} ${app.display_name}`}
              loading={busy === action}
              disabled={busy !== undefined || rowDisabled(action, app)}
              onClick={() => onRun(action)}
            />
          }
        />
      ))}
    </span>
  )
}

/** The same five actions for a selection; each is enabled when it applies to any of it. */
export function InstanceBulkActions({
  apps,
  bulk,
  onRun
}: {
  apps: InstalledApp[]
  /** The bulk action in flight, if any. */
  bulk: InstanceAction | null
  onRun: (action: InstanceAction) => void
}) {
  const t = useTranslations("appboxmanager.appDetail")

  return (
    <>
      {INSTANCE_ACTIONS.map((action) => (
        <Button
          key={action}
          size="sm"
          icon={ACTION_ICONS[action]}
          loading={bulk === action}
          disabled={
            bulk !== null || !apps.some((app) => canRunInBulk(action, app))
          }
          onClick={() => onRun(action)}
        >
          {t(action)}
        </Button>
      ))}
    </>
  )
}
