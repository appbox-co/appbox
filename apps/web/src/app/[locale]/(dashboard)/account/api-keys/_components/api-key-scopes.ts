import type {
  ApiKeyScope,
  ApiKeyScopeCatalog,
  ApiKeyScopePreset
} from "@/api/account/account"

/** Preset applied to new keys. */
export const DEFAULT_SCOPE_PRESET_ID = "read_only"

/** Group order used only when the catalog response has no groups list. */
const FALLBACK_GROUP_ORDER = [
  "catalog",
  "apps",
  "custom_tables",
  "custom_actions",
  "domains"
]

/** Group used for selected scopes the catalog no longer lists. */
export const OTHER_SCOPE_GROUP = "other"

export function hasSameScopes(a: readonly string[], b: readonly string[]) {
  const left = new Set(a)
  const right = new Set(b)
  if (left.size !== right.size) return false
  for (const scope of left) {
    if (!right.has(scope)) return false
  }
  return true
}

/** Returns the first preset whose scopes match the selection exactly. */
export function findMatchingPreset(
  scopes: readonly string[],
  presets: readonly ApiKeyScopePreset[]
) {
  if (scopes.length === 0) return undefined
  return presets.find((preset) => hasSameScopes(preset.scopes, scopes))
}

export function getDefaultScopes(presets: readonly ApiKeyScopePreset[]) {
  const preset = presets.find(({ id }) => id === DEFAULT_SCOPE_PRESET_ID)
  return preset ? [...preset.scopes] : []
}

/** True when the selection includes a scope the backend flags as high risk. */
export function includesHighRiskScope(
  selected: readonly string[],
  scopes: readonly ApiKeyScope[]
) {
  const highRisk = new Set(
    scopes.filter((scope) => scope.high_risk).map(({ scope }) => scope)
  )
  return selected.some((scope) => highRisk.has(scope))
}

export interface ScopeGroup {
  group: string
  /** Backend heading; absent when the response has no entry for the group. */
  label?: string
  scopes: ApiKeyScope[]
}

/**
 * Groups catalog scopes for display, in the backend's group order. Selected
 * scopes missing from the catalog are listed under "other" so they can still
 * be seen and removed.
 */
export function groupScopes(
  catalog: ApiKeyScopeCatalog | undefined,
  selected: readonly string[]
): ScopeGroup[] {
  const catalogGroups = catalog?.groups ?? []
  const catalogScopes = catalog?.scopes ?? []
  const labels = new Map(catalogGroups.map(({ id, label }) => [id, label]))
  const order =
    catalogGroups.length > 0
      ? catalogGroups.map(({ id }) => id)
      : FALLBACK_GROUP_ORDER

  const groups = new Map<string, ApiKeyScope[]>()
  for (const group of order) groups.set(group, [])
  for (const scope of catalogScopes) {
    const list = groups.get(scope.group) ?? []
    list.push(scope)
    groups.set(scope.group, list)
  }

  const known = new Set(catalogScopes.map(({ scope }) => scope))
  const unknown = selected.filter((scope) => !known.has(scope))
  if (unknown.length > 0) {
    groups.set(OTHER_SCOPE_GROUP, [
      ...(groups.get(OTHER_SCOPE_GROUP) ?? []),
      ...unknown.map((scope) => ({
        scope,
        group: OTHER_SCOPE_GROUP,
        label: scope,
        description: "",
        high_risk: false
      }))
    ])
  }

  return Array.from(groups, ([group, scopes]) => ({
    group,
    label: labels.get(group),
    scopes
  })).filter(({ scopes }) => scopes.length > 0)
}
