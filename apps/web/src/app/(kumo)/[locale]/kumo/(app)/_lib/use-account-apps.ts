"use client"

import { useQueries, type UseQueryResult } from "@tanstack/react-query"
import { useCylosSummary } from "@/api/cylos/hooks/use-cylos"
import { useInstalledApps } from "@/api/installed-apps/hooks/use-installed-apps"
import { getPinnedApps } from "@/api/pinned-apps/pinned-apps"
import { queryKeys } from "@/constants/query-keys"
import {
  toStripApps,
  type StripApp
} from "../../_components/installed/app-strip"
import { buildSearchGroups } from "../../_components/quick-search"
import type { Loadable } from "../../_components/shared"

export function toLoadable<TData, TItem>(
  query: UseQueryResult<TData>,
  select: (data: TData | undefined) => TItem[]
): Loadable<TItem[]> {
  if (query.isLoading) return { status: "loading" }
  if (query.error) return { status: "error" }
  return { status: "ready", data: select(query.data) }
}

/**
 * The signed-in user's Appboxes and installed apps (pinned first), plus the
 * matching quick search entries, so every prototype page offers the same ⌘K
 * results. Pages that show VM power controls pass `watchVmControl`.
 */
export function useAccountApps({
  watchVmControl = false
}: { watchVmControl?: boolean } = {}) {
  const cylosSummary = useCylosSummary()
  const installedApps = useInstalledApps(undefined, undefined, {
    watchVmControl
  })
  const cylos = cylosSummary.data ?? []

  // Pins are stored per Appbox, so fetch them for each one (same cache keys
  // as usePinnedApps) and merge them with the single installed-apps query.
  const pinnedApps = useQueries({
    queries: cylos.map((cylo) => ({
      queryKey: queryKeys.pinnedApps.byCylo(cylo.id),
      queryFn: () => getPinnedApps(cylo.id)
    }))
  })
  const appsByCylo = new Map<number, StripApp[]>(
    cylos.map((cylo, index) => [
      cylo.id,
      toStripApps(
        pinnedApps[index]?.data,
        installedApps.data?.filter((app) => app.cylo_id === cylo.id)
      )
    ])
  )

  /** Install id → saved pin order, across every Appbox. */
  const pinnedOrder = new Map<number, number>(
    pinnedApps.flatMap((query) =>
      (query.data ?? []).map((pin) => [pin.app_instance_id, pin.sort_order])
    )
  )

  const apps: Loadable<ReadonlyMap<number, StripApp[]>> =
    installedApps.isLoading
      ? { status: "loading" }
      : installedApps.error
        ? { status: "error" }
        : { status: "ready", data: appsByCylo }

  return {
    cylosSummary,
    installedApps,
    pinnedOrder,
    apps,
    searchGroups: buildSearchGroups(cylos, appsByCylo)
  }
}
