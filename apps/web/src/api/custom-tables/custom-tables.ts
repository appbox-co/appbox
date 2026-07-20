import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client"
import { idempotencyHeaders } from "@/api/idempotency"
import type { ConditionalFieldMetadata } from "@/lib/dynamic-form"

export interface CustomTableRowAction {
  name: string
  label: string
  APIRoute: string
  APIMethod: "post" | "put" | "delete"
  variant?: "default" | "destructive"
  dialogTitle?: string
  dialogText?: string
  confirmation?: {
    type: "text"
    rowField?: string
    payloadField?: string
    expectedValue?: string
    label?: string
    placeholder?: string
  }
  payload?: Record<string, unknown>
}

export interface CustomTableColumn extends ConditionalFieldMetadata {
  name: string
  fieldId?: number
  title: string
  type?: string
  sensitive?: boolean
  revealable?: boolean
  inputField?: {
    type?: string

    params?: Record<string, unknown>

    validate?: unknown[]

    defaultValue?: unknown
  }

  defaultValue?: unknown
  actionName?: string
  buttonLabel?: string
  rowAction?: CustomTableRowAction
}

export interface CustomTableDefinition {
  label: string
  typeOf: string
  description?: string
  maxRowShowAddButton?: number
  APIRoute: string
  columns: CustomTableColumn[]
  columnOrder: string[]
  rowActions?: CustomTableRowAction[]
  enableAdding: boolean
  enableEditing: boolean
  enableDeleting: boolean
  editableFields?: string[]
}

export type CustomTableRow = Record<string, unknown> & {
  id: number | string
}

export interface CustomTableRef {
  tableId: number
  instanceId: number
}

function parseTableRef(apiRoute: string): CustomTableRef {
  const match = apiRoute.match(/tables\/(\d+)\/data\/(\d+)/)
  if (!match) {
    throw new Error(`Invalid custom table APIRoute: ${apiRoute}`)
  }
  return {
    tableId: Number(match[1]),
    instanceId: Number(match[2])
  }
}

export async function getInstanceCustomTables(
  instanceId: number
): Promise<CustomTableDefinition[]> {
  const res = await apiGet<{ customTables?: CustomTableDefinition[] }>(
    `tables/instance/${instanceId}`
  )
  return res?.customTables ?? []
}

export async function getCustomTableRows(
  tableId: number,
  instanceId: number
): Promise<CustomTableRow[]> {
  const res = await apiGet<{ items?: CustomTableRow[] } | CustomTableRow[]>(
    `tables/${tableId}/data/${instanceId}?limit=999&orderby=id`
  )
  return Array.isArray(res) ? res : (res.items ?? [])
}

export async function addCustomTableRow(
  tableId: number,
  instanceId: number,
  payload: Record<string, unknown>
): Promise<CustomTableRow> {
  return apiPut<CustomTableRow>(`tables/${tableId}/data/${instanceId}`, payload)
}

export async function updateCustomTableRow(
  tableId: number,
  instanceId: number,
  rowId: number | string,
  payload: Record<string, unknown>
): Promise<void> {
  return apiPost(`tables/${tableId}/data/${instanceId}/${rowId}`, payload)
}

export async function deleteCustomTableRow(
  tableId: number,
  instanceId: number,
  rowId: number | string
): Promise<void> {
  return apiDelete(`tables/${tableId}/data/${instanceId}/${rowId}`)
}

export async function revealCustomTableRowField(
  tableId: number,
  instanceId: number,
  rowId: number | string,
  fieldId: number
): Promise<string> {
  const res = await apiGet<{ value?: unknown }>(
    `tables/${tableId}/data/${instanceId}/${rowId}/field/${fieldId}/reveal`
  )

  return typeof res?.value === "string" ? res.value : ""
}

function interpolateRowRoute(route: string, row: CustomTableRow): string {
  return route.replace(/\{row\.([^}]+)\}/g, (_match, field: string) =>
    encodeURIComponent(String(row[field] ?? ""))
  )
}

export async function runCustomTableRowAction(
  action: CustomTableRowAction,
  row: CustomTableRow,
  confirmationValue?: string
): Promise<void> {
  const route = interpolateRowRoute(action.APIRoute, row)
  const options = {
    headers: idempotencyHeaders(`custom_table.${action.name}`)
  }
  const payload: Record<string, unknown> = {
    ...(action.payload ?? {}),
    rowId: row.id
  }
  if (action.confirmation?.payloadField && confirmationValue !== undefined) {
    payload[action.confirmation.payloadField] = confirmationValue
  }

  if (action.APIMethod === "delete") {
    await apiDelete(route, options)
  } else if (action.APIMethod === "put") {
    await apiPut(route, payload, options)
  } else {
    await apiPost(route, payload, options)
  }
}

export { parseTableRef }
