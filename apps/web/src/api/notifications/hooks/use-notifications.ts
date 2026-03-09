"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification
} from "../notifications"

interface NotificationsPage {
  items: Notification[]
  totalCount: number
}

function patchPage(
  data: unknown,
  patch: (items: Notification[]) => Notification[]
): NotificationsPage | unknown {
  if (data && typeof data === "object" && "items" in data) {
    const page = data as NotificationsPage
    return { ...page, items: patch(page.items) }
  }
  return data
}

export function useNotifications(limit: number = 20) {
  return useQuery({
    queryKey: [...queryKeys.notifications.all, limit],
    queryFn: async () => {
      const res = await getNotifications({ limit })
      return {
        items: res.items,
        totalCount: res.totalCount
      } satisfies NotificationsPage
    },
    placeholderData: keepPreviousData
  })
}

/**
 * Derives unread count from the notifications list response.
 * No separate endpoint exists -- the backend returns `unread` in the list response.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: async () => {
      const res = await getNotifications({ limit: 1 })
      return { count: res.unread }
    }
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })

      const allQueries = queryClient.getQueriesData({
        queryKey: queryKeys.notifications.all
      })

      for (const [key, data] of allQueries) {
        queryClient.setQueryData(
          key,
          patchPage(data, (items) =>
            items.map((n) => (n.id === id ? { ...n, is_read: true } : n))
          )
        )
      }

      const prev = queryClient.getQueryData<{ count: number }>(
        queryKeys.notifications.unread
      )
      if (prev && prev.count > 0) {
        queryClient.setQueryData(queryKeys.notifications.unread, {
          count: prev.count - 1
        })
      }

      return { allQueries, prev }
    },
    onError: (_err, _id, context) => {
      if (context?.allQueries) {
        for (const [key, data] of context.allQueries) {
          queryClient.setQueryData(key, data)
        }
      }
      if (context?.prev) {
        queryClient.setQueryData(queryKeys.notifications.unread, context.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread
      })
    }
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })

      const allQueries = queryClient.getQueriesData({
        queryKey: queryKeys.notifications.all
      })

      for (const [key, data] of allQueries) {
        queryClient.setQueryData(
          key,
          patchPage(data, (items) =>
            items.map((n) => ({ ...n, is_read: true }))
          )
        )
      }

      const prev = queryClient.getQueryData<{ count: number }>(
        queryKeys.notifications.unread
      )
      queryClient.setQueryData(queryKeys.notifications.unread, { count: 0 })

      return { allQueries, prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.allQueries) {
        for (const [key, data] of context.allQueries) {
          queryClient.setQueryData(key, data)
        }
      }
      if (context?.prev) {
        queryClient.setQueryData(queryKeys.notifications.unread, context.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread
      })
    }
  })
}
