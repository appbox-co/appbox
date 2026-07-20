export type DynamicFormValues = Record<string, string>

export interface FieldCondition {
  field: string
  operator?: "equals" | "notEquals" | "in" | "notIn" | "truthy" | "falsy"
  value?: unknown
  values?: unknown[]
}

export interface ConditionalFieldMetadata {
  visibleWhen?: FieldCondition | FieldCondition[]
  clearWhenHidden?: boolean
}

function normalize(value: unknown): string {
  if (typeof value === "boolean") return value ? "1" : "0"
  if (value == null) return ""
  return String(value)
}

function conditionMatches(
  condition: FieldCondition,
  values: DynamicFormValues
) {
  const actual = normalize(values[condition.field])
  const expected = normalize(condition.value)
  const candidates = (condition.values ?? []).map(normalize)

  switch (condition.operator ?? "equals") {
    case "notEquals":
      return actual !== expected
    case "in":
      return candidates.includes(actual)
    case "notIn":
      return !candidates.includes(actual)
    case "truthy":
      return actual !== "" && actual !== "0" && actual !== "false"
    case "falsy":
      return actual === "" || actual === "0" || actual === "false"
    default:
      return actual === expected
  }
}

export function isFieldVisible(
  metadata: ConditionalFieldMetadata | undefined,
  values: DynamicFormValues
): boolean {
  const conditions = metadata?.visibleWhen
  if (!conditions) return true
  const list = Array.isArray(conditions) ? conditions : [conditions]
  return list.every((condition) => conditionMatches(condition, values))
}

export function clearHiddenFieldValues<T extends ConditionalFieldMetadata>(
  fields: Array<[string, T]>,
  values: DynamicFormValues
): DynamicFormValues {
  const next = { ...values }
  for (const [name, field] of fields) {
    if (field.clearWhenHidden && !isFieldVisible(field, next)) {
      next[name] = ""
    }
  }
  return next
}

export function generateSecurePassword(length = 24): string {
  const safeLength = Math.max(12, Math.min(128, Math.floor(length)))
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+="
  const random = new Uint32Array(safeLength)
  globalThis.crypto.getRandomValues(random)
  return Array.from(random, (value) => alphabet[value % alphabet.length]).join(
    ""
  )
}
