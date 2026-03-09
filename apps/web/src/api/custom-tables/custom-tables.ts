import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client"

export interface CustomTableColumn {
  name: string
  title: string
  type?: string
  inputField?: {
    type?: string

    params?: Record<string, unknown>

    validate?: unknown[]

    defaultValue?: unknown
  }

  defaultValue?: unknown
  actionName?: string
  buttonLabel?: string
}

export interface CustomTableDefinition {
  label: string
  typeOf: string
  description?: string
  maxRowShowAddButton?: number
  APIRoute: string
  columns: CustomTableColumn[]
  columnOrder: string[]
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

export { parseTableRef }
