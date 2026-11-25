"use client"

import { useQueries } from "@tanstack/react-query"
import { getAppDetail, type AppStoreItem } from "@/api/apps/app-store"
import { queryKeys } from "@/constants/query-keys"
import { useAuth } from "@/providers/auth-provider"
import type { ScreenshotImage } from "@/types/marketing-blocks"
import { extractScreenshots } from "../../_components/appstore/app-screenshots"
import type { AppCovers } from "../../_components/appstore/app-store-cards"
import { featuredApps } from "../../_components/appstore/app-store-discover"

/**
 * Cover screenshots for the store front's featured apps. Screenshots live in
 * an app's marketing content, which the app list may not carry, so each
 * featured app's details are fetched (three at most) under the same cache key
 * as its own page, which then opens without waiting.
 */
export function useFeaturedCovers(apps: AppStoreItem[] | undefined): AppCovers {
  const { isAdmin } = useAuth()
  const featured = featuredApps(apps ?? [])
  const details = useQueries({
    queries: featured.map((app) => ({
      queryKey: queryKeys.apps.detail(app.id),
      queryFn: () => getAppDetail(app.id, undefined, isAdmin),
      // Nothing to fetch when the list already has the marketing content.
      enabled: app.marketing_content == null
    }))
  })

  const covers = new Map<number, ScreenshotImage | null>()
  featured.forEach((app, index) => {
    const detail = details[index]
    if (app.marketing_content == null && detail?.isPending) return
    const content = app.marketing_content ?? detail?.data?.marketing_content
    covers.set(app.id, extractScreenshots(content)[0] ?? null)
  })
  return covers
}
