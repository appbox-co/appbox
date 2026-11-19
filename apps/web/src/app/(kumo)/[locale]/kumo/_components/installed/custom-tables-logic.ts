/**
 * Pure helpers for an installed app's custom data tables.
 *
 * Everything down to "Listing" is copied unchanged from the current design
 * (installedapps/[id]/_components/custom-tables-card.tsx) so both behave the
 * same: change the original and this file together. The listing helpers stand
 * in for what the current design gets from its shared DataTable.
 *
 * Nothing in here renders.
 */

import type {
  CustomTableColumn,
  CustomTableMutationAdmission,
  CustomTableRow
} from "@/api/custom-tables/custom-tables"
import type { FormFieldConfig } from "@/types/dashboard"

export const REDACTED_SECRET_VALUE = "[REDACTED]"

/* -------------------------------------------------------------------------- */
/*  Validation                                                                 */
/* -------------------------------------------------------------------------- */

export function isRequired(column: CustomTableColumn): boolean {
  const rules = column.inputField?.validate
  if (!Array.isArray(rules)) return false
  return rules.some((rule) => rule === "required")
}

export function validateValue(
  column: CustomTableColumn,
  value: string
): string | null {
  const rules = column.inputField?.validate
  if (!Array.isArray(rules)) return null

  for (const rule of rules) {
    if (rule === "required" && value.trim() === "") return "required"
    if (rule === "alphanumeric" && value && !/^[a-zA-Z0-9]+$/.test(value)) {
      return "alphanumeric"
    }
    if (rule === "complexPassword" && value) {
      if (
        !/[a-z]/.test(value) ||
        !/[A-Z]/.test(value) ||
        !/[0-9]/.test(value) ||
        !/[^a-zA-Z0-9]/.test(value)
      ) {
        return "complexPassword"
      }
    }
  }
  return null
}

/* -------------------------------------------------------------------------- */
/*  Values                                                                     */
/* -------------------------------------------------------------------------- */

export function toTextValue(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean") return value ? "1" : "0"
  return ""
}

export function isMutationAdmission(
  value: unknown
): value is CustomTableMutationAdmission {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<CustomTableMutationAdmission>
  return (
    typeof candidate.mutationId === "number" &&
    (candidate.mutationType === "create" ||
      candidate.mutationType === "update") &&
    typeof candidate.status === "string"
  )
}

/* -------------------------------------------------------------------------- */
/*  Columns                                                                    */
/* -------------------------------------------------------------------------- */

export function mapColumnToFormConfig(
  column: CustomTableColumn
): FormFieldConfig {
  const type = column.inputField?.type ?? "dynamicText"
  const required = isRequired(column)
  const base = {
    name: column.name,
    label: column.title || column.name,
    required,
    generatePassword: column.inputField?.params?.generatePassword === true,
    generatedPasswordLength:
      typeof column.inputField?.params?.generatedPasswordLength === "number"
        ? column.inputField.params.generatedPasswordLength
        : undefined,
    generatePasswordLabel: "Generate password"
  }

  if (type === "switch") return { ...base, type: "toggle" }

  if (type === "selector") {
    const menuItems =
      (column.inputField?.params?.menuItems as
        Record<string, string> | undefined) ?? {}
    return {
      ...base,
      type: "select",
      options: Object.entries(menuItems).map(([value, label]) => ({
        value,
        label
      }))
    }
  }

  if (
    type === "password" ||
    type === "passwordAlphaNumeric" ||
    type === "complexPassword"
  ) {
    return { ...base, type: "password" }
  }

  if (type === "number") return { ...base, type: "number" }

  return { ...base, type: "text" }
}

export function isExternalLinkColumn(column: CustomTableColumn): boolean {
  const fieldType = column.type ?? column.inputField?.type
  return fieldType === "externalURL" || fieldType === "clientURL"
}

export function isPasswordLikeColumn(column: CustomTableColumn): boolean {
  const fieldType = column.type ?? column.inputField?.type
  return (
    fieldType === "password" ||
    fieldType === "passwordAlphaNumeric" ||
    fieldType === "complexPassword"
  )
}

export function isSensitiveColumn(column: CustomTableColumn): boolean {
  return column.sensitive === true || isPasswordLikeColumn(column)
}

export function isRevealableColumn(column: CustomTableColumn): boolean {
  return column.revealable === true || isPasswordLikeColumn(column)
}

export function isDataColumn(column: CustomTableColumn): boolean {
  return (
    column.name.endsWith(":value") &&
    column.type !== "buttonAction" &&
    column.type !== "action"
  )
}

export function shouldPreserveRedactedSensitiveValue(
  column: CustomTableColumn,
  row: CustomTableRow | null,
  value: string
): boolean {
  return (
    row !== null &&
    isSensitiveColumn(column) &&
    value === "" &&
    toTextValue(row[column.name]) === REDACTED_SECRET_VALUE
  )
}

/* -------------------------------------------------------------------------- */
/*  Listing                                                                    */
/* -------------------------------------------------------------------------- */

/** Rows per page to start with: the table's row limit, kept between 10 and 50. */
export function initialPageSize(maxRows: number | undefined): number {
  return Math.max(10, Math.min(maxRows ?? 25, 50))
}

/** The page sizes on offer, always including the one in use. */
export function pageSizeOptions(pageSize: number): number[] {
  return Array.from(new Set([pageSize, 10, 20, 50, 100])).sort((a, b) => a - b)
}

/** Whether a cell's text contains the search text, ignoring case. */
export function matchesSearch(
  row: CustomTableRow,
  column: string,
  needle: string
) {
  return toTextValue(row[column]).toLowerCase().includes(needle)
}

/** Orders two rows by one column's text: case-insensitive, digits by value. */
export function compareRows(
  a: CustomTableRow,
  b: CustomTableRow,
  column: string
): number {
  return toTextValue(a[column]).localeCompare(
    toTextValue(b[column]),
    undefined,
    { numeric: true, sensitivity: "base" }
  )
}
