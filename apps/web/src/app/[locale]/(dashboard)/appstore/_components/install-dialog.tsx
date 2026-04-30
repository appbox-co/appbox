"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  ExternalLink,
  Loader2,
  Package
} from "lucide-react"
import type { ControllerRenderProps, FieldValues } from "react-hook-form"
import type {
  AppStoreItem,
  CustomField,
  CustomFieldValidation
} from "@/api/apps/app-store"
import {
  computeInstallGuards,
  fetchSearchFieldOptions,
  getAppRestrictions,
  getEffectiveAppSlots,
  getPackages,
  isAppRestrictedForPackage
} from "@/api/apps/app-store"
import {
  useAppBoostInfo,
  useAppDetail,
  useAppVersions,
  useInstallApp
} from "@/api/apps/hooks/use-app-store"
import { useCylosSummary } from "@/api/cylos/hooks/use-cylos"
import { BoostSlider } from "@/components/dashboard/boost-slider"
import { FormFieldRenderer } from "@/components/dashboard/dynamic-form/form-field-renderer"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { isLaunchWeekEnabled } from "@/config/launch-week-flags"
import { ROUTES } from "@/constants/routes"
import type { Cylo } from "@/lib/auth/session"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"
import type { FormFieldConfig } from "@/types/dashboard"
import { useAppDevFlags } from "./app-dev-flags"
import { DomainSection, type DomainSectionState } from "./domain-section"

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const BILLING_BASE_URL = "https://billing.appbox.co"
const MARKETING_URL = "/"

const SKIP_INPUT_TYPES = new Set(["hidden", "spacer", "generatedPassword"])

const PASSWORD_INPUT_TYPES = new Set([
  "password",
  "passwordAlphaNumeric",
  "complexPassword"
])

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type InstallGuardType =
  | "disabled"
  | "no_cylo"
  | "restricted"
  | "no_slots"
  | "no_multi"

interface InstallGuard {
  type: InstallGuardType
  message: string
  actionLabel?: string
  actionUrl?: string
}

interface ParsedInstallError {
  title: string
  details: string[]
  fieldErrors: Record<string, string>
}

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

function parseInstallError(
  error: unknown,
  fallbackTitle: string,
  customFields: Record<string, CustomField>
): ParsedInstallError {
  const fieldKeyLookup = new Map(
    Object.keys(customFields).map((key) => [key.toLowerCase(), key])
  )

  const details: string[] = []
  const fieldErrors: Record<string, string> = {}
  let title = fallbackTitle

  const pushMessage = (raw: string) => {
    const cleaned = raw.trim()
    if (!cleaned) return

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
          message?: string
          status?: number
          developer?: { message?: string }
        }
        message?: string
      }

      if (parsed?.error?.status != null) {
        title = `${fallbackTitle} (Error ${parsed.error.status})`
      }

      const apiMessage = parsed?.error?.message
      const developerMessage = parsed?.error?.developer?.message
      const genericMessage = parsed?.message

      if (apiMessage) splitErrorMessage(apiMessage).forEach(pushMessage)
      if (developerMessage)
        splitErrorMessage(developerMessage).forEach(pushMessage)
      if (!apiMessage && !developerMessage && genericMessage) {
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
    fieldErrors
  }
}

/* -------------------------------------------------------------------------- */
/*  Validation                                                                 */
/* -------------------------------------------------------------------------- */

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>
) => string

function validateField(
  value: string,
  field: CustomField,
  t: TranslateFn
): string | null {
  const rules = field.validate
  if (!rules || rules.length === 0) return null

  for (const rule of rules) {
    if (typeof rule === "string") {
      switch (rule) {
        case "required":
          if (!value || value.trim() === "")
            return t("install.validation.required")
          break
        case "alphanumeric":
          if (value && !/^[a-zA-Z0-9]+$/.test(value))
            return t("install.validation.alphanumeric")
          break
        case "notOnlyAlpha":
          if (value && /^[a-zA-Z]+$/.test(value))
            return t("install.validation.notOnlyAlpha")
          break
        case "complexPassword":
          if (value) {
            if (!/[a-z]/.test(value)) return t("install.validation.lowercase")
            if (!/[A-Z]/.test(value)) return t("install.validation.uppercase")
            if (!/[0-9]/.test(value)) return t("install.validation.number")
            if (!/[^a-zA-Z0-9]/.test(value))
              return t("install.validation.specialChar")
          }
          break
        case "email":
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return t("install.validation.invalidEmail")
          break
        case "date":
          if (value && isNaN(Date.parse(value)))
            return t("install.validation.invalidDate")
          break
        case "domain":
        case "depends":
          break
      }
    } else if (typeof rule === "object") {
      const r = rule as CustomFieldValidation
      if (r.minLength != null && value.length < r.minLength) {
        return t("install.validation.minLength", { count: r.minLength })
      }
      if (r.maxLength != null && value.length > r.maxLength) {
        return t("install.validation.maxLength", { count: r.maxLength })
      }
      if (r.name === "matches" && r.params) {
        const regex = r.params.regex as string | undefined
        const errorText =
          (r.params.errorText as string) ??
          t("install.validation.invalidFormat")
        if (regex && value) {
          try {
            if (!new RegExp(regex).test(value)) return errorText
          } catch {
            // Invalid regex from backend, skip
          }
        }
      }
    }
  }
  return null
}

function isFieldRequired(field: CustomField): boolean {
  if (!field.validate) return false
  return field.validate.some((r) => r === "required")
}

function mapCustomFieldToFormConfig(
  fname: string,
  field: CustomField
): FormFieldConfig | null {
  const required = isFieldRequired(field)
  const base = {
    name: fname,
    label: field.label,
    required
  }

  const type = field.type
  if (type === "selector") {
    const menuItems = field.params?.menuItems as
      | Record<string, string>
      | undefined
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
  if (type === "date") return { ...base, type: "text" }
  if (type === "number") return { ...base, type: "number" }

  // dynamicText, alphaNumeric, and unknown text-like inputs
  return { ...base, type: "text" }
}

/* -------------------------------------------------------------------------- */
/*  Search Field Input (combobox for "search" type custom fields)              */
/* -------------------------------------------------------------------------- */

function SearchFieldInput({
  fname,
  field,
  value,
  error,
  onChange,
  selectedCyloId,
  selectedVersionId,
  customFields,
  fieldValues
}: {
  fname: string
  field: CustomField
  value: string
  error?: string
  onChange: (fname: string, value: string) => void
  selectedCyloId: string
  selectedVersionId?: number
  customFields: Record<string, CustomField>
  fieldValues: Record<string, string>
}) {
  const t = useTranslations("appstore")
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(false)
  const autoSelected = useRef(false)
  const required = isFieldRequired(field)

  const params = field.params ?? {}
  const apiRoute = params.APIRoute as string | undefined
  const submitValue = (params.submitValue as string) ?? "domain"
  const useIfSingleItem = params.useIfSingleItem as boolean | undefined
  const depends = params.depends as
    | Record<string, Record<string, string>>[]
    | undefined

  const buildFilters = useCallback(() => {
    const filters: Record<string, string> = {}
    if (!depends) return filters

    for (const dep of depends) {
      for (const [, mapping] of Object.entries(dep)) {
        if (typeof mapping === "object") {
          for (const [paramKey, sourceField] of Object.entries(mapping)) {
            if (sourceField === "cylo_id" && selectedCyloId) {
              filters[paramKey] = selectedCyloId
            } else if (sourceField in customFields) {
              const resolved =
                fieldValues[sourceField] ??
                String(customFields[sourceField]?.defaultValue ?? "")
              if (resolved) filters[paramKey] = resolved
            }
          }
        }
      }
    }
    if (selectedVersionId && selectedVersionId > 0) {
      filters.version_id = String(selectedVersionId)
    }
    return filters
  }, [depends, selectedCyloId, customFields, fieldValues, selectedVersionId])

  useEffect(() => {
    if (!apiRoute || !selectedCyloId) {
      setOptions([])
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const filters = buildFilters()
        const items = await fetchSearchFieldOptions(apiRoute, filters)
        if (cancelled) return

        const searchKeys = (params.searchItems as string[] | undefined) ?? [
          "domain"
        ]
        const mapped = items.map((item) => ({
          label: searchKeys.map((key) => String(item[key] ?? "")).join(" "),
          value: String(item[submitValue] ?? "")
        }))
        setOptions(mapped)

        if (useIfSingleItem && mapped.length === 1 && !autoSelected.current) {
          autoSelected.current = true
          onChange(fname, mapped[0].value)
        }
      } catch {
        if (!cancelled) setOptions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    return () => {
      cancelled = true
    }
  }, [
    apiRoute,
    selectedCyloId,
    buildFilters,
    params.searchItems,
    submitValue,
    useIfSingleItem,
    fname,
    onChange
  ])

  useEffect(() => {
    autoSelected.current = false
  }, [selectedCyloId, selectedVersionId])

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? value ?? ""

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {field.label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>

      {!selectedCyloId ? (
        <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {t("install.searchField.selectAppboxFirst")}
        </p>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between font-normal",
                !value && "text-muted-foreground",
                error && "border-destructive"
              )}
            >
              {value
                ? selectedLabel
                : t("install.searchField.selectPlaceholder", {
                    label: field.label
                  })}
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            <Command>
              <CommandInput
                placeholder={t("install.searchField.searchPlaceholder", {
                  label: field.label
                })}
              />
              <CommandList>
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <CommandEmpty>
                      {t("install.searchField.noResults")}
                    </CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => {
                            onChange(
                              fname,
                              option.value === value ? "" : option.value
                            )
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              value === option.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Custom Field Input                                                         */
/* -------------------------------------------------------------------------- */

function CustomFieldInput({
  fname,
  field,
  value,
  error,
  onChange,
  selectedCyloId,
  selectedVersionId,
  customFields,
  fieldValues
}: {
  fname: string
  field: CustomField
  value: string
  error?: string
  onChange: (fname: string, value: string) => void
  selectedCyloId: string
  selectedVersionId?: number
  customFields: Record<string, CustomField>
  fieldValues: Record<string, string>
}) {
  const t = useTranslations("appstore")
  const fieldType = field.type

  if (fieldType === "search") {
    return (
      <SearchFieldInput
        fname={fname}
        field={field}
        value={value}
        error={error}
        onChange={onChange}
        selectedCyloId={selectedCyloId}
        selectedVersionId={selectedVersionId}
        customFields={customFields}
        fieldValues={fieldValues}
      />
    )
  }

  if (fieldType === "staticText") {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{field.label}</Label>
        <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {field.defaultValue ?? "—"}
        </p>
      </div>
    )
  }

  if (fieldType === "spacer" || fieldType === "hidden") {
    return null
  }

  if (fieldType === "clientURL" || fieldType === "externalURL") {
    const params = field.params ?? {}
    const paramUrl = typeof params.URL === "string" ? params.URL : ""
    const urlValue = String(
      value || field.defaultValue || paramUrl || ""
    ).trim()
    const href =
      urlValue && !/^https?:\/\//i.test(urlValue)
        ? `https://${urlValue}`
        : urlValue

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{field.label}</Label>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={urlValue}
            className={cn("font-mono text-xs")}
          />
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border px-2 py-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Open URL"
            >
              <ExternalLink className="size-4" />
            </a>
          ) : null}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  if (fieldType === "switch") {
    const isOn = value === "1" || value === "true"
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">{field.label}</Label>
          <button
            type="button"
            role="switch"
            aria-checked={isOn}
            onClick={() => onChange(fname, isOn ? "0" : "1")}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
              isOn ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                isOn ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
        {field.params?.menuItems && (
          <span className="ml-2 text-xs text-muted-foreground">
            {isOn
              ? (field.params.menuItems["1"] ?? t("install.field.enabled"))
              : (field.params.menuItems["0"] ?? t("install.field.disabled"))}
          </span>
        )}
      </div>
    )
  }

  const config = mapCustomFieldToFormConfig(fname, field)
  if (!config) return null

  const controllerField = {
    name: fname,
    value,
    onBlur: () => undefined,
    ref: () => undefined,
    onChange: (
      next:
        | string
        | number
        | boolean
        | { target?: { value?: unknown } }
        | undefined
    ) => {
      if (typeof next === "string" || typeof next === "number") {
        onChange(fname, String(next))
        return
      }
      if (typeof next === "boolean") {
        onChange(fname, next ? "1" : "0")
        return
      }
      const targetValue = next?.target?.value
      if (typeof targetValue === "string" || typeof targetValue === "number") {
        onChange(fname, String(targetValue))
        return
      }
      onChange(fname, "")
    }
  } as unknown as ControllerRenderProps<FieldValues, string>

  return (
    <FormFieldRenderer config={config} field={controllerField} error={error} />
  )
}

/* -------------------------------------------------------------------------- */
/*  Install Guard Banner                                                       */
/* -------------------------------------------------------------------------- */

function InstallGuardBanner({ guard }: { guard: InstallGuard }) {
  const isWarning = guard.type === "no_cylo"
  const borderColor = isWarning
    ? "border-amber-500/50"
    : "border-destructive/50"
  const bgColor = isWarning ? "bg-amber-500/10" : "bg-destructive/10"
  const textColor = isWarning
    ? "text-amber-700 dark:text-amber-400"
    : "text-destructive"

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-4 text-sm",
        borderColor,
        bgColor,
        textColor
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1 space-y-2">
        <p>{guard.message}</p>
        {guard.actionUrl &&
          guard.actionLabel &&
          (guard.actionUrl.startsWith("/") ? (
            <Link
              href={guard.actionUrl}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isWarning
                  ? "bg-amber-500/20 hover:bg-amber-500/30"
                  : "bg-destructive/20 hover:bg-destructive/30"
              )}
            >
              {guard.actionLabel}
            </Link>
          ) : (
            <a
              href={guard.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isWarning
                  ? "bg-amber-500/20 hover:bg-amber-500/30"
                  : "bg-destructive/20 hover:bg-destructive/30"
              )}
            >
              {guard.actionLabel}
              <ExternalLink className="size-3" />
            </a>
          ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Cylo Selector with filtered-out hints                                      */
/* -------------------------------------------------------------------------- */

function CyloSelector({
  cylos,
  availableCylos,
  migratingCyloIds,
  restrictedCyloIds,
  existingAppCyloIds,
  devNoSlotsCyloIds,
  allowMultiple,
  requiredSlots,
  selectedCylo,
  onSelectCylo,
  guardsLoading,
  label,
  noSlotsLabel,
  minimumRequiredPlan
}: {
  cylos: Cylo[]
  availableCylos: Cylo[]
  migratingCyloIds: Set<number>
  restrictedCyloIds: Set<number>
  existingAppCyloIds: Set<number>
  devNoSlotsCyloIds: Set<number>
  allowMultiple: number
  requiredSlots: number
  selectedCylo: string
  onSelectCylo: (value: string) => void
  guardsLoading: boolean
  label: string
  noSlotsLabel: string
  minimumRequiredPlan: string | null
}) {
  const t = useTranslations("appstore")
  const hiddenCount = cylos.length - availableCylos.length
  const restrictedCylos = cylos.filter((c) => restrictedCyloIds.has(c.id))
  const migratingCylos = cylos.filter((c) => migratingCyloIds.has(c.id))
  const noSlotsCylos = cylos.filter(
    (c) =>
      !migratingCyloIds.has(c.id) &&
      !restrictedCyloIds.has(c.id) &&
      (c.app_slots - c.app_slots_used < requiredSlots ||
        devNoSlotsCyloIds.has(c.id))
  )
  const alreadyInstalledCylos = cylos.filter(
    (c) =>
      allowMultiple === 0 &&
      existingAppCyloIds.has(c.id) &&
      !restrictedCyloIds.has(c.id) &&
      !migratingCyloIds.has(c.id) &&
      c.app_slots - c.app_slots_used >= requiredSlots &&
      !devNoSlotsCyloIds.has(c.id)
  )

  // For the "all ineligible" dropdown we track a separate selection
  const [ineligibleSelection, setIneligibleSelection] = useState("")

  function getIneligibleReason(c: Cylo) {
    if (migratingCyloIds.has(c.id)) return t("install.cyloSelector.migrating")
    if (restrictedCyloIds.has(c.id))
      return minimumRequiredPlan
        ? t("install.cyloSelector.restrictedOnPackageMinPlan", {
            plan: minimumRequiredPlan
          })
        : t("install.cyloSelector.restrictedOnPackage")
    if (
      c.app_slots - c.app_slots_used < requiredSlots ||
      devNoSlotsCyloIds.has(c.id)
    )
      return t("install.cyloSelector.noFreeSlots", {
        used: c.app_slots - c.app_slots_used,
        total: c.app_slots
      })
    if (allowMultiple === 0 && existingAppCyloIds.has(c.id))
      return t("install.cyloSelector.alreadyInstalled")
    return t("install.cyloSelector.notEligible")
  }

  function getUpgradeUrl(c: Cylo) {
    if (!c.whmcs_serviceid) return null
    // "Already installed" doesn't need an upgrade — needs a new Appbox
    const hasSlots =
      c.app_slots - c.app_slots_used >= requiredSlots &&
      !devNoSlotsCyloIds.has(c.id)
    if (
      allowMultiple === 0 &&
      existingAppCyloIds.has(c.id) &&
      !restrictedCyloIds.has(c.id) &&
      hasSlots
    )
      return null
    return `${BILLING_BASE_URL}/upgrade.php?type=package&id=${c.whmcs_serviceid}`
  }

  const selectedIneligibleCylo = cylos.find(
    (c) => String(c.id) === ineligibleSelection
  )
  const selectedUpgradeUrl = selectedIneligibleCylo
    ? getUpgradeUrl(selectedIneligibleCylo)
    : null
  const selectedReason = selectedIneligibleCylo
    ? getIneligibleReason(selectedIneligibleCylo)
    : null
  const isAlreadyInstalled =
    selectedIneligibleCylo &&
    allowMultiple === 0 &&
    existingAppCyloIds.has(selectedIneligibleCylo.id) &&
    !restrictedCyloIds.has(selectedIneligibleCylo.id) &&
    selectedIneligibleCylo.app_slots - selectedIneligibleCylo.app_slots_used >=
      requiredSlots

  const allIneligible = availableCylos.length === 0 && !guardsLoading
  const showIneligibleDropdown = allIneligible && cylos.length > 1

  return (
    <div className="space-y-2">
      <Label htmlFor="cylo-select">{label}</Label>
      {allIneligible ? (
        showIneligibleDropdown ? (
          /* Multiple appboxes but none eligible — dropdown to pick which to upgrade */
          <>
            <Select
              value={ineligibleSelection}
              onValueChange={setIneligibleSelection}
            >
              <SelectTrigger
                id="cylo-select"
                className="[&>span]:max-w-[calc(100%-1.25rem)] [&>span]:truncate"
              >
                <SelectValue
                  placeholder={t("install.cyloSelector.selectToSeeOptions")}
                />
              </SelectTrigger>
              <SelectContent>
                {cylos.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    <div className="flex min-w-0 items-start gap-2">
                      <Package className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{c.display_name}</span>
                      <span className="min-w-0 text-xs text-muted-foreground whitespace-normal wrap-break-word">
                        — {getIneligibleReason(c)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Show action for the selected ineligible appbox */}
            {selectedIneligibleCylo && (
              <div className="rounded-md border border-muted bg-muted/20 p-3 text-sm">
                <p className="text-muted-foreground wrap-break-word">
                  <span className="font-medium text-foreground">
                    {selectedIneligibleCylo.display_name}
                  </span>{" "}
                  — {selectedReason}
                </p>
                {selectedUpgradeUrl ? (
                  <a
                    href={selectedUpgradeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {t("install.cyloSelector.upgradeThisAppbox")}
                    <ExternalLink className="size-3" />
                  </a>
                ) : isAlreadyInstalled ? (
                  <div className="mt-1.5 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {t("install.cyloSelector.alreadyInstalledDetail")}
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      {t("install.guard.getAnotherAppbox")}
                    </Link>
                  </div>
                ) : null}
              </div>
            )}

            {!selectedIneligibleCylo && (
              <p className="text-xs text-muted-foreground">
                {t("install.cyloSelector.noneEligible")}
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {noSlotsLabel}
          </div>
        )
      ) : (
        <Select value={selectedCylo} onValueChange={onSelectCylo}>
          <SelectTrigger id="cylo-select">
            <SelectValue placeholder={label} />
          </SelectTrigger>
          <SelectContent>
            {availableCylos.map((cylo) => (
              <SelectItem key={cylo.id} value={String(cylo.id)}>
                <div className="flex items-center gap-2">
                  <Package className="size-3.5 text-muted-foreground" />
                  <span>{cylo.display_name}</span>
                  <span className="text-xs text-muted-foreground">
                    (
                    {t("install.cyloSelector.slotsFree", {
                      count: cylo.app_slots - cylo.app_slots_used
                    })}
                    )
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Hints for filtered-out Appboxes */}
      {hiddenCount > 0 && availableCylos.length > 0 && (
        <div className="space-y-1.5">
          {migratingCylos.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 size-3 shrink-0" />
              <span>
                {migratingCylos.length === 1
                  ? t("install.cyloSelector.migratingSingle", {
                      name: migratingCylos[0].display_name
                    })
                  : t("install.cyloSelector.migratingMultiple", {
                      count: migratingCylos.length
                    })}
              </span>
            </div>
          )}
          {restrictedCylos.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 size-3 shrink-0" />
              <span>
                {restrictedCylos.length === 1
                  ? t("install.cyloSelector.restrictedSingle", {
                      name: restrictedCylos[0].display_name
                    })
                  : t("install.cyloSelector.restrictedMultiple", {
                      count: restrictedCylos.length
                    })}{" "}
                {restrictedCylos.map((c, i) => {
                  const url = c.whmcs_serviceid
                    ? `${BILLING_BASE_URL}/upgrade.php?type=package&id=${c.whmcs_serviceid}`
                    : null
                  if (!url) return null
                  return (
                    <a
                      key={c.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {t("install.cyloSelector.upgradeName", {
                        name: c.display_name
                      })}
                      {i < restrictedCylos.length - 1 ? ", " : ""}
                    </a>
                  )
                })}
              </span>
            </div>
          )}
          {noSlotsCylos.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 size-3 shrink-0" />
              <span>
                {noSlotsCylos.length === 1
                  ? t("install.cyloSelector.noSlotsSingle", {
                      name: noSlotsCylos[0].display_name
                    })
                  : t("install.cyloSelector.noSlotsMultiple", {
                      count: noSlotsCylos.length
                    })}{" "}
                {noSlotsCylos.map((c, i) => {
                  const url = c.whmcs_serviceid
                    ? `${BILLING_BASE_URL}/upgrade.php?type=package&id=${c.whmcs_serviceid}`
                    : null
                  if (!url) return null
                  return (
                    <a
                      key={c.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {t("install.cyloSelector.upgradeName", {
                        name: c.display_name
                      })}
                      {i < noSlotsCylos.length - 1 ? ", " : ""}
                    </a>
                  )
                })}
              </span>
            </div>
          )}
          {alreadyInstalledCylos.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 size-3 shrink-0" />
              <span>
                {alreadyInstalledCylos.length === 1
                  ? t("install.cyloSelector.installedSingle", {
                      name: alreadyInstalledCylos[0].display_name
                    })
                  : t("install.cyloSelector.installedMultiple", {
                      count: alreadyInstalledCylos.length
                    })}{" "}
                {t("install.cyloSelector.onePerAppbox")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Install Dialog                                                             */
/* -------------------------------------------------------------------------- */

interface InstallDialogProps {
  app: AppStoreItem
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUserId?: number
  targetUserRole?: string
  targetCylos?: Cylo[]
  onInstalled?: (installedAppId: number) => void
}

export function InstallDialog({
  app,
  open,
  onOpenChange,
  targetUserId,
  targetUserRole,
  targetCylos,
  onInstalled
}: InstallDialogProps) {
  const t = useTranslations("appstore")
  const router = useRouter()
  const { cylos: sessionCylos, user } = useAuth()
  const effectiveUserId = targetUserId ?? user?.id ?? 0
  const effectiveUserRole = targetUserRole ?? user?.roles
  const { data: cylosSummary } = useCylosSummary()
  const { data: versions, isLoading: versionsLoading } = useAppVersions(app.id)
  const versionSource = useMemo(() => {
    const nestedVersions = app.versions ?? []
    return nestedVersions.length > 0 ? nestedVersions : (versions ?? [])
  }, [app.versions, versions])
  const versionSourceLoading =
    (app.versions?.length ?? 0) === 0 && versionsLoading

  // Session cylos are static (set once at layout render). Merge in the live
  // app_slots_used from useCylosSummary so slot calculations stay current
  // after installs/uninstalls without requiring a full page reload.
  const realCylos = useMemo(() => {
    if (targetCylos) return targetCylos
    if (!cylosSummary) return sessionCylos
    const slotMap = new Map(cylosSummary.map((s) => [s.id, s.app_slots_used]))
    return sessionCylos.map((c) => {
      const liveUsed = slotMap.get(c.id)
      return liveUsed !== undefined ? { ...c, app_slots_used: liveUsed } : c
    })
  }, [targetCylos, sessionCylos, cylosSummary])
  const migratingCyloIds = useMemo(
    () =>
      new Set(
        (cylosSummary ?? []).filter((c) => c.is_migrating).map((c) => c.id)
      ),
    [cylosSummary]
  )
  const installMutation = useInstallApp()
  const devFlags = useAppDevFlags(app.id)

  // Dev overrides: when any guard flag is active, auto-simulate non-admin
  // so the guard banners actually render (otherwise admin bypasses them all).
  const devGuardActive =
    devFlags?.appDisabled ||
    devFlags?.noCylos ||
    devFlags?.singleRestricted ||
    devFlags?.allRestricted ||
    devFlags?.mostRestricted ||
    devFlags?.someRestricted ||
    devFlags?.singleNoSlots ||
    devFlags?.noSlots ||
    devFlags?.mostNoSlots ||
    devFlags?.someNoSlots ||
    devFlags?.singleNoMulti ||
    devFlags?.noMulti ||
    devFlags?.mostNoMulti ||
    devFlags?.someNoMulti
  const effectiveIsAdmin =
    devGuardActive || devFlags?.simulateUser
      ? false
      : effectiveUserRole === "admin"

  // When dev guard flags are active, inject fake whmcs_serviceid into cylos
  // that are missing one so upgrade buttons render during testing.
  const devCylos = useMemo(() => {
    if (!devGuardActive) return realCylos
    return realCylos.map((c, i) =>
      c.whmcs_serviceid ? c : { ...c, whmcs_serviceid: String(99990 + i) }
    )
  }, [realCylos, devGuardActive])

  const EMPTY_CYLOS: typeof realCylos = useMemo(() => [], [])
  // For single-appbox flags, limit to just the first appbox
  const devSingleAppbox =
    devFlags?.singleRestricted ||
    devFlags?.singleNoSlots ||
    devFlags?.singleNoMulti
  const SINGLE_CYLO: typeof realCylos = useMemo(
    () => (devCylos.length > 0 ? [devCylos[0]] : []),
    [devCylos]
  )
  const cylos = devFlags?.noCylos
    ? EMPTY_CYLOS
    : devSingleAppbox
      ? SINGLE_CYLO
      : devGuardActive
        ? devCylos
        : realCylos
  const installableCylos = useMemo(
    () => cylos.filter((c) => !migratingCyloIds.has(c.id)),
    [cylos, migratingCyloIds]
  )

  /* ----- Core form state ----- */
  const [selectedCylo, setSelectedCylo] = useState<string>("")
  const [selectedVersion, setSelectedVersion] = useState<string>("")
  const [boostSlots, setBoostSlots] = useState(0)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const selectedCyloId = Number(selectedCylo || 0)
  const selectedCyloData = cylos.find((c) => c.id === selectedCyloId)
  const selectedVersionId = selectedVersion
    ? Number(selectedVersion)
    : undefined
  const fallbackVersionIdFromSource =
    versionSource.find((v) => v.is_default === 1)?.id ??
    (versionSource.length === 1 ? versionSource[0].id : undefined)
  const defaultVersionId = app.default_version_id ?? fallbackVersionIdFromSource
  const { data: selectedVersionApp } = useAppDetail(app.id, selectedVersionId)

  useEffect(() => {
    if (!open) {
      setSelectedVersion("")
    }
  }, [open])

  useEffect(() => {
    setSelectedVersion("")
  }, [app.id])

  useEffect(() => {
    if (!open || versionSourceLoading || !defaultVersionId) return

    const selectedVersionIsValid = versionSource.some(
      (version) => String(version.id) === selectedVersion
    )
    if (!selectedVersion || !selectedVersionIsValid) {
      setSelectedVersion(String(defaultVersionId))
    }
  }, [
    open,
    versionSourceLoading,
    defaultVersionId,
    versionSource,
    selectedVersion
  ])

  /* ----- Domain state (RequiresDomain) ----- */
  const [domainState, setDomainState] = useState<DomainSectionState>({
    domainType: "appbox",
    selectedDomainId: "",
    // Pre-fill with app's default subdomain, falling back to display_name (same logic as backend)
    subdomain:
      (app.subdomain
        ? app.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")
        : "") ||
      app.display_name.toLowerCase().replace(/[^a-z0-9-]/g, "") ||
      "",
    dnsVerified: false
  })
  const [domainError, setDomainError] = useState<string>()
  const [subdomainError, setSubdomainError] = useState<string>()

  /* ----- Install guard state ----- */
  const [restrictedCyloIds, setRestrictedCyloIds] = useState<Set<number>>(
    new Set()
  )
  const [existingAppCyloIds, setExistingAppCyloIds] = useState<Set<number>>(
    new Set()
  )
  const [guardsLoading, setGuardsLoading] = useState(false)

  const requiresDomain = app.RequiresDomain === 1
  const requiredSlots = getEffectiveAppSlots(app)
  const appCategoryIds = useMemo(
    () =>
      (app.categories ?? [])
        .map((c) =>
          typeof c.key === "number" ? c.key : parseInt(String(c.key), 10)
        )
        .filter((id) => Number.isFinite(id)),
    [app.categories]
  )

  const [minimumPlanLabel, setMinimumPlanLabel] = useState<string | null>(null)
  const [minimumPlanResolved, setMinimumPlanResolved] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const packages = await getPackages()
        const candidatePackages = packages
          .filter(
            (pkg) =>
              pkg.id > 0 &&
              pkg.display_name &&
              pkg.hidden !== 1 &&
              // Exclude legacy numeric package names (e.g. "1000"), keep sellable
              // tiered package labels like BG-2000 / NG-18000 / NG-Ultima.
              /^[A-Za-z]+-/.test(pkg.display_name)
          )
          .sort((a, b) => {
            const aOrder =
              typeof a.sort_order === "number"
                ? a.sort_order
                : Number.MAX_SAFE_INTEGER
            const bOrder =
              typeof b.sort_order === "number"
                ? b.sort_order
                : Number.MAX_SAFE_INTEGER
            return aOrder - bOrder
          })
        if (candidatePackages.length === 0) {
          if (!cancelled) {
            setMinimumPlanLabel(null)
            setMinimumPlanResolved(true)
          }
          return
        }

        const restrictionsPerPackage = await Promise.allSettled(
          candidatePackages.map(async (pkg) => {
            const restrictions = await getAppRestrictions(pkg.id)
            return {
              packageId: pkg.id,
              packageName: pkg.display_name,
              restricted: isAppRestrictedForPackage(
                app.id,
                appCategoryIds,
                restrictions
              )
            }
          })
        )

        if (cancelled) return

        const successful = restrictionsPerPackage
          .filter(
            (
              result
            ): result is PromiseFulfilledResult<{
              packageId: number
              packageName: string
              restricted: boolean
            }> => result.status === "fulfilled"
          )
          .map((result) => result.value)

        if (successful.length === 0) {
          setMinimumPlanLabel(null)
          setMinimumPlanResolved(false)
          return
        }

        const byId = new Map<number, (typeof successful)[number]>(
          successful.map((entry) => [entry.packageId, entry])
        )
        const firstEligible = candidatePackages.find((pkg) => {
          const row = byId.get(pkg.id)
          return row != null && !row.restricted
        })

        setMinimumPlanLabel(firstEligible?.display_name ?? null)
        setMinimumPlanResolved(true)
      } catch {
        if (!cancelled) {
          setMinimumPlanLabel(null)
          setMinimumPlanResolved(false)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [app.id, appCategoryIds])

  const minimumRequiredPlan = useMemo(() => {
    if (!minimumPlanResolved) return null
    return minimumPlanLabel
  }, [minimumPlanResolved, minimumPlanLabel])

  // Dev override: mark cylos as restricted
  const effectiveRestrictedCyloIds = useMemo(() => {
    if (devFlags?.singleRestricted || devFlags?.allRestricted) {
      return new Set(cylos.map((c) => c.id))
    }
    if (devFlags?.mostRestricted && cylos.length > 1) {
      // All but the last cylo are restricted
      return new Set(cylos.slice(0, -1).map((c) => c.id))
    }
    if (devFlags?.someRestricted && cylos.length > 0) {
      return new Set([cylos[0].id])
    }
    return restrictedCyloIds
  }, [
    devFlags?.singleRestricted,
    devFlags?.allRestricted,
    devFlags?.mostRestricted,
    devFlags?.someRestricted,
    cylos,
    restrictedCyloIds
  ])

  // Dev override: mark cylos as having existing instances
  const effectiveExistingAppCyloIds = useMemo(() => {
    if (devFlags?.singleNoMulti || devFlags?.noMulti) {
      return new Set(cylos.map((c) => c.id))
    }
    if (devFlags?.mostNoMulti && cylos.length > 1) {
      return new Set(cylos.slice(0, -1).map((c) => c.id))
    }
    if (devFlags?.someNoMulti && cylos.length > 0) {
      return new Set([cylos[0].id])
    }
    return existingAppCyloIds
  }, [
    devFlags?.singleNoMulti,
    devFlags?.noMulti,
    devFlags?.mostNoMulti,
    devFlags?.someNoMulti,
    cylos,
    existingAppCyloIds
  ])

  // Dev override: simulate specific cylos having no free slots
  const devNoSlotsCyloIds = useMemo(() => {
    if (devFlags?.mostNoSlots && cylos.length > 1) {
      return new Set(cylos.slice(0, -1).map((c) => c.id))
    }
    if (devFlags?.someNoSlots && cylos.length > 0) {
      return new Set([cylos[0].id])
    }
    return new Set<number>()
  }, [devFlags?.mostNoSlots, devFlags?.someNoSlots, cylos])

  /* ----- Extract custom fields ----- */
  const customFields = useMemo(() => {
    if (selectedVersionApp?.customFields) return selectedVersionApp.customFields
    if (!app.customFields) return {}
    return app.customFields
  }, [selectedVersionApp?.customFields, app.customFields])

  const visibleFields = useMemo(() => {
    return Object.entries(customFields).filter(([, field]) => {
      return !SKIP_INPUT_TYPES.has(field.type)
    })
  }, [customFields])

  // Keep only overlapping custom-field values/errors when version changes.
  useEffect(() => {
    if (!open) return
    const validKeys = new Set(Object.keys(customFields))
    setFieldValues((prev) => {
      const next: Record<string, string> = {}
      for (const [key, val] of Object.entries(prev)) {
        if (validKeys.has(key)) {
          next[key] = val
        }
      }
      return next
    })
    setFieldErrors((prev) => {
      const next: Record<string, string> = {}
      for (const [key, val] of Object.entries(prev)) {
        if (validKeys.has(key)) {
          next[key] = val
        }
      }
      return next
    })
  }, [open, customFields])

  /* ----- Compute install guards (restrictions + allow_multiple) ----- */
  useEffect(() => {
    if (!open) return

    let cancelled = false
    const run = async () => {
      setGuardsLoading(true)
      try {
        const { restrictedCyloIds: restricted, existingAppCyloIds: existing } =
          await computeInstallGuards(
            app.id,
            appCategoryIds,
            cylos,
            effectiveUserId
          )
        if (!cancelled) {
          setRestrictedCyloIds(restricted)
          setExistingAppCyloIds(existing)
        }
      } catch {
        // Non-fatal: proceed without guard filtering
      } finally {
        if (!cancelled) setGuardsLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [open, app.id, appCategoryIds, cylos, effectiveUserId])

  /* ----- Available cylos (filtered) ----- */
  const availableCylos = useMemo(() => {
    return installableCylos.filter((cylo) => {
      if (devNoSlotsCyloIds.has(cylo.id)) return false
      const freeSlots = cylo.app_slots - cylo.app_slots_used
      if (freeSlots < requiredSlots) return false
      if (effectiveRestrictedCyloIds.has(cylo.id)) return false
      if (app.allow_multiple === 0 && effectiveExistingAppCyloIds.has(cylo.id))
        return false
      return true
    })
  }, [
    installableCylos,
    requiredSlots,
    effectiveRestrictedCyloIds,
    effectiveExistingAppCyloIds,
    devNoSlotsCyloIds,
    app.allow_multiple
  ])

  /* ----- Auto-select when only one appbox is available ----- */
  useEffect(() => {
    if (guardsLoading) return
    if (availableCylos.length === 1) {
      setSelectedCylo(String(availableCylos[0].id))
    }
  }, [guardsLoading, availableCylos])

  /* ----- Install guard (overall block reason) ----- */
  const installGuard = useMemo((): InstallGuard | null => {
    if (guardsLoading) return null

    // App disabled
    if (app.enabled === 0 && !effectiveIsAdmin) {
      return {
        type: "disabled",
        message: t("install.guard.appDisabled")
      }
    }

    // No cylos at all
    if (installableCylos.length === 0 && !effectiveIsAdmin) {
      return {
        type: "no_cylo",
        message: t("install.guard.noCylos"),
        actionLabel: t("install.guard.getAppbox"),
        actionUrl: MARKETING_URL
      }
    }

    // All cylos restricted — only block when there's a single appbox so
    // the guard banner can show its specific upgrade link. With multiple
    // appboxes the CyloSelector handles per-appbox upgrade links instead.
    if (
      installableCylos.length > 0 &&
      installableCylos.every((c) => effectiveRestrictedCyloIds.has(c.id)) &&
      !effectiveIsAdmin
    ) {
      if (installableCylos.length === 1) {
        const restrictedServiceId = installableCylos[0].whmcs_serviceid ?? ""
        const restrictedUpgradeUrl = restrictedServiceId
          ? `${BILLING_BASE_URL}/upgrade.php?type=package&id=${restrictedServiceId}`
          : MARKETING_URL

        return {
          type: "restricted",
          message: minimumRequiredPlan
            ? t("install.guard.restrictedMinPlan", {
                plan: minimumRequiredPlan
              })
            : t("install.guard.restricted"),
          actionLabel: restrictedServiceId
            ? t("install.guard.upgradePackage")
            : t("install.guard.getAnotherAppbox"),
          actionUrl: restrictedUpgradeUrl
        }
      }
      // cylos.length > 1 — fall through so CyloSelector shows per-appbox links
    }

    // No cylo has enough slots (excluding restricted ones)
    const unrestricted = installableCylos.filter(
      (c) => !effectiveRestrictedCyloIds.has(c.id)
    )
    const allUnrestrictedLackSlots =
      unrestricted.length > 0 &&
      unrestricted.every(
        (c) =>
          c.app_slots - c.app_slots_used < requiredSlots ||
          devNoSlotsCyloIds.has(c.id)
      )
    if (allUnrestrictedLackSlots && !effectiveIsAdmin) {
      if (unrestricted.length === 1 && effectiveRestrictedCyloIds.size === 0) {
        const slotServiceId = unrestricted[0].whmcs_serviceid ?? ""
        const slotUpgradeUrl = slotServiceId
          ? `${BILLING_BASE_URL}/upgrade.php?type=package&id=${slotServiceId}`
          : MARKETING_URL

        return {
          type: "no_slots",
          message: t("install.guard.noSlots", { count: requiredSlots }),
          actionLabel: slotServiceId
            ? t("install.guard.getMoreSlots")
            : t("install.guard.getAnotherAppbox"),
          actionUrl: slotUpgradeUrl
        }
      }
      // Multiple appboxes — fall through so CyloSelector shows per-appbox links
    }

    // allow_multiple=0 and all eligible cylos already have the app
    if (
      app.allow_multiple === 0 &&
      availableCylos.length === 0 &&
      !effectiveIsAdmin
    ) {
      const eligibleWithoutMulti = installableCylos.filter(
        (c) =>
          !effectiveRestrictedCyloIds.has(c.id) &&
          c.app_slots - c.app_slots_used >= requiredSlots
      )
      if (
        eligibleWithoutMulti.length > 0 &&
        eligibleWithoutMulti.every((c) => effectiveExistingAppCyloIds.has(c.id))
      ) {
        // Single appbox (or single eligible) — show a blocking banner
        if (installableCylos.length <= 1) {
          return {
            type: "no_multi",
            message: t("install.guard.noMulti"),
            actionLabel: t("install.guard.getAnotherAppbox"),
            actionUrl: MARKETING_URL
          }
        }
        // Multiple appboxes — fall through so CyloSelector shows per-appbox details
      }
    }

    return null
  }, [
    guardsLoading,
    app.enabled,
    app.allow_multiple,
    effectiveIsAdmin,
    installableCylos,
    effectiveRestrictedCyloIds,
    effectiveExistingAppCyloIds,
    devNoSlotsCyloIds,
    requiredSlots,
    availableCylos,
    minimumRequiredPlan,
    t
  ])

  /* ----- Handlers ----- */
  const handleFieldChange = useCallback(
    (fname: string, value: string) => {
      setFieldValues((prev) => ({ ...prev, [fname]: value }))

      const field = customFields[fname]
      if (
        !field ||
        field.type === "staticText" ||
        SKIP_INPUT_TYPES.has(field.type)
      ) {
        setFieldErrors((prev) => {
          if (!prev[fname]) return prev
          const next = { ...prev }
          delete next[fname]
          return next
        })
        return
      }

      const error = validateField(value, field, t)
      setFieldErrors((prev) => {
        if (!error && !prev[fname]) return prev
        const next = { ...prev }
        if (error) {
          next[fname] = error
        } else {
          delete next[fname]
        }
        return next
      })
    },
    [customFields, t]
  )

  const handleDomainStateChange = useCallback(
    (next: Partial<DomainSectionState>) => {
      setDomainState((prev) => ({ ...prev, ...next }))
    },
    []
  )

  // Reset domain state when cylo changes, but preserve the default subdomain
  const defaultSubdomain =
    (app.subdomain
      ? app.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")
      : "") ||
    app.display_name.toLowerCase().replace(/[^a-z0-9-]/g, "") ||
    ""
  useEffect(() => {
    setDomainState({
      domainType: "appbox",
      selectedDomainId: "",
      subdomain: defaultSubdomain,
      dnsVerified: false
    })
    setDomainError(undefined)
    setSubdomainError(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCylo])

  useEffect(() => {
    setBoostSlots(0)
  }, [selectedCylo, selectedVersion, open])

  const validateAllFields = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    let valid = true

    // Validate custom fields
    for (const [fname, field] of Object.entries(customFields)) {
      if (SKIP_INPUT_TYPES.has(field.type) || field.type === "staticText") {
        continue
      }
      const val = fieldValues[fname] ?? String(field.defaultValue ?? "")
      const err = validateField(val, field, t)
      if (err) {
        errors[fname] = err
        valid = false
      }
    }

    setFieldErrors(errors)

    // Validate domain fields
    if (requiresDomain) {
      const effectiveDomainId =
        domainState.selectedDomainId ||
        (domainState.domainType === "appbox"
          ? String(selectedCyloData?.domain_id ?? "")
          : "")

      if (!effectiveDomainId) {
        setDomainError(t("install.validation.selectDomain"))
        valid = false
      } else {
        setDomainError(undefined)
      }
      const trimmedSub = domainState.subdomain.trim()
      if (!trimmedSub) {
        setSubdomainError(t("install.validation.required"))
        valid = false
      } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(trimmedSub)) {
        setSubdomainError(t("install.validation.invalidSubdomain"))
        valid = false
      } else {
        setSubdomainError(undefined)
      }
      // Custom domain requires DNS verification
      if (domainState.domainType === "custom" && !domainState.dnsVerified) {
        valid = false
      }
    }

    return valid
  }, [
    customFields,
    fieldValues,
    requiresDomain,
    domainState,
    selectedCyloData?.domain_id,
    t
  ])

  const handleInstall = async () => {
    if (!selectedCylo) return
    if (!validateAllFields()) return

    const versionId = selectedVersion
      ? Number(selectedVersion)
      : (defaultVersionId ?? 0)

    const payload: Record<string, unknown> = {
      app_id: app.id,
      version_id: versionId,
      cylo_id: Number(selectedCylo),
      user_id: effectiveUserId
    }

    if (showBoostSlider && boostSlots > 0) {
      payload.boost_slots = boostSlots
    }

    // Add domain fields
    if (requiresDomain) {
      const effectiveDomainId =
        domainState.selectedDomainId ||
        (domainState.domainType === "appbox"
          ? String(selectedCyloData?.domain_id ?? "")
          : "")
      payload.subdomain = domainState.subdomain.trim()
      payload.domain_id = Number(effectiveDomainId)
    }

    // Add custom field values
    for (const [fname, field] of Object.entries(customFields)) {
      if (field.type === "staticText" || field.type === "spacer") continue
      const val = fieldValues[fname] ?? String(field.defaultValue ?? "")
      if (val) {
        payload[fname] = val
      }
    }

    try {
      const result = await installMutation.mutateAsync(
        payload as {
          app_id: number
          version_id: number
          cylo_id: number
          [key: string]: unknown
        }
      )
      onOpenChange(false)
      if (onInstalled) {
        onInstalled(result.id)
      } else {
        router.push(ROUTES.INSTALLED_APP_DETAIL(result.id))
      }
    } catch (error) {
      const parsed = parseInstallError(
        error,
        t("install.dialog.installFailed"),
        customFields
      )
      if (Object.keys(parsed.fieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...parsed.fieldErrors }))
      }
      // Error is handled by the mutation state
    }
  }

  const hasMultipleVersions =
    (app.enabled_version_count ?? 0) > 1 && versionSource.length > 1
  const hasCustomFields = visibleFields.length > 0
  const isBlocked = installGuard !== null && !effectiveIsAdmin
  const { data: boostInfo, isLoading: boostInfoLoading } = useAppBoostInfo(
    app.id,
    selectedCyloId
  )
  const selectedVersionData = versionSource.find(
    (v) => String(v.id) === selectedVersion
  )
  const defaultVersionData =
    versionSource.find((v) => v.is_default === 1) ??
    (versionSource.length === 1 ? versionSource[0] : undefined)
  const preinstallDescription =
    selectedVersionApp?.custom_field_preinstall_description ??
    selectedVersionData?.custom_field_preinstall_description ??
    defaultVersionData?.custom_field_preinstall_description ??
    app.custom_field_preinstall_description
  const boostBaseMemory =
    selectedVersionData?.memory ??
    defaultVersionData?.memory ??
    boostInfo?.base_memory ??
    0
  const boostBaseCpus =
    selectedVersionData?.cpus ??
    defaultVersionData?.cpus ??
    boostInfo?.base_cpus ??
    0
  const boostSlotCost =
    selectedVersionData?.app_slots ??
    defaultVersionData?.app_slots ??
    boostInfo?.app_slots_cost ??
    requiredSlots
  const maxInstallBoostSlots = Math.max(
    0,
    boostInfo?.max_install_boost_slots ?? 0
  )
  const showBoostSlider =
    !isBlocked &&
    isLaunchWeekEnabled("day_2", effectiveIsAdmin) &&
    selectedCyloId > 0 &&
    (boostInfo?.boost_install_allowed ?? 0) === 1 &&
    maxInstallBoostSlots > 0
  const showBoostUnavailable =
    !isBlocked &&
    isLaunchWeekEnabled("day_2", effectiveIsAdmin) &&
    selectedCyloId > 0 &&
    !boostInfoLoading &&
    !showBoostSlider
  const boostUnavailableReason =
    boostInfo?.boost_install_block_reason ||
    (maxInstallBoostSlots <= 0
      ? "No boost slots are available for this Appbox."
      : "Boost is currently unavailable for this Appbox.")
  const boostUpgradeUrl = selectedCyloData?.whmcs_serviceid
    ? `${BILLING_BASE_URL}/upgrade.php?type=package&id=${selectedCyloData.whmcs_serviceid}`
    : undefined

  useEffect(() => {
    if (boostSlots > maxInstallBoostSlots) {
      setBoostSlots(maxInstallBoostSlots)
    }
  }, [boostSlots, maxInstallBoostSlots])

  const customFieldsValid = useMemo(() => {
    return Object.entries(customFields).every(([fname, field]) => {
      if (field.type === "staticText" || SKIP_INPUT_TYPES.has(field.type)) {
        return true
      }

      const value = fieldValues[fname] ?? String(field.defaultValue ?? "")
      return validateField(value, field, t) === null
    })
  }, [customFields, fieldValues, t])

  const isInstallDisabled =
    isBlocked ||
    !selectedCylo ||
    !customFieldsValid ||
    availableCylos.length === 0 ||
    installMutation.isPending ||
    guardsLoading ||
    (selectedCyloId > 0 && boostInfoLoading) ||
    (requiresDomain &&
      domainState.domainType === "custom" &&
      !domainState.dnsVerified)

  const parsedInstallError = useMemo(() => {
    if (!installMutation.error) return null
    return parseInstallError(
      installMutation.error,
      t("install.dialog.installFailed"),
      customFields
    )
  }, [installMutation.error, t, customFields])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[85vh] overflow-y-auto",
          hasCustomFields || requiresDomain ? "sm:max-w-lg" : "sm:max-w-md"
        )}
        onKeyDown={(event) => {
          if (
            event.key !== "Enter" ||
            event.shiftKey ||
            event.nativeEvent.isComposing
          ) {
            return
          }

          const target = event.target as HTMLElement
          if (target.tagName === "TEXTAREA" || target.isContentEditable) {
            return
          }

          event.preventDefault()
          if (!isInstallDisabled) {
            void handleInstall()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {t("app.installTitle", { name: app.display_name })}
          </DialogTitle>
          <DialogDescription>
            {t("app.requiresSlots", { count: requiredSlots })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Install guard banner */}
          {installGuard && <InstallGuardBanner guard={installGuard} />}

          {/* Loading guards indicator */}
          {guardsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("install.guard.checkingAvailability")}
            </div>
          )}

          {/* Cylo Selector */}
          {!isBlocked && (
            <CyloSelector
              cylos={cylos}
              availableCylos={availableCylos}
              migratingCyloIds={migratingCyloIds}
              restrictedCyloIds={effectiveRestrictedCyloIds}
              existingAppCyloIds={effectiveExistingAppCyloIds}
              allowMultiple={app.allow_multiple}
              devNoSlotsCyloIds={devNoSlotsCyloIds}
              requiredSlots={requiredSlots}
              selectedCylo={selectedCylo}
              onSelectCylo={setSelectedCylo}
              guardsLoading={guardsLoading}
              label={t("app.selectCylo")}
              noSlotsLabel={t("app.noSlots")}
              minimumRequiredPlan={minimumRequiredPlan}
            />
          )}

          {/* Version Selector (only if multiple versions) */}
          {!isBlocked && hasMultipleVersions && (
            <div className="space-y-2">
              <Label htmlFor="version-select">{t("app.selectVersion")}</Label>
              {versionSourceLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {t("install.dialog.loadingVersions")}
                </div>
              ) : (
                <Select
                  value={selectedVersion}
                  onValueChange={setSelectedVersion}
                >
                  <SelectTrigger id="version-select">
                    <SelectValue placeholder={t("app.selectVersion")} />
                  </SelectTrigger>
                  <SelectContent>
                    {versionSource.map((version) => (
                      <SelectItem key={version.id} value={String(version.id)}>
                        <div className="flex items-center gap-2">
                          <span>{version.version}</span>
                          {version.is_default === 1 && (
                            <span className="text-xs text-primary">
                              {t("install.dialog.defaultVersion")}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!versionSourceLoading && versionSource.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("install.dialog.versionsAvailable", {
                    count: versionSource.length
                  })}
                </p>
              )}
            </div>
          )}

          {!isBlocked && selectedCyloId > 0 && boostInfoLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("install.boost.loading")}
            </div>
          )}

          {showBoostSlider && (
            <BoostSlider
              value={boostSlots}
              max={maxInstallBoostSlots}
              boostIncrement={boostInfo?.boost_increment ?? 0.1}
              maxBoostMultiplier={boostInfo?.max_boost_multiplier ?? 8}
              baseMemory={boostBaseMemory}
              baseCpus={boostBaseCpus}
              appSlotsCost={boostSlotCost}
              cyloFreeSlots={boostInfo?.cylo_free_slots ?? 0}
              onChange={setBoostSlots}
              disabled={installMutation.isPending}
              upgradeUrl={boostUpgradeUrl}
              labels={{
                title: t("install.boost.title"),
                resourcePreview: t("install.boost.resourcePreview"),
                multiplier: t("install.boost.multiplier"),
                slotCost: t("install.boost.slotCost"),
                ram: t("install.boost.ram"),
                cpus: t("install.boost.cpus"),
                cta: t("install.boost.cta")
              }}
            />
          )}

          {showBoostUnavailable && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
              <p>{boostUnavailableReason}</p>
              {boostUpgradeUrl && (
                <a
                  href={boostUpgradeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-500/30 dark:text-amber-200"
                >
                  {t("install.boost.cta")}
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          )}

          {/* Domain fields (RequiresDomain) */}
          {!isBlocked && requiresDomain && (
            <DomainSection
              selectedCyloId={selectedCylo}
              selectedCylo={
                cylos.find((c) => String(c.id) === selectedCylo) ?? null
              }
              state={domainState}
              domainError={domainError}
              subdomainError={subdomainError}
              onChange={handleDomainStateChange}
              onSubdomainError={setSubdomainError}
              onDomainError={setDomainError}
            />
          )}

          {/* Pre-install description */}
          {!isBlocked && preinstallDescription && (
            <div className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
              {preinstallDescription}
            </div>
          )}

          {/* Custom Fields */}
          {!isBlocked && hasCustomFields && (
            <div className="space-y-4 pt-4">
              {visibleFields.map(([fname, field]) => (
                <CustomFieldInput
                  key={fname}
                  fname={fname}
                  field={field}
                  value={fieldValues[fname] ?? String(field.defaultValue ?? "")}
                  error={fieldErrors[fname]}
                  onChange={handleFieldChange}
                  selectedCyloId={selectedCylo}
                  selectedVersionId={selectedVersionId}
                  customFields={customFields}
                  fieldValues={fieldValues}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={installMutation.isPending}
          >
            {t("install.dialog.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleInstall}
            disabled={isInstallDisabled}
            className={cn(installMutation.isPending && "pointer-events-none")}
          >
            {installMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("app.installing")}
              </>
            ) : (
              t("app.install")
            )}
          </Button>
        </DialogFooter>

        {installMutation.isError && parsedInstallError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">{parsedInstallError.title}</p>
                {parsedInstallError.details.length > 0 && (
                  <ul className="list-disc space-y-0.5 pl-4 text-xs sm:text-sm">
                    {parsedInstallError.details.slice(0, 4).map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
