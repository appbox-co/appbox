"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ApiError } from "@/api/client"
import { queryKeys } from "@/constants/query-keys"
import {
  assignDedicatedIpv4,
  getMyDedicatedIpv4,
  makeDedicatedIpv4Primary,
  unassignDedicatedIpv4,
  type DedicatedIpv4Address,
  type DedicatedIpv4Change
} from "../dedicated-ipv4"

/** Every dedicated IPv4 address the signed-in customer owns. */
export function useMyDedicatedIpv4() {
  return useQuery({
    queryKey: queryKeys.dedicatedIpv4.mine,
    queryFn: getMyDedicatedIpv4,
    // A 4xx (403: not open for this account yet) won't change on a retry.
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status < 500) && failureCount < 1,
    // A bought address shows up after payment in billing, in another tab.
    refetchOnWindowFocus: true,
    // An unassigned address waits for its old server to confirm the removal;
    // poll while one does, so it becomes assignable without a reload.
    refetchInterval: (query) =>
      query.state.data?.some((a) => a.removal_pending) ? 15_000 : false
  })
}

function useInvalidateDedicatedIpv4() {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.dedicatedIpv4.all })
}

export function useAssignDedicatedIpv4() {
  const invalidate = useInvalidateDedicatedIpv4()
  return useMutation({
    mutationFn: (vars: { id: number; cyloId: number; primary?: boolean }) =>
      assignDedicatedIpv4(vars.id, vars.cyloId, vars.primary ?? false),
    onSettled: invalidate
  })
}

export function useMakeDedicatedIpv4Primary() {
  const invalidate = useInvalidateDedicatedIpv4()
  return useMutation({
    mutationFn: (id: number) => makeDedicatedIpv4Primary(id),
    onSettled: invalidate
  })
}

export function useUnassignDedicatedIpv4() {
  const invalidate = useInvalidateDedicatedIpv4()
  return useMutation({
    mutationFn: (id: number) => unassignDedicatedIpv4(id),
    onSettled: invalidate
  })
}

export type { DedicatedIpv4Address, DedicatedIpv4Change }
