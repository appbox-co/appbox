/**
 * Pure helpers for an installed app's actions, copied verbatim from the
 * current design so both pages behave the same:
 *
 * - appboxmanager/installedapps/[id]/_components/app-actions.tsx
 *
 * Nothing in here renders. Change the original and this file together.
 */

import type { ConditionalFieldMetadata } from "@/lib/dynamic-form"
import type { FormFieldConfig } from "@/types/dashboard"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type ButtonFieldValidation =
  | string
  | {
      name?: string
      params?: Record<string, unknown>
      minLength?: number
      maxLength?: number
    }

export type ButtonField = ConditionalFieldMetadata & {
  label: string
  type: string
  width?: number
  defaultValue?: string | number | boolean
  validate?: ButtonFieldValidation[]
  params?: {
    menuItems?: Record<string, string>
    regex?: string
    errorText?: string
    [key: string]: unknown
  }
}

export type TranslateFn = (
  key: string,
  values?: Record<string, string | number>
) => string

/* -------------------------------------------------------------------------- */
/*  Custom button fields                                                       */
/* -------------------------------------------------------------------------- */

export const HIDDEN_BUTTON_FIELD_TYPES = new Set([
  "hidden",
  "spacer",
  "generatedPassword"
])
const PASSWORD_BUTTON_FIELD_TYPES = new Set([
  "password",
  "passwordAlphaNumeric",
  "complexPassword"
])

function isButtonFieldRequired(field: ButtonField): boolean {
  if (!field.validate) return false
  return field.validate.some((r) => r === "required")
}

export function mapButtonFieldToConfig(
  name: string,
  field: ButtonField
): FormFieldConfig {
  const required = isButtonFieldRequired(field)
  const base = {
    name,
    label: field.label,
    required,
    generatePassword: field.params?.generatePassword === true,
    generatedPasswordLength:
      typeof field.params?.generatedPasswordLength === "number"
        ? field.params.generatedPasswordLength
        : undefined,
    generatePasswordLabel: "Generate password"
  }

  if (field.type === "selector") {
    const menuItems = field.params?.menuItems
    return {
      ...base,
      type: "select",
      options: menuItems
        ? Object.entries(menuItems).map(([value, label]) => ({ value, label }))
        : []
    }
  }

  if (field.type === "switch") {
    return { ...base, type: "toggle" }
  }

  if (field.type === "textArea") {
    return { ...base, type: "textarea" }
  }

  if (PASSWORD_BUTTON_FIELD_TYPES.has(field.type)) {
    return { ...base, type: "password" }
  }

  if (field.type === "email") return { ...base, type: "email" }
  if (field.type === "number") return { ...base, type: "number" }

  // Fallback for dynamicText/search/date/staticText and unknown text-like fields.
  return { ...base, type: "text" }
}

export function validateButtonField(
  value: string,
  field: ButtonField,
  t: TranslateFn
): string | null {
  const rules = field.validate
  if (!rules || rules.length === 0) return null

  for (const rule of rules) {
    if (typeof rule === "string") {
      switch (rule) {
        case "required":
          if (!value || value.trim() === "")
            return t("customButtonValidation.required")
          break
        case "alphanumeric":
          if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
            return t("customButtonValidation.alphanumeric")
          }
          break
        case "notOnlyAlpha":
          if (value && /^[a-zA-Z]+$/.test(value)) {
            return t("customButtonValidation.notOnlyAlpha")
          }
          break
        case "complexPassword":
          if (value) {
            if (!/[a-z]/.test(value))
              return t("customButtonValidation.lowercase")
            if (!/[A-Z]/.test(value))
              return t("customButtonValidation.uppercase")
            if (!/[0-9]/.test(value)) return t("customButtonValidation.number")
            if (!/[^a-zA-Z0-9]/.test(value)) {
              return t("customButtonValidation.specialChar")
            }
          }
          break
        case "email":
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return t("customButtonValidation.invalidEmail")
          }
          break
        case "date":
          if (value && isNaN(Date.parse(value)))
            return t("customButtonValidation.invalidDate")
          break
        case "domain":
        case "depends":
          break
      }
    } else if (typeof rule === "object") {
      if (rule.minLength != null && value.length < rule.minLength) {
        return t("customButtonValidation.minLength", { count: rule.minLength })
      }
      if (rule.maxLength != null && value.length > rule.maxLength) {
        return t("customButtonValidation.maxLength", { count: rule.maxLength })
      }
      if (rule.name === "matches" && rule.params) {
        const regex = rule.params.regex as string | undefined
        const errorText =
          (rule.params.errorText as string | undefined) ??
          t("customButtonValidation.invalidFormat")
        if (regex && value) {
          try {
            if (!new RegExp(regex).test(value)) return errorText
          } catch {
            // Ignore invalid backend regex and allow submission.
          }
        }
      }
    }
  }

  return null
}

/* -------------------------------------------------------------------------- */
/*  Versions                                                                   */
/* -------------------------------------------------------------------------- */

export function getVersionTimestamp(version?: {
  created_at?: string
}): number | null {
  if (!version?.created_at) return null
  const timestamp = Date.parse(version.created_at)
  return Number.isNaN(timestamp) ? null : timestamp
}
