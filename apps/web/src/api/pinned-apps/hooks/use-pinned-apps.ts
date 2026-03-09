"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { getPinnedApps, pinApp, unpinApp } from "../pinned-apps"

export function usePinnedApps(cyloId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.pinnedApps.byCylo(cyloId ?? 0),
    queryFn: () => getPinnedApps(cyloId!),
    enabled: !!cyloId
  })
}

export function usePinApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pinApp,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pinnedApps.byCylo(variables.cylo_id)
      })
    }
  })
}

export function useUnpinApp(cyloId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: unpinApp,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pinnedApps.byCylo(cyloId ?? 0)
      })
    }
  })
}
