export const APP_ICON_BASE_URL =
  "https://api.appbox.co/assets/images/apps/icons/"

/** Billing (WHMCS): where Appboxes are ordered, upgraded and paid for. */
export const BILLING_BASE_URL = "https://billing.appbox.co"

/** Where an Appbox moves to a bigger plan, by its billing service id. */
export function upgradeUrl(serviceId: string | number) {
  return `${BILLING_BASE_URL}/upgrade.php?type=package&id=${serviceId}`
}

/**
 * Kumo's Empty draws its own bordered surface. Inside a card that already has
 * one, drop it so the two outlines do not stack.
 */
export const EMPTY_IN_CARD = "rounded-none border-0 bg-transparent"

/** State of one independently loaded section of a page. */
export type Loadable<T> =
  { status: "loading" } | { status: "error" } | { status: "ready"; data: T }

export function percentOf(used: number, total: number) {
  return total > 0 ? Math.round((used / total) * 100) : 0
}

/** Fill colour for a usage bar: brand, then warning from 75%, danger from 90%. */
export function usageTone(percent: number) {
  if (percent >= 90) return "bg-kumo-danger"
  if (percent >= 75) return "bg-kumo-warning"
  return "bg-kumo-brand"
}
