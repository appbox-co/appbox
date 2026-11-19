import type { CustomTableColumn, CustomTableRow } from "./custom-tables"

// Use only a declared, non-secret name field. Failed creates may no longer have
// a row; callers must use a row-ID fallback, not mutation inputs or raw errors.
export function customTableMutationRowLabel(
  rowId: number,
  rows: CustomTableRow[],
  columns: CustomTableColumn[]
): string | null {
  const column = columns.find(
    (candidate) =>
      ["name:value", "name"].includes(candidate.name) &&
      candidate.sensitive !== true &&
      ![candidate.type, candidate.inputField?.type].some((type) =>
        type?.toLowerCase().includes("password")
      )
  )
  if (!column) return null
  const row = rows.find((candidate) => String(candidate.id) === String(rowId))
  const value = row?.[column.name]
  return typeof value === "string" && value.trim() && value !== "[REDACTED]"
    ? value
    : null
}
