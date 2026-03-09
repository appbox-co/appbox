"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { useAuth } from "@/providers/auth-provider"
import {
  getCylo,
  getCylosSummary,
  restartCylo,
  type CyloBandwidth,
  type CyloDetail,
  type CyloDiskQuota,
  type CyloStats,
  type CyloSummary
} from "../cylos"

/* -------------------------------------------------------------------------- */
/*  Queries                                                                    */
/* -------------------------------------------------------------------------- */

export function useCylosSummary() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.cylos.all,
    queryFn: () => getCylosSummary(user.id)
  })
}

export function useCylo(id: number) {
  return useQuery({
    queryKey: queryKeys.cylos.detail(id),
    queryFn: () => getCylo(id),
    enabled: id > 0
  })
}

/**
 * Reads stats data pushed by ws-gateway via WebSocket.
 * No HTTP fetch — the cache is populated by the stats.update WS event
 * handler in useWsQueryInvalidation. Returns undefined until the first
 * WS push arrives.
 *
 * When `range` is omitted the hook reads from the range-agnostic "latest"
 * key — useful for sparkline mini-charts that just want whatever history
 * arrived most recently.  When `range` is provided it reads the
 * range-specific key used by the detail-page charts.
 */
export function useCyloStats(id: number, range?: string) {
  return useQuery<CyloStats>({
    queryKey: range
      ? [...queryKeys.cylos.stats(id), range]
      : queryKeys.cylos.stats(id),
    queryFn: () => Promise.reject(new Error("ws-only")),
    enabled: false
  })
}

/**
 * Reads live disk-quota data pushed by ws-gateway via WebSocket.
 * No HTTP fetch — the cache is populated by the quota.update WS event
 * handler in useWsQueryInvalidation.  Returns undefined until the first
 * WS push arrives.
 */
export function useCyloDiskQuota(id: number) {
  return useQuery<CyloDiskQuota>({
    queryKey: queryKeys.cylos.quota(id),
    queryFn: () => Promise.reject(new Error("ws-only")),
    enabled: false
  })
}

/**
 * Reads 30-day network bandwidth totals pushed by ws-gateway via WebSocket.
 * No HTTP fetch — the cache is populated by the stats.update WS event
 * handler in useWsQueryInvalidation.  Returns undefined until the first
 * WS push arrives.
 */
export function useCyloBandwidth(id: number) {
  return useQuery<CyloBandwidth>({
    queryKey: queryKeys.cylos.bandwidth(id),
    queryFn: () => Promise.reject(new Error("ws-only")),
    enabled: false
  })
}

export function useRestartCylo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => restartCylo(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cylos.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.cylos.all })
    }
  })
}

export type { CyloSummary, CyloDetail, CyloStats, CyloDiskQuota, CyloBandwidth }
