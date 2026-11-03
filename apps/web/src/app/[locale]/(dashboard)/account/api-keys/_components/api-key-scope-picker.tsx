"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"
import { useApiKeyScopes } from "@/api/account/hooks/use-account"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  findMatchingPreset,
  groupScopes,
  includesHighRiskScope
} from "./api-key-scopes"

const CUSTOM_PRESET = "custom"

export function scopePickerHintId(idPrefix: string) {
  return `${idPrefix}-scopes-hint`
}

export function HigherRiskTag({ className }: { className?: string }) {
  const t = useTranslations("account.apiKeys")
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400",
        className
      )}
    >
      <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
      {t("higherRisk")}
    </span>
  )
}

/** Backend heading first; translated heading only if the backend has none. */
export function ScopeGroupLabel({
  group,
  label
}: {
  group: string
  label?: string
}) {
  const t = useTranslations("account.apiKeys")
  if (label) return label
  const key = `scopeGroups.${group}`
  if (t.has(key)) return t(key)
  return group.replace(/_/g, " ")
}

interface ApiKeyScopePickerProps {
  idPrefix: string
  value: string[]
  onChange: (scopes: string[]) => void
  disabled?: boolean
}

export function ApiKeyScopePicker({
  idPrefix,
  value,
  onChange,
  disabled = false
}: ApiKeyScopePickerProps) {
  const t = useTranslations("account.apiKeys")
  const { data: catalog, isLoading, isError, refetch } = useApiKeyScopes()
  const presets = useMemo(() => catalog?.presets ?? [], [catalog])
  const selected = useMemo(() => new Set(value), [value])
  const groups = useMemo(() => groupScopes(catalog, value), [catalog, value])

  const matchedPreset = findMatchingPreset(value, presets)
  const presetValue =
    matchedPreset?.id ?? (value.length > 0 ? CUSTOM_PRESET : "")
  const presetDescription = matchedPreset
    ? matchedPreset.description
    : value.length > 0
      ? t("presetCustomDescription")
      : ""
  const includesHigherRisk =
    matchedPreset?.high_risk === true ||
    includesHighRiskScope(value, catalog?.scopes ?? [])
  const hintId = scopePickerHintId(idPrefix)
  const presetId = `${idPrefix}-preset`

  function selectPreset(id: string) {
    const preset = presets.find((item) => item.id === id)
    if (preset) onChange([...preset.scopes])
  }

  function toggleScope(scope: string, checked: boolean) {
    if (checked) {
      if (!selected.has(scope)) onChange([...value, scope])
      return
    }
    onChange(value.filter((item) => item !== scope))
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={presetId} className="text-sm font-medium">
            {t("scopes")}
          </label>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {t.rich("selectedCount", {
              count: value.length,
              n: (chunks) => (
                <span className="font-mono tabular-nums">{chunks}</span>
              )
            })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{t("scopesHelp")}</p>
      </div>

      {isLoading && (
        <div
          className="space-y-3 border p-3"
          role="status"
          aria-label={t("scopesLoading")}
        >
          <div className="h-9 w-full bg-muted motion-safe:animate-pulse" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="size-4 shrink-0 bg-muted motion-safe:animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 bg-muted motion-safe:animate-pulse" />
                <div className="h-2.5 w-2/3 bg-muted/70 motion-safe:animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="flex items-center justify-between gap-3 border-l-2 border-destructive bg-destructive/5 py-2 pl-3 pr-2 text-sm text-destructive">
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {t("scopesLoadFailed")}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      )}

      {catalog && (
        <>
          <div className="space-y-1.5">
            <Select
              value={presetValue}
              onValueChange={selectPreset}
              disabled={disabled || presets.length === 0}
            >
              <SelectTrigger
                id={presetId}
                aria-label={t("preset")}
                aria-describedby={
                  presetDescription ? `${presetId}-description` : undefined
                }
              >
                <SelectValue placeholder={t("presetPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <span className="flex items-center gap-2">
                      {preset.label}
                      {preset.high_risk && (
                        <AlertTriangle
                          className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                          aria-label={t("higherRisk")}
                        />
                      )}
                    </span>
                  </SelectItem>
                ))}
                {presetValue === CUSTOM_PRESET && (
                  <SelectItem value={CUSTOM_PRESET}>
                    {t("presetCustom")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {presetDescription && (
              <p
                id={`${presetId}-description`}
                className="text-xs text-muted-foreground"
              >
                {presetDescription}
              </p>
            )}
          </div>

          {includesHigherRisk && (
            <p className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle
                className="mt-px size-3.5 shrink-0"
                aria-hidden="true"
              />
              {t("higherRiskNotice")}
            </p>
          )}

          <div
            className="max-h-[min(22rem,45dvh)] overflow-y-auto border"
            data-disable-enter-submit="true"
          >
            {groups.map(({ group, label, scopes }) => {
              const headingId = `${idPrefix}-group-${group}`
              return (
                <div
                  key={group}
                  role="group"
                  aria-labelledby={headingId}
                  className="border-b last:border-b-0"
                >
                  <p
                    id={headingId}
                    className="sticky top-0 z-10 border-b bg-background px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    <ScopeGroupLabel group={group} label={label} />
                  </p>
                  <ul className="divide-y">
                    {scopes.map((scope) => {
                      const inputId = `${idPrefix}-scope-${scope.scope}`
                      const descriptionId = `${inputId}-description`
                      return (
                        <li key={scope.scope}>
                          <label
                            htmlFor={inputId}
                            className={cn(
                              "flex items-start gap-3 px-3 py-2.5 transition-colors",
                              disabled
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer hover:bg-primary/5"
                            )}
                          >
                            <input
                              id={inputId}
                              type="checkbox"
                              className="mt-0.5 size-4 shrink-0 accent-primary"
                              checked={selected.has(scope.scope)}
                              disabled={disabled}
                              aria-describedby={
                                scope.description ? descriptionId : undefined
                              }
                              onChange={(event) =>
                                toggleScope(scope.scope, event.target.checked)
                              }
                            />
                            <span className="min-w-0 flex-1 space-y-0.5">
                              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="text-sm font-medium">
                                  {scope.label}
                                </span>
                                {scope.label !== scope.scope && (
                                  <code className="font-mono text-[11px] text-muted-foreground">
                                    {scope.scope}
                                  </code>
                                )}
                                {scope.high_risk && <HigherRiskTag />}
                              </span>
                              {scope.description && (
                                <span
                                  id={descriptionId}
                                  className="block text-xs text-muted-foreground"
                                >
                                  {scope.description}
                                </span>
                              )}
                            </span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </>
      )}

      {catalog && value.length === 0 && (
        <p
          id={hintId}
          className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300"
        >
          <AlertTriangle
            className="mt-px size-3.5 shrink-0"
            aria-hidden="true"
          />
          {t("scopesRequired")}
        </p>
      )}
    </div>
  )
}
