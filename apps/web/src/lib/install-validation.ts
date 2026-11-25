import type { CustomField } from "@/api/apps/app-store"
import type { ConditionalFieldMetadata } from "@/lib/dynamic-form"

export interface InstallFieldIssue {
  code: string
  message: string
  count?: number
}

export function validateInstallField(
  value: string,
  field: CustomField
): InstallFieldIssue | null {
  const rules = field.validate ?? []
  if (!Array.isArray(rules))
    return {
      code: "configuration",
      message: "Invalid installation field configuration."
    }
  const required = rules.includes("required")
  if (value.trim() === "")
    return required
      ? { code: "required", message: "This field is required." }
      : null
  const issue = (
    code: string,
    message: string,
    count?: number
  ): InstallFieldIssue => ({ code, message, count })
  // Keep ordering aligned with API validation: length, type, then server regex.
  for (const rule of rules) {
    if (typeof rule !== "object") continue
    if (rule.minLength != null && value.length < rule.minLength)
      return issue("minLength", "This value is too short.", rule.minLength)
    if (
      rule.maxLength != null &&
      rule.maxLength > 0 &&
      value.length > rule.maxLength
    )
      return issue("maxLength", "This value is too long.", rule.maxLength)
  }
  for (const rule of rules) {
    switch (rule) {
      case "alphanumeric":
        if (!/^[a-zA-Z0-9]+$/.test(value))
          return issue("alphanumeric", "Only letters and numbers are allowed.")
        break
      case "notOnlyAlpha":
        if (/^[a-zA-Z]+$/.test(value))
          return issue("notOnlyAlpha", "Include a number or special character.")
        break
      case "complexPassword":
        if (!/[a-z]/.test(value))
          return issue("lowercase", "Include a lowercase letter.")
        if (!/[A-Z]/.test(value))
          return issue("uppercase", "Include an uppercase letter.")
        if (!/[0-9]/.test(value)) return issue("number", "Include a number.")
        if (!/[^a-zA-Z0-9]/.test(value))
          return issue("specialChar", "Include a special character.")
        break
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return issue("email", "Enter a valid email address.")
        break
      case "date": {
        const parts = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value)
        if (!parts)
          return issue("date", "Enter a valid date in YYYY-MM-DD format.")
        const year = Number(parts[1]),
          month = Number(parts[2]),
          day = Number(parts[3])
        const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
        const days = [
          31,
          leap ? 29 : 28,
          31,
          30,
          31,
          30,
          31,
          31,
          30,
          31,
          30,
          31
        ]
        if (
          year < 1 ||
          month < 1 ||
          month > 12 ||
          day < 1 ||
          day > days[month - 1]
        )
          return issue("date", "Enter a valid date in YYYY-MM-DD format.")
        break
      }
    }
  }
  // Catalogue matches rules are PCRE and are evaluated exclusively by preflight.
  return null
}

type Condition = {
  field: string
  operator?: string
  value?: unknown
  values?: unknown[]
}
/** What the conditions read from a field: its own conditions and its default value. */
type ConditionalField = ConditionalFieldMetadata & { defaultValue?: unknown }
const configError = () =>
  new Error(
    "This app has an invalid installation field configuration. Please contact support."
  )
const normalize = (value: unknown): string =>
  typeof value === "boolean"
    ? value
      ? "1"
      : "0"
    : value == null
      ? ""
      : String(value)
const scalar = (value: unknown) =>
  value == null || ["string", "number", "boolean"].includes(typeof value)

function conditions(field: ConditionalFieldMetadata): Condition[] {
  const metadata = field as unknown as Record<string, unknown>
  const legacy = metadata.condition
  const raw =
    metadata.conditions ??
    metadata.visibleWhen ??
    (legacy && typeof legacy === "object" && "visibleWhen" in legacy
      ? legacy.visibleWhen
      : legacy)
  if (raw == null || raw === "") return []
  const list = Array.isArray(raw) ? raw : [raw]
  if (list.length === 0) throw configError()
  for (const item of list) {
    if (!item || typeof item !== "object" || typeof item.field !== "string")
      throw configError()
    const op = item.operator ?? "equals"
    if (
      ![
        "equals",
        "notEquals",
        "not_equals",
        "in",
        "notIn",
        "not_in",
        "truthy",
        "falsy"
      ].includes(op)
    )
      throw configError()
    if (
      ["equals", "notEquals", "not_equals"].includes(op) &&
      !("value" in item)
    )
      throw configError()
    if (
      ["in", "notIn", "not_in"].includes(op) &&
      !Array.isArray(item.values ?? item.value)
    )
      throw configError()
    if (
      ["equals", "notEquals", "not_equals"].includes(op) &&
      !scalar(item.value)
    )
      throw configError()
    if (!scalar(item.value) && !Array.isArray(item.value)) throw configError()
    const members = item.values ?? (Array.isArray(item.value) ? item.value : [])
    if (!Array.isArray(members) || !members.every(scalar)) throw configError()
  }
  return list
}

/**
 * Evaluates each field once, when it is first read. A field whose conditions
 * are malformed, read a field that is not there or read themselves throws the
 * configuration error, and so does every field that reads it.
 */
function createFieldActivity(
  fields: Record<string, ConditionalField>,
  values: Record<string, unknown>
) {
  const active: Record<string, boolean> = {}
  const visiting = new Set<string>()
  const conditionsMet = (metadata: ConditionalFieldMetadata): boolean => {
    let visible = true
    for (const condition of conditions(metadata)) {
      const sourceActive = visit(condition.field)
      const raw =
        values[condition.field] ?? fields[condition.field].defaultValue ?? ""
      if (!scalar(raw)) {
        visible = false
        continue
      }
      const actual = normalize(raw),
        expected = normalize(scalar(condition.value) ? condition.value : null)
      const candidates = (
        condition.values ??
        (Array.isArray(condition.value) ? condition.value : [])
      ).map(normalize)
      let matches: boolean
      switch (condition.operator ?? "equals") {
        case "notEquals":
        case "not_equals":
          matches = actual !== expected
          break
        case "in":
          matches = candidates.includes(actual)
          break
        case "notIn":
        case "not_in":
          matches = !candidates.includes(actual)
          break
        case "truthy":
          matches = !["", "0", "false"].includes(actual)
          break
        case "falsy":
          matches = ["", "0", "false"].includes(actual)
          break
        default:
          matches = actual === expected
      }
      visible = visible && sourceActive && matches
    }
    return visible
  }
  const visit = (name: string): boolean => {
    if (Object.hasOwn(active, name)) return active[name]
    if (!Object.hasOwn(fields, name) || visiting.has(name)) throw configError()
    visiting.add(name)
    try {
      return (active[name] = conditionsMet(fields[name]))
    } finally {
      visiting.delete(name)
    }
  }
  return { visit, conditionsMet }
}

/** Which install fields are active. Throws if any field's conditions are invalid. */
export function getInstallFieldActivity(
  fields: Record<string, ConditionalField>,
  values: Record<string, unknown>
): Record<string, boolean> {
  const { visit } = createFieldActivity(fields, values)
  return Object.fromEntries(
    Object.keys(fields).map((name) => [name, visit(name)])
  )
}

function holds(evaluate: () => boolean) {
  try {
    return evaluate()
  } catch {
    return false
  }
}

/**
 * The same rules for an installed app's own screens (its values, buttons and
 * tables), where one invalid condition should not hide everything: a field
 * the install check would refuse is inactive, with every field that reads it.
 */
export function getFieldActivity(
  fields: Record<string, ConditionalField>,
  values: Record<string, unknown>
): Record<string, boolean> {
  const { visit } = createFieldActivity(fields, values)
  return Object.fromEntries(
    Object.keys(fields).map((name) => [name, holds(() => visit(name))])
  )
}

/** Whether something other than a field, such as an app's button, shows by its conditions on the fields. */
export function fieldConditionsMet(
  metadata: ConditionalFieldMetadata,
  fields: Record<string, ConditionalField>,
  values: Record<string, unknown>
): boolean {
  return holds(() =>
    createFieldActivity(fields, values).conditionsMet(metadata)
  )
}

function clearInactiveValues(
  fields: Record<string, ConditionalField>,
  values: Record<string, string>,
  active: Record<string, boolean>
) {
  const next = { ...values }
  for (const [name, field] of Object.entries(fields)) {
    if (field.clearWhenHidden && !active[name]) next[name] = ""
  }
  return next
}

export function clearInactiveInstallValues(
  fields: Record<string, ConditionalField>,
  values: Record<string, string>
) {
  return clearInactiveValues(
    fields,
    values,
    getInstallFieldActivity(fields, values)
  )
}

/** Empties fields marked clearWhenHidden that are inactive, by the rules of `getFieldActivity`. */
export function clearInactiveFieldValues(
  fields: Record<string, ConditionalField>,
  values: Record<string, string>
) {
  return clearInactiveValues(fields, values, getFieldActivity(fields, values))
}

export function validInstallSubdomain(value: string): boolean {
  return value.length <= 63 && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(value)
}

/** Results are usable only until the form changes or a newer request starts. */
export function createInstallValidationSession() {
  let revision = 0
  return {
    invalidate() {
      revision++
    },
    async run<T>(request: () => Promise<T>): Promise<T | null> {
      const current = ++revision
      try {
        const result = await request()
        return current === revision ? result : null
      } catch (error) {
        if (current !== revision) return null
        throw error
      }
    }
  }
}
