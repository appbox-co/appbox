"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Badge,
  Banner,
  Button,
  Checkbox,
  Collapsible,
  Popover,
  Select,
  SkeletonLine
} from "@cloudflare/kumo"
import {
  CaretDownIcon,
  WarningCircleIcon,
  WarningIcon
} from "@phosphor-icons/react"
import type { ApiKeyScopeCatalog } from "@/api/account/account"
// Pure rules shared with the current design's page.
import {
  findMatchingPreset,
  groupScopes,
  includesHighRiskScope
} from "@/app/[locale]/(dashboard)/account/api-keys/_components/api-key-scopes"
import type { Loadable } from "../shared"

/** Prototype-only copy, in sentence case (a Kumo rule). */
const COPY = {
  custom: "Custom",
  chooseScopes: "Choose scopes one by one",
  customDescription: "Your own choice of scopes.",
  noScopesWarning: "This key has no scopes, so it cannot call the API."
} as const

const CUSTOM_PRESET = "custom"

/** The id of the line that says a key needs a scope, for aria-describedby. */
export const scopesHintId = (idPrefix: string) => `${idPrefix}-scopes-hint`

function HigherRisk() {
  const t = useTranslations("account.apiKeys")
  return (
    <Badge variant="warning" className="shrink-0">
      {t("higherRisk")}
    </Badge>
  )
}

/** A group heading: the API's own label, else a translated or spelled-out id. */
function useGroupLabel() {
  const t = useTranslations("account.apiKeys")
  return (group: string, label?: string) => {
    if (label) return label
    const key = `scopeGroups.${group}`
    return t.has(key) ? t(key) : group.replace(/_/g, " ")
  }
}

/** A warning line, with its icon held to the first line of text. */
function Warning({ id, children }: { id?: string; children: string }) {
  return (
    <p id={id} className="flex items-start gap-2 text-kumo-warning">
      <span className="flex h-lh items-center">
        <WarningIcon aria-hidden="true" weight="fill" />
      </span>
      {children}
    </p>
  )
}

interface ScopePickerProps {
  /** Prefixes the ids inside, so two pickers can share a page. */
  idPrefix: string
  catalog: Loadable<ApiKeyScopeCatalog>
  onRetry: () => void
  value: string[]
  onChange: (scopes: string[]) => void
  disabled?: boolean
  /**
   * With nothing chosen, say a scope is needed (a new key, or a choice
   * cleared down to nothing) rather than that the key cannot call the API.
   */
  requireOne?: boolean
}

/**
 * What an API key may do: a preset to start from, then each scope by group,
 * as on the current page. Choosing scopes by hand makes the preset "Custom".
 */
export function ScopePicker({
  idPrefix,
  catalog,
  onRetry,
  value,
  onChange,
  disabled = false,
  requireOne = true
}: ScopePickerProps) {
  const t = useTranslations("account.apiKeys")
  const groupLabel = useGroupLabel()
  const data = catalog.status === "ready" ? catalog.data : undefined
  const presets = data?.presets ?? []
  const groups = groupScopes(data, value)

  const matched = findMatchingPreset(value, presets)
  const presetValue = matched?.id ?? (value.length > 0 ? CUSTOM_PRESET : null)
  const presetDescription = matched
    ? matched.description
    : value.length > 0
      ? COPY.customDescription
      : undefined
  const higherRisk =
    matched?.high_risk === true ||
    includesHighRiskScope(value, data?.scopes ?? [])

  // The scope list starts open for a choice no preset matches. Once it has
  // opened it stays open, so a box ticked into matching a preset does not
  // fold the list away under the pointer.
  const [open, setOpen] = useState<boolean | null>(null)
  const listOpen = open ?? presetValue === CUSTOM_PRESET

  /** Replaces one group's part of the choice, keeping the others in order. */
  function changeGroup(groupScopes: string[], next: string[]) {
    const inGroup = new Set(groupScopes)
    setOpen(true)
    onChange([...value.filter((scope) => !inGroup.has(scope)), ...next])
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="grid gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium">{t("scopes")}</span>
          <span className="text-kumo-subtle tabular-nums" aria-live="polite">
            {t.rich("selectedCount", {
              count: value.length,
              n: (chunks) => <>{chunks}</>
            })}
          </span>
        </div>
        <p className="text-kumo-subtle">{t("scopesHelp")}</p>
      </div>

      {catalog.status === "loading" && (
        <div
          role="status"
          aria-label={t("scopesLoading")}
          className="grid gap-4 rounded-lg px-4 py-4 ring ring-kumo-line"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonLine key={index} className="h-2.5 w-2/3 rounded-full" />
          ))}
        </div>
      )}

      {catalog.status === "error" && (
        <Banner
          variant="error"
          icon={<WarningCircleIcon weight="fill" />}
          title={t("scopesLoadFailed")}
          action={
            <Button size="sm" onClick={onRetry}>
              {t("retry")}
            </Button>
          }
        />
      )}

      {data && (
        <>
          <Select
            label={t("preset")}
            className="w-full"
            placeholder={t("presetPlaceholder")}
            description={presetDescription}
            value={presetValue}
            onValueChange={(id) => {
              const preset = presets.find((item) => item.id === id)
              if (preset) onChange([...preset.scopes])
            }}
            renderValue={(id) =>
              id === CUSTOM_PRESET
                ? COPY.custom
                : presets.find((item) => item.id === id)?.label
            }
            disabled={disabled || presets.length === 0}
          >
            {presets.map((preset) => (
              <Select.Option key={preset.id} value={preset.id}>
                <span className="flex items-center gap-2">
                  {preset.label}
                  {preset.high_risk && <HigherRisk />}
                </span>
              </Select.Option>
            ))}
            {presetValue === CUSTOM_PRESET && (
              <Select.Option value={CUSTOM_PRESET} disabled>
                {COPY.custom}
              </Select.Option>
            )}
          </Select>

          {higherRisk && <Warning>{t("higherRiskNotice")}</Warning>}

          <Collapsible.Root open={listOpen} onOpenChange={setOpen}>
            <Collapsible.DefaultTrigger>
              {COPY.chooseScopes}
            </Collapsible.DefaultTrigger>
            <Collapsible.DefaultPanel>
              <div className="grid grid-cols-1 gap-5">
                {groups.map(({ group, label, scopes }) => {
                  const all = scopes.map(({ scope }) => scope)
                  return (
                    <Checkbox.Group
                      key={group}
                      legend={groupLabel(group, label)}
                      appearance="card"
                      disabled={disabled}
                      value={all.filter((scope) => value.includes(scope))}
                      onValueChange={(next) => changeGroup(all, next)}
                    >
                      {scopes.map((scope) => (
                        <Checkbox.Item
                          key={scope.scope}
                          value={scope.scope}
                          label={scope.label}
                          description={
                            <span className="grid gap-1">
                              {scope.description && (
                                <span>{scope.description}</span>
                              )}
                              <span className="flex flex-wrap items-center gap-2">
                                <code className="font-mono text-[0.9em]">
                                  {scope.scope}
                                </code>
                                {scope.high_risk && <HigherRisk />}
                              </span>
                            </span>
                          }
                        />
                      ))}
                    </Checkbox.Group>
                  )
                })}
              </div>
            </Collapsible.DefaultPanel>
          </Collapsible.Root>
        </>
      )}

      {data && value.length === 0 && (
        <Warning id={scopesHintId(idPrefix)}>
          {requireOne ? t("scopesRequired") : COPY.noScopesWarning}
        </Warning>
      )}
    </div>
  )
}

interface ScopeSummaryProps {
  /** The key's name, for the button's accessible name. */
  name: string
  scopes: string[]
  catalog: ApiKeyScopeCatalog | undefined
  /** A key that no longer works: no warning for having no scopes. */
  muted?: boolean
}

/** A key's scopes in a few words, with the full list a click away. */
export function ScopeSummary({
  name,
  scopes,
  catalog,
  muted = false
}: ScopeSummaryProps) {
  const t = useTranslations("account.apiKeys")

  if (scopes.length === 0) {
    return muted ? (
      <span className="whitespace-nowrap text-kumo-subtle">
        {t("noScopes")}
      </span>
    ) : (
      <span
        className="inline-flex items-center gap-1.5 whitespace-nowrap text-kumo-warning"
        title={COPY.noScopesWarning}
      >
        <WarningIcon aria-hidden="true" weight="fill" />
        {t("noScopes")}
      </span>
    )
  }

  const preset = findMatchingPreset(scopes, catalog?.presets ?? [])
  const summary = preset?.label ?? t("scopeCount", { count: scopes.length })
  const definitions = new Map(
    (catalog?.scopes ?? []).map((scope, index) => [
      scope.scope,
      { scope, index }
    ])
  )
  const sorted = [...scopes].sort(
    (a, b) =>
      (definitions.get(a)?.index ?? Infinity) -
      (definitions.get(b)?.index ?? Infinity)
  )

  return (
    <Popover>
      <Popover.Trigger
        render={
          <button
            type="button"
            className={`inline-flex cursor-pointer items-center gap-1 whitespace-nowrap underline decoration-kumo-line decoration-dotted underline-offset-4 hover:decoration-solid ${muted ? "text-kumo-subtle" : ""}`}
          />
        }
      >
        {summary}
        <span className="sr-only">, {t("viewScopes", { name })}</span>
        <CaretDownIcon aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Content side="bottom" align="start" className="w-80 p-0">
        <div className="flex items-baseline justify-between gap-3 border-b border-kumo-hairline px-4 py-2.5">
          <Popover.Title className="font-medium">{summary}</Popover.Title>
          {preset && (
            <span className="text-kumo-subtle tabular-nums">
              {t("scopeCount", { count: scopes.length })}
            </span>
          )}
        </div>
        <ul className="max-h-72 divide-y divide-kumo-hairline overflow-y-auto">
          {sorted.map((scope) => {
            const definition = definitions.get(scope)?.scope
            return (
              <li key={scope} className="grid gap-0.5 px-4 py-2">
                <span className="flex flex-wrap items-center gap-2">
                  {definition?.label ?? scope}
                  {definition?.high_risk && <HigherRisk />}
                </span>
                <code className="font-mono text-[0.9em] text-kumo-subtle">
                  {scope}
                </code>
              </li>
            )
          })}
        </ul>
      </Popover.Content>
    </Popover>
  )
}
