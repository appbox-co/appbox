"use client"

import { useEffect, useState } from "react"
import {
  getAppRestrictions,
  getPackages,
  isAppRestrictedForPackage,
  type AppStoreItem
} from "@/api/apps/app-store"
import type { Cylo } from "@/lib/auth/session"
import type { MinimumPlan } from "../../_components/app-detail-view"

const BILLING_BASE_URL = "https://billing.appbox.co"

interface PlanCheck {
  appId: number
  /** First plan, cheapest first, that may run the app. */
  minimumPlan: string | null
  /** True when every Appbox the user has (or any plan, if they have none) is restricted. */
  blocked: boolean
  restrictedPackageIds: ReadonlySet<number>
}

/**
 * Works out whether the user's Appboxes are on plans that may run this app,
 * and if not, the cheapest plan that can and where to upgrade. Same checks as
 * the current app page: every visible plan's restrictions are fetched and
 * compared with the app and its categories.
 */
export function useMinimumPlan(
  app: AppStoreItem | undefined,
  cylos: Cylo[]
): MinimumPlan | null {
  const [check, setCheck] = useState<PlanCheck | null>(null)

  useEffect(() => {
    if (!app) return

    let cancelled = false
    const categoryIds = (app.categories ?? [])
      .map((category) =>
        typeof category.key === "number"
          ? category.key
          : parseInt(String(category.key), 10)
      )
      .filter((id) => Number.isFinite(id))

    const run = async (): Promise<PlanCheck> => {
      const none: PlanCheck = {
        appId: app.id,
        minimumPlan: null,
        blocked: false,
        restrictedPackageIds: new Set()
      }

      const packages = await getPackages()
      const candidates = packages
        .filter(
          (pkg) =>
            pkg.id > 0 &&
            pkg.display_name &&
            pkg.hidden !== 1 &&
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
      if (candidates.length === 0) return none

      const settled = await Promise.allSettled(
        candidates.map(async (pkg) => ({
          id: pkg.id,
          restricted: isAppRestrictedForPackage(
            app.id,
            categoryIds,
            await getAppRestrictions(pkg.id)
          )
        }))
      )
      const resolved = settled.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : []
      )
      if (resolved.length === 0) return none

      const restrictedIds = new Set(
        resolved.filter((row) => row.restricted).map((row) => row.id)
      )
      const firstEligible = candidates.find((pkg) => !restrictedIds.has(pkg.id))

      const userPackageIds = new Set(
        cylos
          .map((cylo) => Number(cylo.package_id))
          .filter((packageId) => Number.isFinite(packageId) && packageId > 0)
      )
      // Warn only if every Appbox the user has is restricted for this app
      // (or, with no Appboxes yet, if any plan is).
      const blocked =
        userPackageIds.size === 0
          ? restrictedIds.size > 0
          : [...userPackageIds].every((packageId) =>
              restrictedIds.has(packageId)
            )

      return {
        appId: app.id,
        minimumPlan: firstEligible?.display_name ?? null,
        blocked,
        restrictedPackageIds: restrictedIds
      }
    }

    run()
      .then((result) => {
        if (!cancelled) setCheck(result)
      })
      .catch(() => {
        if (!cancelled) setCheck(null)
      })

    return () => {
      cancelled = true
    }
  }, [app, cylos])

  // Ignore a result that belongs to a previously viewed app.
  if (!app || !check || check.appId !== app.id) return null
  if (!check.blocked || !check.minimumPlan) return null

  const restrictedCylo = cylos.find(
    (cylo) =>
      check.restrictedPackageIds.has(Number(cylo.package_id)) &&
      !!cylo.whmcs_serviceid
  )
  return {
    name: check.minimumPlan,
    upgradeUrl: restrictedCylo?.whmcs_serviceid
      ? `${BILLING_BASE_URL}/upgrade.php?type=package&id=${restrictedCylo.whmcs_serviceid}`
      : null
  }
}
