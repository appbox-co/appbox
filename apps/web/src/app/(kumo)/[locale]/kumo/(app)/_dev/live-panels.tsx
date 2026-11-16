"use client"

import { useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { AppStoreItem } from "@/api/apps/app-store"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { queryKeys } from "@/constants/query-keys"
import { useAuth } from "@/providers/auth-provider"
import {
  AppStatesPanel,
  type AppStatesTarget
} from "../../_components/dev/app-states-panel"
import {
  InstallGuardsPanel,
  type GuardTarget
} from "../../_components/dev/install-guards-panel"

/*
 * The two developer panels that sample pages share, pointed at the query
 * cache: the same reads, writes and reloads the current design's panels make.
 */

/** Install guards for one App Store app, overriding the cached app. */
export function LiveInstallGuardsPanel({ appId }: { appId: number }) {
  const queryClient = useQueryClient()
  const { cylos, user } = useAuth()

  const target = useMemo<GuardTarget>(() => {
    const key = queryKeys.apps.detail(appId)
    return {
      read: () => queryClient.getQueryData<AppStoreItem>(key),
      write: (app) => {
        queryClient.setQueryData<AppStoreItem>(key, app)
      },
      reload: () =>
        queryClient
          .refetchQueries({ queryKey: key })
          .then(() => queryClient.getQueryData<AppStoreItem>(key))
    }
  }, [appId, queryClient])

  return (
    <InstallGuardsPanel
      appId={appId}
      target={target}
      role={user?.roles}
      appboxCount={(cylos ?? []).length}
    />
  )
}

/** Status overrides for the installed apps list, written to every cached copy. */
export function LiveAppStatesPanel({ apps }: { apps: InstalledApp[] }) {
  const queryClient = useQueryClient()

  const target = useMemo<AppStatesTarget>(
    () => ({
      setStatus: (appId, cyloId, status) => {
        const patch = (app: InstalledApp) =>
          app.id === appId ? { ...app, status } : app

        queryClient.setQueryData<InstalledApp[]>(
          queryKeys.installedApps.all,
          (prev) => prev?.map(patch)
        )
        queryClient.setQueryData<InstalledApp[]>(
          queryKeys.installedApps.byCylo(cyloId),
          (prev) => prev?.map(patch)
        )
        // Also patch the detail cache if it exists
        queryClient.setQueryData<InstalledApp>(
          queryKeys.installedApps.detail(appId),
          (prev) => (prev ? { ...prev, status } : prev)
        )
      },
      restore: (only) => {
        // Invalidate so real data is re-fetched
        queryClient.invalidateQueries({ queryKey: queryKeys.installedApps.all })
        if (!only) return
        queryClient.invalidateQueries({
          queryKey: queryKeys.installedApps.byCylo(only.cyloId)
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.installedApps.detail(only.appId)
        })
      }
    }),
    [queryClient]
  )

  return <AppStatesPanel apps={apps} target={target} />
}
