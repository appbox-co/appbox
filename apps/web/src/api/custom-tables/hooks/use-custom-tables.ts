"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import {
  addCustomTableRow,
  deleteCustomTableRow,
  getCustomTableRows,
  getInstanceCustomTables,
  updateCustomTableRow
} from "../custom-tables"

export function useInstanceCustomTables(instanceId: number) {
  return useQuery({
    queryKey: queryKeys.customTables.byInstance(instanceId),
    queryFn: () => getInstanceCustomTables(instanceId),
    enabled: instanceId > 0
  })
}

export function useCustomTableRows(tableId: number, instanceId: number) {
  return useQuery({
    queryKey: queryKeys.customTables.rows(instanceId, tableId),
    queryFn: () => getCustomTableRows(tableId, instanceId),
    enabled: tableId > 0 && instanceId > 0
  })
}

export function useAddCustomTableRow(tableId: number, instanceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      addCustomTableRow(tableId, instanceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.rows(instanceId, tableId)
      })
    }
  })
}

export function useUpdateCustomTableRow(tableId: number, instanceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      rowId,
      payload
    }: {
      rowId: number | string
      payload: Record<string, unknown>
    }) => updateCustomTableRow(tableId, instanceId, rowId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.rows(instanceId, tableId)
      })
    }
  })
}

export function useDeleteCustomTableRow(tableId: number, instanceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rowId: number | string) =>
      deleteCustomTableRow(tableId, instanceId, rowId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.rows(instanceId, tableId)
      })
    }
  })
}
