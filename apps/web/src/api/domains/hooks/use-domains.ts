"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { useAuth } from "@/providers/auth-provider"
import {
  addInstanceDomain,
  deleteDomain,
  deleteInstanceDomain,
  getDomains,
  getInstanceDomainConfig,
  getInstanceDomains,
  type AddInstanceDomainPayload,
  type Domain,
  type InstanceDomain,
  type InstanceDomainConfigResponse
} from "../domains"

/* -------------------------------------------------------------------------- */
/*  Queries                                                                    */
/* -------------------------------------------------------------------------- */

export function useDomains() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.domains.all,
    queryFn: () => getDomains(user.id)
  })
}

export function useInstanceDomains(instanceId: number) {
  return useQuery({
    queryKey: queryKeys.domains.byInstance(instanceId),
    queryFn: () => getInstanceDomains(instanceId),
    enabled: instanceId > 0
  })
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                  */
/* -------------------------------------------------------------------------- */

export function useDeleteDomain() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDomain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all })
    }
  })
}

export function useDeleteInstanceDomain(instanceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteInstanceDomain(instanceId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.domains.byInstance(instanceId)
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all })
    }
  })
}

export function useAddInstanceDomain(instanceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddInstanceDomainPayload) =>
      addInstanceDomain(instanceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.domains.byInstance(instanceId)
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all })
    }
  })
}

export function useInstanceDomainConfig(instanceId: number) {
  return useMutation({
    mutationFn: (domain: string) => getInstanceDomainConfig(instanceId, domain)
  })
}

export type { Domain }
export type {
  InstanceDomain,
  InstanceDomainConfigResponse,
  AddInstanceDomainPayload
}
