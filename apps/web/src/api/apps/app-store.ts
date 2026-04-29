import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client"
import { getInstalledApps } from "@/api/installed-apps/installed-apps"
import { isLaunchWeekEnabled } from "@/config/launch-week-flags"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CustomFieldValidation {
  name?: string // "remote" | "matches"
  params?: Record<string, unknown>
  minLength?: number
  maxLength?: number
}

export interface CustomField {
  label: string
  type: string // dynamicText | password | switch | email | date | search | selector | staticText | hidden | spacer | number
  width: number
  defaultValue?: string | number
  validate?: (string | CustomFieldValidation)[]
  params?: {
    autoFill?: string
    menuItems?: Record<string, string>
    regex?: string
    errorText?: string
    [key: string]: unknown
  }
}

export interface AppStoreItem {
  id: number
  display_name: string
  short_description: string
  description: string
  publisher: string
  rating: number
  upvotes: number
  downvotes: number
  uservote: number | null
  version: string
  featured: number
  icon_image: string
  installs: number
  app_slots: number
  enabled: number
  allow_multiple: number
  devsite: string
  documentation_url?: string
  helpsite: string
  type: string
  created_at: string
  updated_at: string
  categories: { key: number; label: string }[]
  default_version_id: number | null
  default_version?: Partial<AppVersion> & {
    app_slots?: number
  }
  versions?: AppVersion[]
  enabled_version_count: number
  subdomain?: string
  customFields?: Record<string, CustomField>
  custom_field_preinstall_description?: string | null
  custom_field_postinstall_description?: string | null
  marketing_content?: unknown
  RequiresDomain: number
}

export function getEffectiveAppSlots(
  app: Pick<AppStoreItem, "app_slots" | "default_version">
): number {
  const defaultSlots = app.default_version?.app_slots
  if (typeof defaultSlots === "number") {
    return defaultSlots
  }
  return app.app_slots
}

export interface AppCategory {
  id: number
  display_name: string
  slug: string
  app_count: number
}

export interface AppVersion {
  id: number
  app_id: number
  version: string
  app_slots: number
  memory: number
  cpus: number
  base_memory?: number
  base_cpus?: number
  changes: string
  enabled: number
  is_default: number
  image?: string
  custom_field_preinstall_description?: string | null
  custom_field_postinstall_description?: string | null
  created_at: string
}

export interface AppBoostInfo {
  boost_increment: number | null
  max_boost_multiplier: number | null
  max_install_boost_slots: number | null
  boost_install_allowed: number | null
  boost_install_block_reason: string | null
  cylo_free_slots: number | null
  base_memory: number
  base_cpus: number
  app_slots_cost: number
}

export interface SearchAppsResponse {
  items: AppStoreItem[]
  totalCount: number
}

function isVmApp(app: AppStoreItem): boolean {
  return (app.type ?? "").toLowerCase() === "vm"
}

function isAppVisibleByLaunchWeekFlags(
  app: AppStoreItem,
  isAdmin = false
): boolean {
  if (!isVmApp(app)) return true
  return isLaunchWeekEnabled("day_3", isAdmin)
}

function applyLaunchWeekVisibility(
  items: AppStoreItem[],
  isAdmin = false
): AppStoreItem[] {
  return items.filter((app) => isAppVisibleByLaunchWeekFlags(app, isAdmin))
}

/* -------------------------------------------------------------------------- */
/*  API functions                                                              */
/* -------------------------------------------------------------------------- */

export async function getFeaturedApps(
  limit: number = 6,
  isAdmin = false
): Promise<AppStoreItem[]> {
  const res = await apiGet<SearchAppsResponse>(
    `apps?limit=${limit}&page=1&orderby=updated_at&featured=1&server_default=0&show_app=1`
  )
  const items = res.items ?? (res as unknown as AppStoreItem[])
  return applyLaunchWeekVisibility(items, isAdmin)
}

export async function getTopApps(
  limit: number = 6,
  isAdmin = false
): Promise<AppStoreItem[]> {
  const res = await apiGet<SearchAppsResponse>(
    `apps?limit=${limit}&page=1&orderby=-rating&server_default=0&show_app=1`
  )
  const items = res.items ?? (res as unknown as AppStoreItem[])
  return applyLaunchWeekVisibility(items, isAdmin)
}

export async function getNewApps(
  limit: number = 6,
  isAdmin = false
): Promise<AppStoreItem[]> {
  const res = await apiGet<SearchAppsResponse>(
    `apps?limit=${limit}&page=1&orderby=-created_at&server_default=0&show_app=1`
  )
  const items = res.items ?? (res as unknown as AppStoreItem[])
  return applyLaunchWeekVisibility(items, isAdmin)
}

export async function getRecentlyUpdatedApps(
  limit: number = 6,
  isAdmin = false
): Promise<AppStoreItem[]> {
  const res = await apiGet<SearchAppsResponse>(
    `apps?limit=${limit}&page=1&orderby=-updated_at&server_default=0&show_app=1`
  )
  const items = res.items ?? (res as unknown as AppStoreItem[])
  return applyLaunchWeekVisibility(items, isAdmin)
}

// Aliases
export const getNewestApps = getNewApps

export async function getAppCategories(): Promise<AppCategory[]> {
  const res = await apiGet<{ items: AppCategory[] }>("appcategories")
  return res.items ?? (res as unknown as AppCategory[])
}

export async function searchApps(
  filters: {
    q?: string
    category?: string
    sort?: string
    featured?: string
    slots?: string
  },
  isAdmin = false
): Promise<{ data: AppStoreItem[]; total: number }> {
  const parts: string[] = []

  if (filters.q) {
    parts.push(`display_name=*${filters.q}*`)
  }
  if (filters.category) {
    parts.push(`categories=${filters.category}`)
  }
  if (filters.featured) {
    parts.push(`featured=${filters.featured}`)
  }
  if (filters.slots) {
    parts.push(`app_slots=${filters.slots}`)
  }

  // Map sort values to API orderby
  let orderby = "-installs"
  if (filters.sort === "newest") orderby = "-created_at"
  else if (filters.sort === "popular") orderby = "-installs"
  else if (filters.sort === "updated") orderby = "-updated_at"
  else if (filters.sort === "rating") orderby = "-rating"
  else if (filters.sort === "slots_asc") orderby = "app_slots"
  else if (filters.sort === "slots_desc") orderby = "-app_slots"
  else if (filters.sort) orderby = filters.sort

  parts.push(`orderby=${orderby}`)

  const query = `apps?limit=1000&${parts.join("&")}`

  const res = await apiGet<SearchAppsResponse>(query)
  const items = applyLaunchWeekVisibility(
    res.items ?? (res as unknown as AppStoreItem[]),
    isAdmin
  )
  const total = res.totalCount ?? items.length

  return { data: items, total }
}

export async function getAppDetail(
  appId: number,
  versionId?: number,
  isAdmin = false
): Promise<AppStoreItem> {
  const data =
    versionId && versionId > 0
      ? await apiGet<AppStoreItem>(`apps/${appId}`, {
          params: { version_id: String(versionId) }
        })
      : await apiGet<AppStoreItem>(`apps/${appId}`)

  if (!isAppVisibleByLaunchWeekFlags(data, isAdmin)) {
    throw new Error("This app is not available yet.")
  }

  return data
}

export async function getAppBoostInfo(
  appId: number,
  cyloId: number
): Promise<AppBoostInfo> {
  const data = await apiGet<AppBoostInfo>(`apps/${appId}`, {
    params: { cylo_id: String(cyloId) }
  })
  return data
}

export async function getAppVersions(appId: number): Promise<AppVersion[]> {
  const res = await apiGet<{ items: Record<string, unknown>[] }>(
    `appversions?app_id=${appId}&where=enabled&eq=1&orderby=-created_at`
  )
  const items = res.items ?? []
  return items.map((raw) => {
    const item = raw
    return {
      id: Number(item.id ?? 0),
      app_id: Number(item.app_id ?? appId),
      version: String(item.version ?? ""),
      app_slots: Number(item.app_slots ?? 0),
      // Some backends return base_memory/base_cpus instead of memory/cpus.
      memory: Number(item.memory ?? item.base_memory ?? 0),
      cpus: Number(item.cpus ?? item.base_cpus ?? 0),
      base_memory: Number(item.base_memory ?? item.memory ?? 0),
      base_cpus: Number(item.base_cpus ?? item.cpus ?? 0),
      changes: String(item.changes ?? ""),
      enabled: Number(item.enabled ?? 0),
      is_default: Number(item.is_default ?? 0),
      image:
        typeof item.image === "string" && item.image.length > 0
          ? item.image
          : undefined,
      custom_field_preinstall_description:
        typeof item.custom_field_preinstall_description === "string"
          ? item.custom_field_preinstall_description
          : null,
      custom_field_postinstall_description:
        typeof item.custom_field_postinstall_description === "string"
          ? item.custom_field_postinstall_description
          : null,
      created_at: String(item.created_at ?? "")
    } satisfies AppVersion
  })
}

/**
 * Backend: PUT /v1/apps/instances (uses PUT to create, not POST)
 * Custom field values are sent as top-level keys alongside app_id, cylo_id, etc.
 */
export async function installApp(data: {
  app_id: number
  version_id: number
  cylo_id: number
  [key: string]: unknown
}): Promise<{ id: number }> {
  return apiPut<{ id: number }>("apps/instances", data)
}

/* -------------------------------------------------------------------------- */
/*  Domain helpers (RequiresDomain apps)                                       */
/* -------------------------------------------------------------------------- */

export interface DomainOption {
  id: number
  domain: string
  type?: string // "domain" | "subdomain" etc.
  cylo_id?: number
  [key: string]: unknown
}

/**
 * Fetch custom base domains available for app installation.
 *
 * Backend: GET /v1/domains/app/install  →  DomainController::getUserInstallDomains()
 *
 * Always scoped to the current user, returns only type="domain" records.
 * Lightweight — only fetches the fields the install dialog needs.
 */
export async function getDomainsForInstall(
  search?: string,
  page = 1,
  limit = 999
): Promise<DomainOption[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page)
  })
  if (search) {
    params.set("domain", `*${search}*`)
  }
  const res = await apiGet<{
    results?: DomainOption[]
    items?: DomainOption[]
  }>(`domains/app/install?${params.toString()}`)
  return res.results ?? res.items ?? []
}

/**
 * Validate that a subdomain + domain combination is not already in use.
 * Backend: POST /v1/domains/validate
 * Returns true if available, false if taken.
 */
export async function validateSubdomain(
  subdomain: string,
  domainId: number
): Promise<boolean> {
  return apiPost<boolean>("domains/validate", {
    subdomain,
    domain_id: domainId
  })
}

export interface DnsCheckResult {
  verified: boolean
  expected_ip?: string
  resolved_ip?: string
}

/**
 * Check that the DNS A record for subdomain.domain points to the server IP.
 * Backend: POST /v1/domains/checkdns/v2
 * Returns { verified, expected_ip, resolved_ip }.
 * (The legacy /checkdns endpoint returns plain true/false and is preserved for
 * backwards compatibility with other callers.)
 */
export async function checkSubdomainDns(
  subdomain: string,
  domainId: number,
  cyloId: number
): Promise<DnsCheckResult> {
  return apiPost<DnsCheckResult>("domains/checkdns/v2", {
    subdomain,
    domain_id: domainId,
    cylo_id: cyloId
  })
}

/**
 * Add a new custom base domain (type="domain") to the user's account.
 * Backend: PUT /v1/domains
 */
export async function addCustomBaseDomain(
  domain: string
): Promise<DomainOption> {
  return apiPut<DomainOption>("domains", {
    domain,
    type: "domain",
    brand: 1
  })
}

/* -------------------------------------------------------------------------- */
/*  App restriction helpers                                                    */
/* -------------------------------------------------------------------------- */

export interface AppRestriction {
  id: number
  app_id: number | null
  category_id: number | null
  package_id: number
}

export interface PackageSummary {
  id: number
  display_name: string
  sort_order?: number | null
  hidden?: number | null
  brand_id?: number | null
}

/**
 * Fetch package catalog for resolving package IDs and display ordering.
 * Backend: GET /v1/packages
 */
export async function getPackages(): Promise<PackageSummary[]> {
  const res = await apiGet<
    | {
        items?: Record<string, unknown>[]
        results?: Record<string, unknown>[]
      }
    | Record<string, unknown>[]
  >("packages?limit=999&orderby=sort_order")
  const items = Array.isArray(res) ? res : (res.items ?? res.results ?? [])

  return items.map((raw) => ({
    id: Number(raw.id ?? 0),
    display_name: String(raw.display_name ?? ""),
    sort_order:
      raw.sort_order == null || raw.sort_order === ""
        ? null
        : Number(raw.sort_order),
    hidden: raw.hidden == null || raw.hidden === "" ? null : Number(raw.hidden),
    brand_id:
      raw.brand_id == null || raw.brand_id === "" ? null : Number(raw.brand_id)
  }))
}

/**
 * Fetch app/category restrictions for a specific package.
 * Backend: GET /v1/apprestrictedcategories?where=arc.package_id&eq={id}
 */
export async function getAppRestrictions(
  packageId: number
): Promise<AppRestriction[]> {
  const res = await apiGet<{ items: AppRestriction[] }>(
    `apprestrictedcategories?where=arc.package_id&eq=${packageId}`
  )
  return res.items ?? []
}

/**
 * Check if a specific app is restricted for a given package.
 * Checks both direct app restrictions and category-based restrictions.
 */
export function isAppRestrictedForPackage(
  appId: number,
  appCategoryIds: number[],
  restrictions: AppRestriction[]
): boolean {
  if (restrictions.length === 0) return false

  // Direct app restriction
  if (restrictions.some((r) => r.app_id === appId)) return true

  // Category-based restriction
  const restrictedCategoryIds = restrictions
    .filter((r) => r.category_id != null)
    .map((r) => r.category_id!)

  if (restrictedCategoryIds.length > 0 && appCategoryIds.length > 0) {
    return restrictedCategoryIds.some((catId) => appCategoryIds.includes(catId))
  }

  return false
}

/**
 * Compute install guards for each cylo.
 *
 * Returns a set of cylo IDs that are restricted and a set of cylo IDs
 * that already have this app installed.
 */
export async function computeInstallGuards(
  appId: number,
  appCategoryIds: number[],
  cylos: { id: number; package_id: number }[],
  userId: number
): Promise<{
  restrictedCyloIds: Set<number>
  existingAppCyloIds: Set<number>
}> {
  // Fetch user's installed apps
  const installedApps = await getInstalledApps(undefined, userId)
  const existingAppCyloIds = new Set(
    installedApps.filter((ia) => ia.app_id === appId).map((ia) => ia.cylo_id)
  )

  // Fetch restrictions per unique package
  const packageIds = [
    ...new Set(cylos.map((c) => c.package_id).filter(Boolean))
  ]
  const restrictionsByPackage = new Map<number, AppRestriction[]>()
  await Promise.all(
    packageIds.map(async (pkgId) => {
      const restrictions = await getAppRestrictions(pkgId)
      restrictionsByPackage.set(pkgId, restrictions)
    })
  )

  const restrictedCyloIds = new Set<number>()
  for (const cylo of cylos) {
    const restrictions = restrictionsByPackage.get(cylo.package_id) ?? []
    if (isAppRestrictedForPackage(appId, appCategoryIds, restrictions)) {
      restrictedCyloIds.add(cylo.id)
    }
  }

  return { restrictedCyloIds, existingAppCyloIds }
}

/* -------------------------------------------------------------------------- */
/*  Search-field helpers (instancesCyloAppId → "search" type)                  */
/* -------------------------------------------------------------------------- */

export interface SearchFieldOption {
  domain: string
  [key: string]: unknown
}

/**
 * Fetch options for a "search" custom field.
 *
 * The backend endpoint (e.g. `apps/instances/cyloAppId`) returns a paginated
 * list of Domain records.  We forward any dependency filters (cylo_id, app_id)
 * and an optional wildcard domain search term.
 */
export async function fetchSearchFieldOptions(
  apiRoute: string,
  filters: Record<string, string> = {}
): Promise<SearchFieldOption[]> {
  // apiRoute already contains base query params, e.g.
  // "apps/instances/cyloAppId?limit=200&page=1&orderby=-created_at"
  const separator = apiRoute.includes("?") ? "&" : "?"
  const filterStr = Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&")

  const url = filterStr ? `${apiRoute}${separator}${filterStr}` : apiRoute

  const res = await apiGet<{ items: SearchFieldOption[] }>(url)
  return res.items ?? []
}

/**
 * Backend: PUT /v1/vote/App/{appId}/{dir}
 * dir: 1 = upvote, 0 = downvote
 */
export async function voteApp(
  appId: number,
  direction: "up" | "down"
): Promise<void> {
  const dir = direction === "up" ? 1 : 0
  return apiPut(`vote/App/${appId}/${dir}`)
}

/**
 * Backend: DELETE /v1/vote/App/{appId}
 * Removes the current user's vote on an app.
 */
export async function deleteVoteApp(appId: number): Promise<void> {
  return apiDelete(`vote/App/${appId}`)
}
