"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Button,
  Combobox,
  Input,
  InputGroup,
  LinkButton,
  Loader,
  Select,
  Switch
} from "@cloudflare/kumo"
import {
  ArrowsClockwiseIcon,
  ArrowSquareOutIcon,
  EyeIcon,
  EyeSlashIcon
} from "@phosphor-icons/react"
import { fetchSearchFieldOptions, type CustomField } from "@/api/apps/app-store"
import { generateSecurePassword } from "@/lib/dynamic-form"
import type { FormFieldConfig } from "@/types/dashboard"
import { FieldBlock, Notice, withRequiredMark } from "../ui/field-parts"
import {
  isFieldRequired,
  isSwitchChecked,
  mapCustomFieldToFormConfig,
  toFieldValue
} from "./logic"

interface SearchOption {
  label: string
  value: string
}

/* -------------------------------------------------------------------------- */
/*  Search field (combobox for "search" type custom fields)                    */
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
  const [options, setOptions] = useState<SearchOption[]>([])
  const [loading, setLoading] = useState(false)
  const autoSelected = useRef(false)
  const required = isFieldRequired(field)

  const params = field.params ?? {}
  const apiRoute = params.APIRoute as string | undefined
  const submitValue = (params.submitValue as string) ?? "domain"
  const useIfSingleItem = params.useIfSingleItem as boolean | undefined
  const depends = params.depends as
    Record<string, Record<string, string>>[] | undefined

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
    return filters
  }, [depends, selectedCyloId, customFields, fieldValues])

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

  // A value the options do not list (yet) still shows, as its raw text.
  const selected = useMemo<SearchOption | null>(
    () => (value ? { label: selectedLabel, value } : null),
    [value, selectedLabel]
  )

  const label = withRequiredMark(field.label, required)

  if (!selectedCyloId) {
    return (
      <FieldBlock label={label} error={error}>
        <Notice>{t("install.searchField.selectAppboxFirst")}</Notice>
      </FieldBlock>
    )
  }

  const searchPlaceholder = t("install.searchField.searchPlaceholder", {
    label: field.label
  })

  return (
    <Combobox<SearchOption>
      label={label}
      error={error}
      items={options}
      value={selected}
      isItemEqualToValue={(item, selected) => item.value === selected.value}
      // Choosing the selected option again clears the field.
      onValueChange={(option) =>
        onChange(fname, !option || option.value === value ? "" : option.value)
      }
    >
      <Combobox.TriggerValue
        className="w-full"
        placeholder={t("install.searchField.selectPlaceholder", {
          label: field.label
        })}
      />
      <Combobox.Content>
        <Combobox.Input
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
        />
        {loading ? (
          <div className="flex items-center justify-center py-6 text-kumo-subtle">
            <Loader size="sm" />
          </div>
        ) : (
          <>
            <Combobox.Empty>
              {t("install.searchField.noResults")}
            </Combobox.Empty>
            <Combobox.List>
              {(option: SearchOption) => (
                <Combobox.Item key={option.value} value={option}>
                  {option.label}
                </Combobox.Item>
              )}
            </Combobox.List>
          </>
        )}
      </Combobox.Content>
    </Combobox>
  )
}

/* -------------------------------------------------------------------------- */
/*  Form field (text, email, number, password and select custom fields)        */
/* -------------------------------------------------------------------------- */

/**
 * The dialog's share of the current design's FormFieldRenderer. Install
 * fields only ever map to text, email, number, password or select, so its
 * toggle, textarea and search branches have no counterpart here.
 */
function FormField({
  config,
  value,
  error,
  onChange
}: {
  config: FormFieldConfig
  value: string
  error?: string
  onChange: (next: Parameters<typeof toFieldValue>[0]) => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const fieldId = `form-field-${config.name}`
  const label = withRequiredMark(config.label, Boolean(config.required))

  switch (config.type) {
    case "select":
      return (
        <Select
          id={fieldId}
          label={label}
          error={error}
          className="w-full"
          placeholder={config.placeholder}
          disabled={config.disabled}
          items={config.options ?? []}
          // Uncontrolled, as in the current design: the value seeds the
          // control once and later outside changes do not move it.
          defaultValue={value || null}
          onValueChange={(next) => onChange(next ?? undefined)}
        />
      )

    case "password":
      // An input with a show/hide button rather than Kumo's SensitiveInput,
      // which shows the value while it is typed and cannot be told to reveal
      // a password that was just generated.
      return (
        <div className="grid gap-2">
          <InputGroup
            label={label}
            error={error ? { message: error, match: true } : undefined}
            disabled={config.disabled}
          >
            <InputGroup.Input
              name={config.name}
              type={showPassword ? "text" : "password"}
              aria-label={config.label}
              placeholder={config.placeholder}
              value={value}
              onChange={onChange}
            />
            <InputGroup.Addon align="end" className="pr-1">
              <InputGroup.Button
                shape="square"
                icon={showPassword ? EyeSlashIcon : EyeIcon}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
              />
            </InputGroup.Addon>
          </InputGroup>
          {config.generatePassword ? (
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowsClockwiseIcon}
              disabled={config.disabled}
              onClick={() => {
                onChange(generateSecurePassword(config.generatedPasswordLength))
                setShowPassword(true)
              }}
            >
              {config.generatePasswordLabel ?? "Generate password"}
            </Button>
          ) : null}
        </div>
      )

    case "number":
      return (
        <Input
          id={fieldId}
          name={config.name}
          type="number"
          label={label}
          error={error}
          placeholder={config.placeholder}
          disabled={config.disabled}
          value={value}
          onChange={(event) => {
            const val = event.target.value
            onChange(val === "" ? "" : Number(val))
          }}
        />
      )

    case "text":
    case "email":
    default:
      return (
        <Input
          id={fieldId}
          name={config.name}
          type={config.type}
          label={label}
          error={error}
          placeholder={config.placeholder}
          disabled={config.disabled}
          value={value}
          onChange={onChange}
        />
      )
  }
}

/* -------------------------------------------------------------------------- */
/*  Custom field input                                                         */
/* -------------------------------------------------------------------------- */

export function CustomFieldInput({
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
      <FieldBlock label={field.label}>
        <Notice>{field.defaultValue ?? "—"}</Notice>
      </FieldBlock>
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
      <FieldBlock label={field.label} error={error}>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={urlValue}
            aria-label={field.label}
            className="min-w-0 flex-1 font-mono text-[0.9em]"
          />
          {href ? (
            <LinkButton
              href={href}
              external
              variant="secondary"
              shape="square"
              aria-label="Open URL"
              icon={ArrowSquareOutIcon}
            />
          ) : null}
        </div>
      </FieldBlock>
    )
  }

  if (fieldType === "switch") {
    const isOn = isSwitchChecked(value)
    const fieldId = `install-field-${fname}`
    return (
      <div className="grid gap-2">
        <Switch
          id={fieldId}
          label={field.label}
          controlFirst={false}
          checked={isOn}
          onCheckedChange={(checked) => onChange(fname, checked ? "1" : "0")}
        />
        {field.params?.menuItems && (
          <span className="text-sm leading-snug text-kumo-subtle">
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

  return (
    <FormField
      config={config}
      value={value}
      error={error}
      onChange={(next) => onChange(fname, toFieldValue(next))}
    />
  )
}
