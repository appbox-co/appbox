"use client"

import { useQueries } from "@tanstack/react-query"
import type {
  CyloBandwidth,
  CyloDiskQuota,
  CyloSummary
} from "@/api/cylos/cylos"
import { queryKeys } from "@/constants/query-keys"
import type { ServiceUsage } from "../shared"

/** These figures are pushed over the WebSocket into the cache, never fetched. */
const pushedOnly = <T>(): Promise<T> => Promise.reject(new Error("ws-only"))

/**
 * Live storage and 30 day bandwidth for several Appboxes at once, keyed by
 * Appbox id: the same cache entries `useCyloDiskQuota` and `useCyloBandwidth`
 * read for one. A figure is missing until its first push arrives.
 */
export function useAppboxesUsage(
  cylos: CyloSummary[]
): ReadonlyMap<number, ServiceUsage> {
  const quotas = useQueries({
    queries: cylos.map((cylo) => ({
      queryKey: queryKeys.cylos.quota(cylo.id),
      queryFn: () => pushedOnly<CyloDiskQuota>(),
      enabled: false
    }))
  })
  const bandwidths = useQueries({
    queries: cylos.map((cylo) => ({
      queryKey: queryKeys.cylos.bandwidth(cylo.id),
      queryFn: () => pushedOnly<CyloBandwidth>(),
      enabled: false
    }))
  })

  return new Map(
    cylos.map((cylo, index) => [
      cylo.id,
      {
        storageUsedGb: quotas[index]?.data?.used_gb,
        uploadBytes: bandwidths[index]?.data?.upload_bytes,
        downloadBytes: bandwidths[index]?.data?.download_bytes
      }
    ])
  )
}
