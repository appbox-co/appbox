"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Banner, Button, Dialog, Label, Select } from "@cloudflare/kumo"
import {
  ArrowSquareOutIcon,
  WarningCircleIcon,
  WarningIcon,
  XIcon
} from "@phosphor-icons/react"
import type { AppStoreItem } from "@/api/apps/app-store"
import {
  computeInstallGuards,
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
import { useInstallValidation } from "@/api/apps/hooks/use-install-validation"
import { useCylosSummary } from "@/api/cylos/hooks/use-cylos"
import { isLaunchWeekEnabled } from "@/config/launch-week-flags"
import { useAppDevFlags } from "@/lib/app-dev-flags"
import type { Cylo } from "@/lib/auth/session"
import {
  clearInactiveInstallValues,
  getInstallFieldActivity,
  validInstallSubdomain
} from "@/lib/install-validation"
import { useAuth } from "@/providers/auth-provider"
import { kumoRoutes } from "../kumo-routes"
import { BoostSlider } from "./boost-slider"
import { CustomFieldInput } from "./custom-field-input"
import { CyloSelector } from "./cylo-selector"
import { DomainSection, type DomainSectionState } from "./domain-section"
import { LoadingRow } from "./field-parts"
import { InstallGuardBanner } from "./install-guard-banner"
import {
  BILLING_BASE_URL,
  findDnsInstallError,
  MARKETING_URL,
  mergeCyloWithSummary,
  parseInstallError,
  SKIP_INPUT_TYPES,
  validateField,
  type InstallGuard
} from "./logic"

/** Not in the translations: the current dialog's close button says this too. */
const COPY = {
  close: "Close"
} as const

/* -------------------------------------------------------------------------- */
/*  Install dialog                                                             */
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

/**
 * The App Store's install dialog in Kumo. Everything that decides what can be
 * installed, where, and with which values is carried over from the current
 * design unchanged; only what it renders differs.
 */
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
  // cylos summary so newly created Appboxes appear immediately and slot/status
  // calculations stay current without requiring a full page reload.
  const realCylos = useMemo(() => {
    if (targetCylos) return targetCylos
    if (!cylosSummary) return sessionCylos
    const sessionCyloById = new Map(sessionCylos.map((cylo) => [cylo.id, cylo]))
    const mergedCylos = cylosSummary.map((summaryCylo) =>
      mergeCyloWithSummary(
        summaryCylo,
        sessionCyloById.get(summaryCylo.id),
        effectiveUserId
      )
    )
    const summaryIds = new Set(cylosSummary.map((cylo) => cylo.id))
    const sessionOnlyCylos = sessionCylos.filter(
      (cylo) => !summaryIds.has(cylo.id)
    )
    return [...mergedCylos, ...sessionOnlyCylos]
  }, [targetCylos, sessionCylos, cylosSummary, effectiveUserId])
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
      (app.subdomain ? app.subdomain.trim().toLowerCase() : "") ||
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
  const selectedVersionData = versionSource.find(
    (v) => String(v.id) === selectedVersion
  )
  const requiredSlots = getEffectiveAppSlots(app, selectedVersionData)
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

  const fieldValuesWithDefaults = useMemo(() => {
    const values: Record<string, string> = {}
    for (const [fname, field] of Object.entries(customFields)) {
      values[fname] = String(field.defaultValue ?? "")
    }
    return { ...values, ...fieldValues }
  }, [customFields, fieldValues])

  const fieldActivity = useMemo(() => {
    try {
      return {
        active: getInstallFieldActivity(customFields, fieldValuesWithDefaults),
        error: undefined
      }
    } catch (error) {
      return {
        active: {} as Record<string, boolean>,
        error:
          error instanceof Error
            ? error.message
            : "Invalid installation field configuration."
      }
    }
  }, [customFields, fieldValuesWithDefaults])

  const visibleFields = useMemo(() => {
    return Object.entries(customFields).filter(([fname, field]) => {
      return !SKIP_INPUT_TYPES.has(field.type) && fieldActivity.active[fname]
    })
  }, [customFields, fieldActivity])

  const customFieldsValid = useMemo(() => {
    return (
      !fieldActivity.error &&
      Object.entries(customFields).every(([fname, field]) => {
        if (field.type === "staticText" || SKIP_INPUT_TYPES.has(field.type)) {
          return true
        }
        if (!fieldActivity.active[fname]) return true

        const value = fieldValues[fname] ?? String(field.defaultValue ?? "")
        return validateField(value, field, t) === null
      })
    )
  }, [customFields, fieldValues, fieldActivity, t])

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

  const isBlocked = installGuard !== null && !effectiveIsAdmin
  const { data: boostInfo, isLoading: boostInfoLoading } = useAppBoostInfo(
    app.id,
    selectedCyloId,
    selectedVersionId
  )
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

  const preflightPayload = useMemo(() => {
    const payload: Record<string, unknown> = {
      app_id: app.id,
      cylo_id: Number(selectedCylo),
      version_id: selectedVersion
        ? Number(selectedVersion)
        : (defaultVersionId ?? 0),
      user_id: effectiveUserId
    }
    if (showBoostSlider && boostSlots > 0) payload.boost_slots = boostSlots
    if (requiresDomain) {
      const effectiveDomainId =
        domainState.selectedDomainId ||
        (domainState.domainType === "appbox"
          ? String(selectedCyloData?.domain_id ?? "")
          : "")
      payload.subdomain = domainState.subdomain.trim().toLowerCase()
      payload.domain_id = Number(effectiveDomainId)
    }
    for (const [name, field] of Object.entries(customFields)) {
      if (
        !fieldActivity.active[name] ||
        SKIP_INPUT_TYPES.has(field.type) ||
        field.type === "staticText"
      )
        continue
      const value = fieldValuesWithDefaults[name] ?? ""
      payload[name] = value
    }
    return payload
  }, [
    app.id,
    selectedCylo,
    selectedVersion,
    defaultVersionId,
    effectiveUserId,
    requiresDomain,
    domainState,
    selectedCyloData?.domain_id,
    showBoostSlider,
    boostSlots,
    customFields,
    fieldActivity,
    fieldValuesWithDefaults
  ])
  const preflight = useInstallValidation(
    preflightPayload,
    open &&
      !!selectedCylo &&
      customFieldsValid &&
      !installMutation.isPending &&
      (!requiresDomain || validInstallSubdomain(domainState.subdomain.trim()))
  )

  // A server error on a field the dialog shows appears beside it. Any other
  // (the Appbox, version or boost, or a hidden or generated field) goes on the
  // general error line, so that a disabled Install always says why.
  const inlineErrorFields = new Set(
    isBlocked
      ? []
      : [
          ...visibleFields
            .filter(([, field]) => field.type !== "staticText")
            .map(([fname]) => fname),
          ...(requiresDomain ? ["subdomain"] : []),
          ...(requiresDomain && domainState.domainType === "custom"
            ? ["domain_id"]
            : [])
        ]
  )
  const generalErrors = [
    ...new Set(
      [
        fieldActivity.error || preflight.error,
        ...Object.entries(preflight.fieldErrors)
          .filter(([name]) => name !== "_form" && !inlineErrorFields.has(name))
          .map(([name, error]) => {
            const label = customFields[name]?.label
            return label
              ? t("install.validation.fieldError", {
                  field: label,
                  message: error.message
                })
              : error.message
          })
      ].filter((message): message is string => Boolean(message))
    )
  ]

  /* ----- Handlers ----- */
  const handleFieldChange = useCallback(
    (fname: string, value: string) => {
      setFieldValues((prev) =>
        clearInactiveInstallValues(customFields, {
          ...Object.fromEntries(
            Object.entries(customFields).map(([key, field]) => [
              key,
              String(field.defaultValue ?? "")
            ])
          ),
          ...prev,
          [fname]: value
        })
      )

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
    (app.subdomain ? app.subdomain.trim().toLowerCase() : "") ||
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
      if (!fieldActivity.active[fname]) continue
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
      } else if (!validInstallSubdomain(trimmedSub)) {
        setSubdomainError(t("install.validation.invalidSubdomain"))
        valid = false
      } else if (subdomainError) {
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
    fieldActivity,
    requiresDomain,
    domainState,
    subdomainError,
    selectedCyloData?.domain_id,
    t
  ])

  const handleInstall = async () => {
    if (!selectedCylo) return
    if (fieldActivity.error || !validateAllFields()) return

    const payload = preflightPayload

    try {
      const validation = await preflight.validate()
      if (!validation?.valid) return
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
        router.push(kumoRoutes.installedApp(result.id))
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
      const dnsError = findDnsInstallError(parsed)
      if (dnsError) {
        setDomainError(dnsError)
        setDomainState((prev) => ({ ...prev, dnsVerified: false }))
      }
      // Error is handled by the mutation state
    }
  }

  const hasMultipleVersions =
    (app.enabled_version_count ?? 0) > 1 && versionSource.length > 1
  const hasCustomFields = visibleFields.length > 0
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
    if (!boostInfoLoading && boostSlots > maxInstallBoostSlots) {
      setBoostSlots(maxInstallBoostSlots)
    }
  }, [boostInfoLoading, boostSlots, maxInstallBoostSlots])

  const isInstallDisabled =
    isBlocked ||
    !selectedCylo ||
    !customFieldsValid ||
    preflight.pending ||
    preflight.invalid ||
    availableCylos.length === 0 ||
    installMutation.isPending ||
    guardsLoading ||
    (selectedCyloId > 0 && boostInfoLoading) ||
    (requiresDomain && Boolean(subdomainError)) ||
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

  // Apps with fields to fill in get the wider dialog, as in the current design.
  const wide = hasCustomFields || requiresDomain

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog
        size={wide ? "lg" : "base"}
        className={wide ? undefined : "sm:w-[28rem]"}
      >
        {/*
         * Kumo's Dialog takes no key handler, so this wrapper fills the popup
         * and takes it instead. It is focusable so that Enter still installs
         * after a click on the dialog's own background, and it is capped at
         * the popup's height so the body scrolls between a fixed header and
         * footer.
         */}
        <div
          tabIndex={-1}
          className="relative flex max-h-[inherit] flex-col outline-none"
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
          <header className="grid shrink-0 gap-1.5 border-b border-kumo-line py-5 ps-6 pe-16">
            <Dialog.Title className="text-lg font-semibold">
              {t("app.installTitle", { name: app.display_name })}
            </Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              {t("app.requiresSlots", { count: requiredSlots })}
            </Dialog.Description>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-5 overflow-y-auto px-6 py-5">
            {/* Install guard banner */}
            {installGuard && <InstallGuardBanner guard={installGuard} />}

            {/* Loading guards indicator */}
            {guardsLoading && (
              <LoadingRow>{t("install.guard.checkingAvailability")}</LoadingRow>
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
            {!isBlocked &&
              hasMultipleVersions &&
              (versionSourceLoading ? (
                <div className="grid gap-2">
                  <Label>{t("app.selectVersion")}</Label>
                  <LoadingRow>{t("install.dialog.loadingVersions")}</LoadingRow>
                </div>
              ) : (
                <Select
                  id="version-select"
                  label={t("app.selectVersion")}
                  className="w-full"
                  placeholder={t("app.selectVersion")}
                  // Kumo shows the placeholder for null; "" would count as a value.
                  value={selectedVersion || null}
                  onValueChange={(value) => {
                    if (value !== null) setSelectedVersion(value)
                  }}
                  renderValue={(value) => {
                    const version = versionSource.find(
                      (v) => String(v.id) === value
                    )
                    return version ? (
                      <VersionLabel
                        version={version.version}
                        isDefault={version.is_default === 1}
                        defaultLabel={t("install.dialog.defaultVersion")}
                      />
                    ) : null
                  }}
                  description={
                    versionSource.length > 0
                      ? t("install.dialog.versionsAvailable", {
                          count: versionSource.length
                        })
                      : undefined
                  }
                >
                  {versionSource.map((version) => (
                    <Select.Option key={version.id} value={String(version.id)}>
                      <VersionLabel
                        version={version.version}
                        isDefault={version.is_default === 1}
                        defaultLabel={t("install.dialog.defaultVersion")}
                      />
                    </Select.Option>
                  ))}
                </Select>
              ))}

            {!isBlocked && selectedCyloId > 0 && boostInfoLoading && (
              <LoadingRow>{t("install.boost.loading")}</LoadingRow>
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
              <Banner
                variant="alert"
                icon={<WarningIcon weight="fill" />}
                description={
                  <div className="grid justify-items-start gap-2.5">
                    <p>{boostUnavailableReason}</p>
                    {boostUpgradeUrl && (
                      <Banner.Action
                        href={boostUpgradeUrl}
                        external
                        variant="secondary"
                      >
                        {t("install.boost.cta")}
                        <ArrowSquareOutIcon aria-hidden="true" size={14} />
                      </Banner.Action>
                    )}
                  </div>
                }
              />
            )}

            {/* Domain fields (RequiresDomain) */}
            {!isBlocked && requiresDomain && (
              <DomainSection
                selectedCyloId={selectedCylo}
                selectedCylo={
                  cylos.find((c) => String(c.id) === selectedCylo) ?? null
                }
                state={domainState}
                domainError={
                  domainError ?? preflight.fieldErrors.domain_id?.message
                }
                subdomainError={
                  subdomainError ?? preflight.fieldErrors.subdomain?.message
                }
                onChange={handleDomainStateChange}
                onSubdomainError={setSubdomainError}
                onDomainError={setDomainError}
              />
            )}

            {/* Pre-install description */}
            {!isBlocked && preinstallDescription && (
              <div className="wrap-break-word border-s-2 border-kumo-fill py-1 ps-4 whitespace-pre-line text-kumo-subtle">
                {preinstallDescription}
              </div>
            )}

            {/* Custom Fields */}
            {!isBlocked && hasCustomFields && (
              <div className="grid grid-cols-1 gap-5 border-t border-kumo-hairline pt-5">
                {visibleFields.map(([fname, field]) => (
                  <CustomFieldInput
                    key={fname}
                    fname={fname}
                    field={field}
                    value={
                      fieldValues[fname] ?? String(field.defaultValue ?? "")
                    }
                    error={
                      fieldErrors[fname] ??
                      preflight.fieldErrors[fname]?.message
                    }
                    onChange={handleFieldChange}
                    selectedCyloId={selectedCylo}
                    selectedVersionId={selectedVersionId}
                    customFields={customFields}
                    fieldValues={fieldValues}
                  />
                ))}
              </div>
            )}

            {generalErrors.length > 0 && (
              <div role="alert" className="grid gap-1 text-kumo-danger">
                {generalErrors.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            )}

            {installMutation.isError && parsedInstallError && (
              <Banner
                variant="error"
                icon={<WarningCircleIcon weight="fill" />}
                title={parsedInstallError.title}
                description={
                  parsedInstallError.details.length > 0 ? (
                    <ul className="grid list-disc gap-0.5 ps-4">
                      {parsedInstallError.details.slice(0, 4).map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  ) : undefined
                }
              />
            )}
          </div>

          <footer className="flex shrink-0 justify-end gap-2 border-t border-kumo-line px-6 py-4">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={installMutation.isPending}
            >
              {t("install.dialog.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleInstall}
              disabled={isInstallDisabled}
              loading={installMutation.isPending || preflight.pending}
              data-dialog-submit="true"
            >
              {installMutation.isPending
                ? t("app.installing")
                : preflight.pending
                  ? t("install.validation.validating")
                  : t("app.install")}
            </Button>
          </footer>

          {/*
           * Last in the markup, as in the current dialog, so that opening it
           * puts focus on the form rather than on the close button.
           */}
          <Dialog.Close
            render={
              <Button
                variant="ghost"
                shape="square"
                aria-label={COPY.close}
                icon={XIcon}
                className="absolute end-4 top-4"
              />
            }
          />
        </div>
      </Dialog>
    </Dialog.Root>
  )
}

function VersionLabel({
  version,
  isDefault,
  defaultLabel
}: {
  version: string
  isDefault: boolean
  defaultLabel: string
}) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="tabular-nums">{version}</span>
      {isDefault && <span className="text-kumo-subtle">{defaultLabel}</span>}
    </span>
  )
}
