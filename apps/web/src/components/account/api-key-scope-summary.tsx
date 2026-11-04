"use client"

import { useTranslations } from "next-intl"
import { AlertTriangle, ChevronDown } from "lucide-react"
import type { ApiKeyScopeCatalog } from "@/api/account/account"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { HigherRiskTag } from "./api-key-scope-picker"
import { findMatchingPreset } from "./api-key-scopes"

interface ApiKeyScopeSummaryProps {
  name: string
  scopes: string[]
  catalog: ApiKeyScopeCatalog | undefined
  muted?: boolean
}

/** Compact scope summary for the key list, with the full list in a popover. */
export function ApiKeyScopeSummary({
  name,
  scopes,
  catalog,
  muted = false
}: ApiKeyScopeSummaryProps) {
  const t = useTranslations("account.apiKeys")

  if (scopes.length === 0) {
    if (muted) {
      return <span className="text-muted-foreground">{t("noScopes")}</span>
    }
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-amber-700 dark:text-amber-300">
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
        {t("noScopes")}
      </span>
    )
  }

  const preset = findMatchingPreset(scopes, catalog?.presets ?? [])
  const summary = preset?.label ?? t("scopeCount", { count: scopes.length })
  const definitions = new Map(
    (catalog?.scopes ?? []).map((scope) => [scope.scope, scope])
  )
  const order = new Map(
    (catalog?.scopes ?? []).map((scope, index) => [scope.scope, index])
  )
  const sorted = [...scopes].sort(
    (a, b) =>
      (order.get(a) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(b) ?? Number.MAX_SAFE_INTEGER)
  )

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className={cn(
          "focus-visible:ring-ring inline-flex items-center gap-1 whitespace-nowrap font-medium underline decoration-dotted decoration-muted-foreground/60 underline-offset-4 transition-colors hover:decoration-solid focus-visible:outline-hidden focus-visible:ring-1",
          muted && "text-muted-foreground"
        )}
      >
        {summary}
        <span className="sr-only">, {t("viewScopes", { name })}</span>
        <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="flex items-baseline justify-between gap-3 border-b px-3 py-2">
          <p className="text-sm font-medium">{summary}</p>
          {preset && (
            <p className="text-xs text-muted-foreground">
              {t("scopeCount", { count: scopes.length })}
            </p>
          )}
        </div>
        <ul className="max-h-72 divide-y overflow-y-auto">
          {sorted.map((scope) => {
            const definition = definitions.get(scope)
            return (
              <li key={scope} className="space-y-0.5 px-3 py-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm">{definition?.label ?? scope}</span>
                  {definition?.high_risk && <HigherRiskTag />}
                </div>
                <code className="block font-mono text-[11px] text-muted-foreground">
                  {scope}
                </code>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
