"use client"

import type { AppStoreItem } from "@/api/apps/app-store"
import { ROUTES } from "@/constants/routes"
import { extractScreenshots } from "../../_components/app-screenshots"
import { AppShell } from "../../_components/app-shell"
import type { AppCovers } from "../../_components/app-store-cards"
import { featuredApps } from "../../_components/app-store-discover"
import { AppStoreView } from "../../_components/app-store-view"
import { buildSearchGroups } from "../../_components/quick-search"
import {
  useAppStoreFilters,
  type AppStoreFilters
} from "../../_components/use-app-store-filters"
import {
  appsByCylo,
  catalogue,
  categories,
  cylos,
  demoAppDetail,
  demoUser,
  installedCounts
} from "../fixtures"

const time = (value: string) => new Date(value).getTime()

const SORTERS: Record<string, (a: AppStoreItem, b: AppStoreItem) => number> = {
  popular: (a, b) => b.installs - a.installs,
  newest: (a, b) => time(b.created_at) - time(a.created_at),
  updated: (a, b) => time(b.updated_at) - time(a.updated_at),
  rating: (a, b) => b.rating - a.rating,
  slots_asc: (a, b) => a.app_slots - b.app_slots,
  slots_desc: (a, b) => b.app_slots - a.app_slots
}

/** Stands in for the search API, which does this filtering on the server. */
function applyFilters(filters: AppStoreFilters) {
  const needle = filters.q.toLowerCase()
  return catalogue
    .filter(
      (app) =>
        (!needle || app.display_name.toLowerCase().includes(needle)) &&
        (!filters.category ||
          app.categories.some(
            (category) => String(category.key) === filters.category
          )) &&
        (!filters.slots || String(app.app_slots) === filters.slots)
    )
    .sort(SORTERS[filters.sort ?? "popular"] ?? SORTERS.popular)
}

const POPULAR_FIRST = [...catalogue].sort(SORTERS.popular)

/** The live page reads these from each featured app's details. */
const COVERS: AppCovers = new Map(
  featuredApps(POPULAR_FIRST).map((app) => [
    app.id,
    extractScreenshots(demoAppDetail(app.id)?.marketing_content)[0] ?? null
  ])
)

export function DemoAppStore() {
  const { filters, setFilters, resetFilters } = useAppStoreFilters()

  return (
    <AppShell
      demo
      width="wide"
      currentDesignHref={ROUTES.APP_STORE}
      user={demoUser}
      search={buildSearchGroups(cylos, appsByCylo, true)}
    >
      <AppStoreView
        catalogue={{ status: "ready", data: POPULAR_FIRST }}
        results={{ status: "ready", data: applyFilters(filters) }}
        installed={installedCounts}
        covers={COVERS}
        categories={categories}
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
      />
    </AppShell>
  )
}
