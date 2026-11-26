"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getAppRestrictions,
  getPackages,
  isAppRestrictedForPackage,
  type AppStoreItem,
  type PackageSummary
} from "@/api/apps/app-store"
import { queryKeys } from "@/constants/query-keys"
import type { Cylo } from "@/lib/auth/session"
import { upgradeUrl } from "../shared"

export interface PlanRestrictions {
  /**
   * The cheapest plan on sale that may run the app. Null when none may, or
   * when no plan's restrictions could be read.
   */
  minimumPlan: string | null
  /** The plans on sale, of those that could be read, that may not run it. */
  restrictedPackageIds: ReadonlySet<number>
}

const NO_RESTRICTIONS: PlanRestrictions = {
  minimumPlan: null,
  restrictedPackageIds: new Set()
}

/** An app's category ids, as the restriction rules refer to them. */
export function appCategoryIds(
  categories: AppStoreItem["categories"] | undefined
) {
  return (categories ?? [])
    .map((category) =>
      typeof category.key === "number"
        ? category.key
        : parseInt(String(category.key), 10)
    )
    .filter((id) => Number.isFinite(id))
}

/**
 * The plans on sale, cheapest first. Legacy numeric names (e.g. "1000") are
 * left out; tiered names such as BG-2000, NG-18000 and NG-Ultima stay.
 */
function plansOnSale(packages: PackageSummary[]) {
  const order = (pkg: PackageSummary) =>
    typeof pkg.sort_order === "number"
      ? pkg.sort_order
      : Number.MAX_SAFE_INTEGER
  return packages
    .filter(
      (pkg) =>
        pkg.id > 0 &&
        pkg.display_name &&
        pkg.hidden !== 1 &&
        /^[A-Za-z]+-/.test(pkg.display_name)
    )
    .sort((a, b) => order(a) - order(b))
}

async function fetchPlanRestrictions(
  appId: number,
  categoryIds: number[]
): Promise<PlanRestrictions> {
  const plans = plansOnSale(await getPackages())
  const settled = await Promise.allSettled(
    plans.map(async (pkg) => ({
      id: pkg.id,
      name: pkg.display_name,
      restricted: isAppRestrictedForPackage(
        appId,
        categoryIds,
        await getAppRestrictions(pkg.id)
      )
    }))
  )
  // A plan whose restrictions could not be read is neither offered nor counted.
  const checked = settled.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : []
  )
  if (checked.length === 0) return NO_RESTRICTIONS

  return {
    minimumPlan: checked.find((plan) => !plan.restricted)?.name ?? null,
    restrictedPackageIds: new Set(
      checked.filter((plan) => plan.restricted).map((plan) => plan.id)
    )
  }
}

/**
 * Which plans on sale may run the app, read once for each app and shared by
 * its page and its install dialog: every plan's restrictions, compared with
 * the app and its categories.
 */
export function usePlanRestrictions(app: AppStoreItem | undefined) {
  const categoryIds = appCategoryIds(app?.categories)
  return useQuery({
    queryKey: queryKeys.apps.planRestrictions(app?.id ?? 0, categoryIds),
    queryFn: () => fetchPlanRestrictions(app?.id ?? 0, categoryIds),
    enabled: !!app
  })
}

export interface MinimumPlan {
  name: string
  /** Billing link that upgrades one of the user's restricted Appboxes, if any. */
  upgradeUrl: string | null
}

/**
 * The app page's warning: the cheapest plan that may run the app, and where
 * to upgrade, when every Appbox the user has is on a plan that may not (or,
 * with no Appbox yet, when any plan may not). Null otherwise.
 */
export function useMinimumPlan(
  app: AppStoreItem | undefined,
  cylos: Cylo[]
): MinimumPlan | null {
  const { data } = usePlanRestrictions(app)
  if (!data?.minimumPlan) return null

  const restricted = data.restrictedPackageIds
  const userPackageIds = new Set(
    cylos
      .map((cylo) => Number(cylo.package_id))
      .filter((packageId) => Number.isFinite(packageId) && packageId > 0)
  )
  const blocked =
    userPackageIds.size === 0
      ? restricted.size > 0
      : [...userPackageIds].every((packageId) => restricted.has(packageId))
  if (!blocked) return null

  const restrictedCylo = cylos.find(
    (cylo) => restricted.has(Number(cylo.package_id)) && !!cylo.whmcs_serviceid
  )
  return {
    name: data.minimumPlan,
    upgradeUrl: restrictedCylo?.whmcs_serviceid
      ? upgradeUrl(restrictedCylo.whmcs_serviceid)
      : null
  }
}
