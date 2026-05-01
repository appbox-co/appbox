import type { getPlans } from "@/api/appbox/plans"
import type { EligiblePlanOption } from "@/components/marketing/deploy-dialog"

function normalizeCategoryName(category: string) {
  return category.trim().toLowerCase()
}

function getPlanTierValue(planTitle: string) {
  const match = planTitle.match(/(?:^|[-\s])(\d{4,})(?:$|[-\s])/)
  if (!match) return null
  const value = Number.parseInt(match[1], 10)
  return Number.isNaN(value) ? null : value
}

function supportsWindowsVps(planTitle: string, groupName: string) {
  if (groupName.toLowerCase().includes("dedicated")) return true

  const tier = getPlanTierValue(planTitle)
  return tier !== null && tier >= 18000
}

function appRequiresWindowsVpsSupport(appName: string, categories: string[]) {
  const categorySet = new Set(categories.map(normalizeCategoryName))
  return appName.toLowerCase().includes("windows") && categorySet.has("vps")
}

export function getEligiblePlanOptions(
  plansData: Awaited<ReturnType<typeof getPlans>>,
  appName: string,
  appCategories: string[] = []
): EligiblePlanOption[] {
  const appCategorySet = new Set(appCategories.map(normalizeCategoryName))
  const requiresWindowsVpsSupport = appRequiresWindowsVpsSupport(
    appName,
    appCategories
  )

  return plansData.data
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .flatMap((group) =>
      group.plans
        .slice()
        .sort((a, b) => a.sort - b.sort)
        .filter((plan) => {
          if (plan.available === false) return false
          if (
            requiresWindowsVpsSupport &&
            !supportsWindowsVps(
              plan.title,
              `${group.slug} ${group.title} ${group.short_title}`
            )
          ) {
            return false
          }

          const excludedCategories = Object.values(
            plan.excluded_app_categories ?? {}
          ).map(normalizeCategoryName)

          return !excludedCategories.some((category) =>
            appCategorySet.has(category)
          )
        })
        .map((plan) => ({
          productId: plan.product_id,
          title: plan.title,
          appSlots: plan.app_slots,
          monthlyPrice: plan.pricing.EUR.monthly.per_month,
          storage: plan.storage_capacity,
          storageType: plan.storage_type,
          connectionSpeed: plan.connection_speed
        }))
    )
}
