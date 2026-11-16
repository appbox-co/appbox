"use client"

import { Suspense } from "react"
import { useAppCategories, useSearchApps } from "@/api/apps/hooks/use-app-store"
import { useInstalledApps } from "@/api/installed-apps/hooks/use-installed-apps"
import { ROUTES } from "@/constants/routes"
import { useAuth } from "@/providers/auth-provider"
import { toLoadable, useAccountApps } from "../_lib/use-account-apps"
import { useFeaturedCovers } from "../_lib/use-featured-covers"
import { AppShell } from "../../_components/app-shell"
import { AppStoreView } from "../../_components/app-store-view"
import {
  DEFAULT_SORT,
  useAppStoreFilters
} from "../../_components/use-app-store-filters"

function KumoAppStore() {
  const { user, logout } = useAuth()
  const { searchGroups } = useAccountApps()
  const { filters, setFilters, resetFilters } = useAppStoreFilters()

  // The whole catalogue feeds the store front. With no filters set, the
  // filtered query below is this same query, so it is only fetched once.
  const catalogue = useSearchApps({ sort: DEFAULT_SORT })
  const search = useSearchApps({
    q: filters.q || undefined,
    category: filters.category,
    sort: filters.sort ?? DEFAULT_SORT,
    slots: filters.slots
  })
  const categories = useAppCategories()
  const covers = useFeaturedCovers(catalogue.data?.data)

  const installedApps = useInstalledApps()
  const installed = new Map<number, number>()
  for (const app of installedApps.data ?? []) {
    installed.set(app.app_id, (installed.get(app.app_id) ?? 0) + 1)
  }

  const userName = user.alias || user.firstname || user.email

  return (
    <AppShell
      width="wide"
      currentDesignHref={ROUTES.APP_STORE}
      user={{ name: userName, email: user.email }}
      search={searchGroups}
      onSignOut={() => void logout()}
    >
      <AppStoreView
        catalogue={toLoadable(catalogue, (data) => data?.data ?? [])}
        results={toLoadable(search, (data) => data?.data ?? [])}
        installed={installed}
        covers={covers}
        refreshing={search.isFetching && !search.isLoading}
        categories={categories.data ?? []}
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
      />
    </AppShell>
  )
}

/** useSearchParams needs a Suspense boundary above it. */
export default function KumoAppStorePage() {
  return (
    <Suspense>
      <KumoAppStore />
    </Suspense>
  )
}
