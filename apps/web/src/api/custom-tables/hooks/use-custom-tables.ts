"use client"

import { useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import {
  addCustomTableRow,
  deleteCustomTableRow,
  getCustomTableMutations,
  getCustomTableRows,
  getInstanceCustomTables,
  retryCustomTableMutation,
  revealCustomTableRowField,
  runCustomTableRowAction,
  updateCustomTableRow,
  type CustomTableRow,
  type CustomTableRowAction
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

export function useCustomTableMutations(
  tableId: number,
  instanceId: number,
  enabled: boolean
) {
  const queryClient = useQueryClient()
  const finalizedMutationIds = useRef(new Set<string>())
  const query = useQuery({
    queryKey: queryKeys.customTables.mutations(instanceId, tableId),
    queryFn: () => getCustomTableMutations(tableId, instanceId),
    enabled: enabled && tableId > 0 && instanceId > 0,
    refetchInterval: (query) =>
      query.state.data?.some((mutation) =>
        ["admission_pending", "queued"].includes(mutation.status)
      )
        ? 5000
        : 30000
  })

  useEffect(() => {
    const newlyCompleted = query.data?.filter(
      (mutation) =>
        mutation.status === "completed" &&
        !finalizedMutationIds.current.has(
          `${instanceId}:${tableId}:${mutation.id}`
        )
    )
    if (!newlyCompleted?.length) return

    for (const mutation of newlyCompleted) {
      finalizedMutationIds.current.add(
        `${instanceId}:${tableId}:${mutation.id}`
      )
    }

    queryClient.invalidateQueries({
      queryKey: queryKeys.customTables.rows(instanceId, tableId)
    })
  }, [instanceId, query.data, queryClient, tableId])

  return query
}

export function useRetryCustomTableMutation(
  tableId: number,
  instanceId: number
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mutationId: number) =>
      retryCustomTableMutation(tableId, instanceId, mutationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.mutations(instanceId, tableId)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.rows(instanceId, tableId)
      })
    }
  })
}

export function useAddCustomTableRow(tableId: number, instanceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey
    }: {
      payload: Record<string, unknown>
      idempotencyKey: string
    }) => addCustomTableRow(tableId, instanceId, payload, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.rows(instanceId, tableId)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.mutations(instanceId, tableId)
      })
    }
  })
}

export function useUpdateCustomTableRow(tableId: number, instanceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      rowId,
      payload,
      idempotencyKey
    }: {
      rowId: number | string
      payload: Record<string, unknown>
      idempotencyKey: string
    }) =>
      updateCustomTableRow(tableId, instanceId, rowId, payload, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.rows(instanceId, tableId)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.mutations(instanceId, tableId)
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

export function useRevealCustomTableRowField(
  tableId: number,
  instanceId: number
) {
  return useMutation({
    mutationFn: ({
      rowId,
      fieldId
    }: {
      rowId: number | string
      fieldId: number
    }) => revealCustomTableRowField(tableId, instanceId, rowId, fieldId)
  })
}

export function useCustomTableRowAction(tableId: number, instanceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      action,
      row,
      confirmationValue
    }: {
      action: CustomTableRowAction
      row: CustomTableRow
      confirmationValue?: string
    }) => runCustomTableRowAction(action, row, confirmationValue),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.rows(instanceId, tableId)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.customTables.byInstance(instanceId)
      })
    }
  })
}
