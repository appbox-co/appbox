"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import type { JobProgressData } from "@/lib/websocket/types"
import { useAuth } from "@/providers/auth-provider"
import {
  boostInstance,
  getInstalledApp,
  getInstalledApps,
  getInstalledAppVncInfo,
  restartApp,
  startApp,
  stopApp,
  switchVersion,
  uninstallApp,
  updateApp,
  type InstalledApp,
  type InstalledAppVncInfo
} from "../installed-apps"

/* -------------------------------------------------------------------------- */
/*  Queries                                                                    */
/* -------------------------------------------------------------------------- */

export function useInstalledApps(cyloId?: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: cyloId
      ? queryKeys.installedApps.byCylo(cyloId)
      : queryKeys.installedApps.all,
    queryFn: () => getInstalledApps(cyloId, user.id)
  })
}

export function useInstalledApp(id: number) {
  return useQuery({
    queryKey: queryKeys.installedApps.detail(id),
    queryFn: () => getInstalledApp(id),
    enabled: id > 0
  })
}

export function useInstalledAppVncInfo(
  serverName: string,
  id: number,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.installedApps.vnc(id),
    queryFn: () => getInstalledAppVncInfo(serverName, id),
    enabled: enabled && !!serverName && id > 0
  })
}

/** Reads live job progress for a specific app instance (WS-populated, never fetched). */
export function useAppJob(instanceId: number) {
  return useQuery<JobProgressData>({
    queryKey: queryKeys.jobs.byInstance(instanceId),
    queryFn: () => Promise.reject(new Error("ws-only")),
    enabled: false
  })
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                  */
/* -------------------------------------------------------------------------- */

export function useStartApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => startApp(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.detail(id)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.all
      })
    }
  })
}

export function useStopApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => stopApp(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.detail(id)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.all
      })
    }
  })
}

export function useRestartApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => restartApp(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.detail(id)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.all
      })
    }
  })
}

export function useUpdateApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, versionId }: { id: number; versionId: number }) =>
      updateApp(id, versionId),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.detail(id)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.all
      })
    }
  })
}

export function useUninstallApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => uninstallApp(id),
    onSuccess: (_data, id) => {
      const detailCached = queryClient.getQueryData<InstalledApp>(
        queryKeys.installedApps.detail(id)
      )
      const allCached =
        queryClient.getQueryData<InstalledApp[]>(queryKeys.installedApps.all) ??
        []
      const fromAll = allCached.find((app) => app.id === id)
      const cyloId = detailCached?.cylo_id ?? fromAll?.cylo_id

      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.detail(id)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.all
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.cylos.all
      })

      if (cyloId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.installedApps.byCylo(cyloId)
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.cylos.detail(cyloId)
        })
      }
    }
  })
}

export function useSwitchVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, versionId }: { id: number; versionId: number }) =>
      switchVersion(id, versionId),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.detail(id)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.all
      })
    }
  })
}

export function useBoostApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, boostSlots }: { id: number; boostSlots: number }) =>
      boostInstance(id, boostSlots),
    onMutate: ({ id }) => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `appBoostMutation:${id}`,
          String(Date.now())
        )
      }
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.detail(id)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.installedApps.all
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.cylos.all
      })
    }
  })
}

export type { InstalledApp, InstalledAppVncInfo, JobProgressData }
