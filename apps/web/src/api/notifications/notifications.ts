import { apiDelete, apiGet, apiPost } from "@/api/client"

export interface Notification {
  id: number
  user_id: number
  type: string
  content: string
  is_read: boolean
  relid: number
  action: string
  created_at: string
}

/** Raw shape returned by the backend */
interface NotificationRaw {
  id: number
  user_id: number
  type: string
  content: string
  unread: number
  relid: number
  action: string
  created_at: string
}

/** Map backend record → frontend Notification */
function mapNotification(raw: NotificationRaw): Notification {
  return {
    id: raw.id,
    user_id: raw.user_id,
    type: raw.type,
    content: raw.content,
    is_read: raw.unread === 0,
    relid: raw.relid,
    action: raw.action,
    created_at: raw.created_at
  }
}

interface NotificationsRawResponse {
  items: NotificationRaw[]
  totalCount: number
  unread: number
}

export async function getNotifications(params?: {
  limit?: number
  offset?: number
  since?: string
}): Promise<{ items: Notification[]; unread: number; totalCount: number }> {
  const queryParams: Record<string, string> = { orderby: "-id" }
  if (params?.limit) queryParams.limit = String(params.limit)
  if (params?.offset) queryParams.offset = String(params.offset)
  if (params?.since) queryParams.since = params.since
  const res = await apiGet<NotificationsRawResponse>("notifications", {
    params: queryParams
  })
  return {
    items: (res.items ?? []).map(mapNotification),
    unread: res.unread ?? 0,
    totalCount: res.totalCount ?? 0
  }
}

export async function markNotificationRead(id: number): Promise<void> {
  return apiPost(`notifications/read/${id}`)
}

export async function markAllNotificationsRead(): Promise<void> {
  return apiPost("notifications/all/read")
}

export async function deleteUiUpdateNotifications(): Promise<void> {
  return apiDelete("notifications/UIUpdates")
}
