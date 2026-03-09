"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { useAuth } from "@/providers/auth-provider"
import {
  deleteVoteApp,
  getAppBoostInfo,
  getAppCategories,
  getAppDetail,
  getAppVersions,
  getFeaturedApps,
  getNewApps,
  getRecentlyUpdatedApps,
  getTopApps,
  installApp,
  searchApps,
  voteApp,
  type AppStoreItem
} from "../app-store"

/* -------------------------------------------------------------------------- */
/*  Queries                                                                    */
/* -------------------------------------------------------------------------- */

export function useFeaturedApps(limit: number = 6) {
  const { isAdmin } = useAuth()
  return useQuery({
    queryKey: queryKeys.apps.featured,
    queryFn: () => getFeaturedApps(limit, isAdmin)
  })
}

export function useTopApps(limit: number = 6) {
  const { isAdmin } = useAuth()
  return useQuery({
    queryKey: queryKeys.apps.top,
    queryFn: () => getTopApps(limit, isAdmin)
  })
}

export function useNewApps(limit: number = 6) {
  const { isAdmin } = useAuth()
  return useQuery({
    queryKey: queryKeys.apps.new,
    queryFn: () => getNewApps(limit, isAdmin)
  })
}

// Aliases for dashboard page
export const useNewestApps = useNewApps

export function useRecentlyUpdatedApps(limit: number = 6) {
  const { isAdmin } = useAuth()
  return useQuery({
    queryKey: queryKeys.apps.recentlyUpdated,
    queryFn: () => getRecentlyUpdatedApps(limit, isAdmin)
  })
}

export function useAppCategories() {
  return useQuery({
    queryKey: queryKeys.apps.categories,
    queryFn: getAppCategories
  })
}

export function useSearchApps(filters: {
  q?: string
  category?: string
  sort?: string
  featured?: string
  slots?: string
}) {
  const { isAdmin } = useAuth()
  return useQuery({
    queryKey: queryKeys.apps.search(filters),
    queryFn: () => searchApps(filters, isAdmin)
  })
}

export function useAppDetail(appId: number, versionId?: number) {
  const { isAdmin } = useAuth()
  return useQuery({
    queryKey: queryKeys.apps.detail(appId, versionId),
    queryFn: () => getAppDetail(appId, versionId, isAdmin),
    enabled: appId > 0
  })
}

export function useAppVersions(appId: number) {
  return useQuery({
    queryKey: queryKeys.apps.versions(appId),
    queryFn: () => getAppVersions(appId),
    enabled: appId > 0
  })
}

export function useAppBoostInfo(appId: number, cyloId: number) {
  return useQuery({
    queryKey: queryKeys.apps.boostInfo(appId, cyloId),
    queryFn: () => getAppBoostInfo(appId, cyloId),
    enabled: appId > 0 && cyloId > 0
  })
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                  */
/* -------------------------------------------------------------------------- */

export function useInstallApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: installApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installedApps.all })
    }
  })
}

export function useVoteApp(appId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (direction: "up" | "down" | null) =>
      direction === null ? deleteVoteApp(appId) : voteApp(appId, direction),

    onMutate: async (direction) => {
      const queryKey = queryKeys.apps.detail(appId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<AppStoreItem>(queryKey)

      if (previous) {
        const cur = previous.uservote // 1 | 0 | null
        let upvotes = previous.upvotes
        let downvotes = previous.downvotes
        let uservote: number | null = null

        if (direction === null) {
          // Removing vote
          if (cur === 1) upvotes -= 1
          else if (cur === 0) downvotes -= 1
          uservote = null
        } else if (direction === "up") {
          if (cur === 0) {
            upvotes += 1
            downvotes -= 1
            uservote = 1
          } // flip down → up
          else {
            upvotes += 1
            uservote = 1
          } // no vote → up
        } else {
          if (cur === 1) {
            downvotes += 1
            upvotes -= 1
            uservote = 0
          } // flip up → down
          else {
            downvotes += 1
            uservote = 0
          } // no vote → down
        }

        queryClient.setQueryData(queryKey, {
          ...previous,
          upvotes,
          downvotes,
          uservote,
          rating: upvotes - downvotes
        })
      }

      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.apps.detail(appId), context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.apps.detail(appId)
      })
    }
  })
}
