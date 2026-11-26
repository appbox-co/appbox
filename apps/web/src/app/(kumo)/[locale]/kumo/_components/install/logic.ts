/**
 * Pure helpers for the install dialog, taken from the current design so both
 * dialogs decide the same things:
 *
 * - appstore/_components/install-dialog.tsx
 * - appstore/_components/domain-section.tsx
 * - components/dashboard/boost-slider.tsx
 * - components/dashboard/base-domain-selector.tsx
 * - components/dashboard/domain/dns-verification-panel.tsx
 *
 * Most are copied unchanged. These differ:
 *
 * - `validateField` checks a value with the shared rules in
 *   lib/install-validation.ts and turns what they find into the dialog's
 *   translated messages.
 * - `isFieldRequired` treats rules that are not a list as no rules.
 * - `mapCustomFieldToFormConfig` gives a date field a YYYY-MM-DD placeholder.
 * - `isSwitchChecked` came from components/ui/switch.tsx, which is gone.
 *
 * Nothing in here renders. Until the current design is removed, change the
 * originals and this file together.
 */

import type { CustomField } from "@/api/apps/app-store"
import type { CyloSummary } from "@/api/cylos/cylos"
import type { Cylo } from "@/lib/auth/session"
import { validateInstallField } from "@/lib/install-validation"
import type { FormFieldConfig } from "@/types/dashboard"

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const MARKETING_URL = "/"

export const SKIP_INPUT_TYPES = new Set([
  "hidden",
  "spacer",
  "generatedPassword"
])

export const PASSWORD_INPUT_TYPES = new Set([
  "password",
  "passwordAlphaNumeric",
  "complexPassword"
])

export const DNS_VERIFICATION_ERROR_CODE = 2080

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type InstallGuardType =
  "disabled" | "no_cylo" | "restricted" | "no_slots" | "no_multi"

export interface InstallGuard {
  type: InstallGuardType
  message: string
  actionLabel?: string
  actionUrl?: string
}

export interface ParsedInstallError {
  title: string
  details: string[]
  fieldErrors: Record<string, string>
  codes: number[]
}

/* -------------------------------------------------------------------------- */
/*  Appboxes                                                                   */
/* -------------------------------------------------------------------------- */

export function mergeCyloWithSummary(
  summary: CyloSummary,
  existing: Cylo | undefined,
  userId: number
): Cylo {
  return {
    id: summary.id,
    user_id: existing?.user_id ?? userId,
    server_id: existing?.server_id ?? summary.server_id ?? 0,
    server_name: summary.server_name || existing?.server_name || "",
    display_name: summary.name || existing?.display_name || "",
    package_id: existing?.package_id ?? 0,
    package_name: summary.package_name || existing?.package_name || "",
    domain: summary.domain || existing?.domain || "",
    domain_id: existing?.domain_id ?? summary.domain_id ?? 0,
    server_ip: summary.server_ip || existing?.server_ip || "",
    status: summary.status || existing?.status || "unknown",
    disk_quota: existing?.disk_quota ?? summary.storage_total ?? 0,
    disk_used: summary.storage_used ?? existing?.disk_used ?? 0,
    app_slots: summary.app_slots_total,
    app_slots_used: summary.app_slots_used,
    resource_multiplier:
      summary.resource_multiplier ?? existing?.resource_multiplier ?? 1,
    whmcs_serviceid: summary.whmcs_serviceid || existing?.whmcs_serviceid || "",
    created_at: summary.created_at || existing?.created_at || ""
  }
}

/* -------------------------------------------------------------------------- */
/*  Install errors                                                             */
/* -------------------------------------------------------------------------- */

function toSentenceCaseFromKey(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function splitErrorMessage(message: string): string[] {
  return message
    .split(/\s*\|\s*|\n+/g)
    .map((part) => part.trim())
    .filter(Boolean)
}

function getDomainConflictMessage(message: string): string | undefined {
  const normalized = message.toLowerCase()
  const isDomainConflict =
    normalized.includes("domains_domain_uindex") ||
    normalized.includes("key (domain)") ||
    (normalized.includes("domain") &&
      (normalized.includes("already in use") ||
        normalized.includes("already exists") ||
        normalized.includes("duplicate key")))

  if (isDomainConflict) {
    return "This domain is already in use. Choose another domain or remove it from the existing app first."
  }
}

export function parseInstallError(
  error: unknown,
  fallbackTitle: string,
  customFields: Record<string, CustomField>
): ParsedInstallError {
  const fieldKeyLookup = new Map(
    Object.keys(customFields).map((key) => [key.toLowerCase(), key])
  )

  const details: string[] = []
  const fieldErrors: Record<string, string> = {}
  const codes: number[] = []
  let title = fallbackTitle

  const pushMessage = (raw: string) => {
    const cleaned = raw.trim()
    if (!cleaned) return

    const domainConflictMessage = getDomainConflictMessage(cleaned)
    if (domainConflictMessage) {
      details.push(domainConflictMessage)
      return
    }

    if (/\bsqlstate\b/i.test(cleaned) || /^detail:\s*key\s*\(/i.test(cleaned)) {
      return
    }

    const customFieldMatch = cleaned.match(
      /^Custom Field\s+([A-Za-z0-9_]+)\s+(.+)$/i
    )

    if (customFieldMatch) {
      const backendFieldKey = customFieldMatch[1]
      const normalizedBackendKey = backendFieldKey.toLowerCase()
      const matchedFieldKey = fieldKeyLookup.get(normalizedBackendKey)
      const rawFieldMessage = customFieldMatch[2].replace(/\s+/g, " ").trim()
      const fieldLabel = matchedFieldKey
        ? customFields[matchedFieldKey]?.label ||
          toSentenceCaseFromKey(matchedFieldKey)
        : toSentenceCaseFromKey(backendFieldKey)
      const displayMessage = `${fieldLabel} ${rawFieldMessage}`

      details.push(displayMessage)
      if (matchedFieldKey) {
        fieldErrors[matchedFieldKey] = rawFieldMessage
      }
      return
    }

    if (/^[\w./-]+\.php$/i.test(cleaned) || /^line\s*[:=]/i.test(cleaned)) {
      return
    }

    details.push(cleaned)
  }

  const parseRawMessage = (rawMessage: string) => {
    const trimmed = rawMessage.trim()
    if (!trimmed) return

    try {
      const parsed = JSON.parse(trimmed) as {
        error?: {
          code?: number
          message?: string
          status?: number
        }
        message?: string
      }

      if (parsed?.error?.status != null) {
        title = `${fallbackTitle} (Error ${parsed.error.status})`
      }
      if (parsed?.error?.code != null) {
        codes.push(parsed.error.code)
      }

      const apiMessage = parsed?.error?.message
      const genericMessage = parsed?.message

      if (apiMessage) splitErrorMessage(apiMessage).forEach(pushMessage)
      if (!apiMessage && genericMessage) {
        splitErrorMessage(genericMessage).forEach(pushMessage)
      }
      return
    } catch {
      splitErrorMessage(trimmed).forEach(pushMessage)
    }
  }

  if (error instanceof Error) {
    parseRawMessage(error.message)
  } else if (typeof error === "string") {
    parseRawMessage(error)
  }

  if (details.length === 0) {
    details.push(fallbackTitle)
  }

  return {
    title,
    details: [...new Set(details)],
    fieldErrors,
    codes
  }
}

export function findDnsInstallError(
  error: ParsedInstallError
): string | undefined {
  if (error.codes.includes(DNS_VERIFICATION_ERROR_CODE)) {
    return (
      error.details.find((detail) => /dns verification failed/i.test(detail)) ||
      error.details[0]
    )
  }

  return error.details.find((detail) => /dns verification failed/i.test(detail))
}

/* -------------------------------------------------------------------------- */
/*  Validation                                                                 */
/* -------------------------------------------------------------------------- */

export type TranslateFn = (
  key: string,
  values?: Record<string, string | number>
) => string

export function validateField(
  value: string,
  field: CustomField,
  t: TranslateFn
): string | null {
  const issue = validateInstallField(value, field)
  if (!issue) return null
  if (issue.code === "configuration") return issue.message
  if (issue.code === "date")
    return t("install.validation.invalidDate") + " (YYYY-MM-DD)"
  const key = issue.code === "email" ? "invalidEmail" : issue.code
  return t(
    "install.validation." + key,
    issue.count == null ? undefined : { count: issue.count }
  )
}

export function isFieldRequired(field: CustomField): boolean {
  if (!Array.isArray(field.validate)) return false
  return field.validate.some((r) => r === "required")
}

export function mapCustomFieldToFormConfig(
  fname: string,
  field: CustomField
): FormFieldConfig | null {
  const required = isFieldRequired(field)
  const base = {
    name: fname,
    label: field.label,
    required,
    generatePassword: field.params?.generatePassword === true,
    generatedPasswordLength:
      typeof field.params?.generatedPasswordLength === "number"
        ? field.params.generatedPasswordLength
        : undefined,
    generatePasswordLabel: "Generate password"
  }

  const type = field.type
  if (type === "selector") {
    const menuItems = field.params?.menuItems as
      Record<string, string> | undefined
    return {
      ...base,
      type: "select",
      options: menuItems
        ? Object.entries(menuItems).map(([value, label]) => ({ value, label }))
        : []
    }
  }

  if (PASSWORD_INPUT_TYPES.has(type)) {
    return { ...base, type: "password" }
  }

  if (type === "email") return { ...base, type: "email" }
  if (type === "date")
    return { ...base, type: "text", placeholder: "YYYY-MM-DD" }
  if (type === "number") return { ...base, type: "number" }

  // dynamicText, alphaNumeric, and unknown text-like inputs
  return { ...base, type: "text" }
}

/* -------------------------------------------------------------------------- */
/*  Field values                                                               */
/* -------------------------------------------------------------------------- */

export function isSwitchChecked(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (typeof value !== "string") return false

  const normalizedValue = value.trim().toLowerCase()
  return normalizedValue === "1" || normalizedValue === "true"
}

/**
 * What a form control hands back, turned into the string the dialog stores.
 * In the current design this is the body of the `onChange` adapter that
 * CustomFieldInput passes to FormFieldRenderer; it is lifted out unchanged.
 */
export function toFieldValue(
  next: string | number | boolean | { target?: { value?: unknown } } | undefined
): string {
  if (typeof next === "string" || typeof next === "number") {
    return String(next)
  }
  if (typeof next === "boolean") {
    return next ? "1" : "0"
  }
  const targetValue = next?.target?.value
  if (typeof targetValue === "string" || typeof targetValue === "number") {
    return String(targetValue)
  }
  return ""
}

/* -------------------------------------------------------------------------- */
/*  Boost                                                                      */
/* -------------------------------------------------------------------------- */

export function clampBoost(value: number, max: number) {
  return Math.max(0, Math.min(value, Math.max(0, max)))
}

export function calcMultiplier(
  slots: number,
  boostIncrement: number,
  maxBoostMultiplier: number
) {
  return Math.min(1 + slots * boostIncrement, maxBoostMultiplier)
}

export function formatFixed(value: number, fraction = 1) {
  return Number.isFinite(value) ? value.toFixed(fraction) : "0.0"
}

export function formatResourcePreview(
  value: number,
  baseValue: number,
  fraction = 2
) {
  if (baseValue === 0) return "∞"
  return formatFixed(value, fraction)
}

export function formatMemoryPreview(value: number, baseValue: number) {
  if (baseValue === 0) return "∞"
  return `${formatFixed(value, 2)} GB`
}

/* -------------------------------------------------------------------------- */
/*  Domains                                                                    */
/* -------------------------------------------------------------------------- */

export const SUBDOMAIN_VALIDATION_FAILED =
  "Unable to validate the subdomain right now."

const BLOCKED_SUFFIXES = [
  "appboxes.co",
  "appbox.co",
  "abx.bz",
  "cylo.io",
  "cylo.net"
]

export function isBlockedDomain(domain: string): boolean {
  const lower = domain.toLowerCase().trim()
  return BLOCKED_SUFFIXES.some(
    (suffix) => lower === suffix || lower.endsWith(`.${suffix}`)
  )
}

export function getSafeAddDomainError(
  error: unknown,
  fallback: string,
  domainConflictMessage: string
): string {
  const message = error instanceof Error ? error.message : ""
  const normalized = message.toLowerCase()
  const isDomainConflict =
    normalized.includes("domains_domain_uindex") ||
    normalized.includes("key (domain)") ||
    (normalized.includes("domain") &&
      (normalized.includes("already in use") ||
        normalized.includes("already exists") ||
        normalized.includes("duplicate key")))

  if (isDomainConflict) {
    return domainConflictMessage
  }

  if (message && !normalized.includes("sqlstate")) {
    return message
  }

  return fallback
}

/* -------------------------------------------------------------------------- */
/*  DNS providers                                                              */
/* -------------------------------------------------------------------------- */

export interface DnsProvider {
  id: string
  name: string
  url: string
  steps: (host: string, ip: string) => string[]
}

export const DNS_PROVIDERS: DnsProvider[] = [
  {
    id: "cloudflare",
    name: "Cloudflare",
    url: "https://dash.cloudflare.com",
    steps: (host, ip) => [
      `Log in to dash.cloudflare.com and select your domain.`,
      `Go to DNS -> Records -> Add record.`,
      `Set Type to A, Name to "${host}", IPv4 address to ${ip}.`,
      `Set Proxy status to "DNS only" (grey cloud) - not proxied.`,
      `Click Save.`
    ]
  },
  {
    id: "namecheap",
    name: "Namecheap",
    url: "https://namecheap.com",
    steps: (host, ip) => [
      `Log in to namecheap.com -> Domain List -> Manage your domain.`,
      `Click the Advanced DNS tab.`,
      `Under Host Records click Add New Record.`,
      `Set Type to A Record, Host to "${host}", Value to ${ip}, TTL to Automatic.`,
      `Click the green checkmark to save.`
    ]
  },
  {
    id: "godaddy",
    name: "GoDaddy",
    url: "https://godaddy.com",
    steps: (host, ip) => [
      `Log in to godaddy.com -> My Products -> DNS next to your domain.`,
      `Under DNS Records click Add.`,
      `Set Type to A, Name to "${host}", Value to ${ip}, TTL to 1 hour.`,
      `Click Save.`
    ]
  },
  {
    id: "squarespace",
    name: "Squarespace",
    url: "https://squarespace.com",
    steps: (host, ip) => [
      `Log in to account.squarespace.com -> Domains -> your domain.`,
      `Click DNS Settings -> Custom Records -> Add Record.`,
      `Set Type to A, Host to "${host}", Data to ${ip}.`,
      `Click Save.`
    ]
  },
  {
    id: "route53",
    name: "AWS Route 53",
    url: "https://console.aws.amazon.com/route53",
    steps: (host, ip) => [
      `Open the Route 53 console -> Hosted zones -> your domain.`,
      `Click Create record.`,
      `Set Record name to "${host}", Type to A, Value to ${ip}, TTL to 300.`,
      `Click Create records.`
    ]
  },
  {
    id: "digitalocean",
    name: "DigitalOcean",
    url: "https://cloud.digitalocean.com/networking/domains",
    steps: (host, ip) => [
      `Log in to DigitalOcean -> Networking -> Domains -> your domain.`,
      `Select A from the record type dropdown.`,
      `Set Hostname to "${host}", Will Direct To to ${ip}, TTL to 3600.`,
      `Click Create Record.`
    ]
  },
  {
    id: "other",
    name: "Other provider",
    url: "",
    steps: (host, ip) => [
      `Log in to your DNS provider control panel.`,
      `Find the DNS management section for your domain.`,
      `Create a new A record with Host/Name "${host}" pointing to ${ip}.`,
      `Set TTL to 300 or Automatic if available.`,
      `Save and click Verify DNS below.`
    ]
  }
]
