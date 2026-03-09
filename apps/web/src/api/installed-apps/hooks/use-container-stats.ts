import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import type { ContainerRange, ContainerStatsHistory } from "../container-stats"

/**
 * Reads container stats from the TanStack Query cache.
 *
 * Data is pushed exclusively by the ws-gateway via container_stats.update
 * events — there is no REST fetch. The hook is always disabled (enabled: false)
 * and only returns whatever the WebSocket bridge has written to the cache.
 */
export function useContainerStats(instanceId: number, range: ContainerRange) {
  return useQuery<ContainerStatsHistory>({
    queryKey: [...queryKeys.installedApps.containerStats(instanceId), range],
    queryFn: () => Promise.reject(new Error("ws-only")),
    enabled: false,
    staleTime: Infinity
  })
}
