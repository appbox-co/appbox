"use client"

import { useSearchParams } from "next/navigation"
import { usePathname, useRouter } from "@/i18n/routing"

/** Order results come back in until the user picks one. */
export const DEFAULT_SORT = "popular"

export interface AppStoreFilters {
  q: string
  /** Category id as a string, or undefined for all categories. */
  category?: string
  /** Chosen sort order. Undefined until one is picked, as on the store front. */
  sort?: string
  /** Exact app slot count as a string, or undefined for any. */
  slots?: string
}

/**
 * App Store filters, kept in the URL so a filtered view can be linked to and
 * survives a reload. Uses the same parameter names as the current App Store.
 */
export function useAppStoreFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const filters: AppStoreFilters = {
    q: params.get("q") ?? "",
    category: params.get("category") ?? undefined,
    sort: params.get("sort") ?? undefined,
    slots: params.get("slots") ?? undefined
  }

  const write = (next: AppStoreFilters) => {
    const query = new URLSearchParams()
    if (next.q) query.set("q", next.q)
    if (next.category) query.set("category", next.category)
    if (next.sort) query.set("sort", next.sort)
    if (next.slots) query.set("slots", next.slots)
    const search = query.toString()
    router.replace(search ? `${pathname}?${search}` : pathname, {
      scroll: false
    })
  }

  const setFilters = (patch: Partial<AppStoreFilters>) =>
    write({ ...filters, ...patch })
  const resetFilters = () => write({ q: "" })

  return { filters, setFilters, resetFilters }
}
