"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { deleteUiUpdateNotifications } from "@/api/notifications/notifications"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { WS_EVENTS } from "@/constants/events"
import { useWsEvent } from "@/lib/websocket/hooks"
import type { NotificationCreatedData } from "@/lib/websocket/types"
import { useWebSocket } from "@/providers/websocket-provider"

export function UiUpdateRefreshDialog() {
  const t = useTranslations("dashboard.notifications")
  const ws = useWebSocket()
  const [open, setOpen] = useState(false)
  const handledNotificationIds = useRef<Set<number>>(new Set())

  const handleUiUpdate = useCallback((notificationId?: number) => {
    if (
      typeof notificationId === "number" &&
      handledNotificationIds.current.has(notificationId)
    ) {
      return
    }

    if (typeof notificationId === "number") {
      handledNotificationIds.current.add(notificationId)
    }

    setOpen(true)
    void deleteUiUpdateNotifications().catch(() => {
      // Best-effort cleanup only; do not block the refresh prompt.
    })
  }, [])

  useWsEvent<NotificationCreatedData>(
    WS_EVENTS.NOTIFICATION_CREATED,
    useCallback(
      (data) => {
        if (data.type === "UIUpdate") {
          handleUiUpdate(data.id)
        }
      },
      [handleUiUpdate]
    ),
    ws
  )

  useWsEvent(
    WS_EVENTS.UI_UPDATE,
    useCallback(() => {
      handleUiUpdate()
    }, [handleUiUpdate]),
    ws
  )

  const handleRefreshNow = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("ui_update_title")}</DialogTitle>
          <DialogDescription>{t("ui_update_description")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("refresh_later")}
          </Button>
          <Button variant="primary" onClick={handleRefreshNow}>
            {t("refresh_now")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
