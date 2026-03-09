"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { Package, Search, X } from "lucide-react"
import { useSearchApps } from "@/api/apps/hooks/use-app-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { AppStoreCard } from "../_components/app-store-card"
import { CategoryFilter } from "../_components/category-filter"

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="size-14 shrink-0 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AppStoreSearchPage() {
  const t = useTranslations("appstore")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read initial values from URL
  const initialQ = searchParams.get("q") ?? ""
  const initialCategory = searchParams.get("category") ?? undefined
  const initialSort = searchParams.get("sort") ?? "popular"
  const initialFeatured = searchParams.get("featured") ?? undefined
  const initialSlots = searchParams.get("slots") ?? undefined

  const [searchInput, setSearchInput] = useState(initialQ)
  const [q, setQ] = useState(initialQ)
  const [category, setCategory] = useState<string | undefined>(initialCategory)
  const [sort, setSort] = useState(initialSort)
  const [slots, setSlots] = useState<string | undefined>(initialSlots)

  const { data, isLoading, isFetching } = useSearchApps({
    q: q || undefined,
    category,
    sort,
    featured: initialFeatured,
    slots
  })

  // Sync URL when filters change
  const syncUrl = useCallback(
    (params: {
      q?: string
      category?: string
      sort?: string
      slots?: string
    }) => {
      const sp = new URLSearchParams()
      if (params.q) sp.set("q", params.q)
      if (params.category) sp.set("category", params.category)
      if (params.sort && params.sort !== "popular") sp.set("sort", params.sort)
      if (params.slots) sp.set("slots", params.slots)
      if (initialFeatured) sp.set("featured", initialFeatured)
      const qs = sp.toString()
      router.replace(`${ROUTES.APP_STORE_SEARCH}${qs ? `?${qs}` : ""}`, {
        scroll: false
      })
    },
    [router, initialFeatured]
  )

  // Debounced live search as user types
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      if (searchInput !== q) {
        setQ(searchInput)
        syncUrl({ q: searchInput, category, sort, slots })
      }
    }, 350)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      setQ(searchInput)
      syncUrl({ q: searchInput, category, sort, slots })
    },
    [searchInput, category, sort, slots, syncUrl]
  )

  const handleClearSearch = useCallback(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setSearchInput("")
    setQ("")
    syncUrl({ q: "", category, sort, slots })
  }, [category, sort, slots, syncUrl])

  const handleCategoryChange = useCallback(
    (newCategory: string | undefined) => {
      setCategory(newCategory)
      syncUrl({ q, category: newCategory, sort, slots })
    },
    [q, sort, slots, syncUrl]
  )

  const handleSortChange = useCallback(
    (newSort: string) => {
      setSort(newSort)
      syncUrl({ q, category, sort: newSort, slots })
    },
    [q, category, slots, syncUrl]
  )

  const handleSlotsChange = useCallback(
    (newSlots: string) => {
      const value = newSlots === "all" ? undefined : newSlots
      setSlots(value)
      syncUrl({ q, category, sort, slots: value })
    },
    [q, category, sort, syncUrl]
  )

  const apps = data?.data ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("search.results")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? t("search.showing", { count: data.total }) : "\u00A0"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(ROUTES.APP_STORE)}
        >
          {t("title")}
        </Button>
      </div>

      {/* Search + Sort bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("search.placeholder")}
            className={cn("pl-10 h-10", searchInput && "pr-9")}
            autoFocus
            autoComplete="off"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </form>

        <Select value={slots ?? "all"} onValueChange={handleSlotsChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("slots.all")}</SelectItem>
            <SelectItem value="1">{t("slots.slot", { count: 1 })}</SelectItem>
            <SelectItem value="2">{t("slots.slots", { count: 2 })}</SelectItem>
            <SelectItem value="3">{t("slots.slots", { count: 3 })}</SelectItem>
            <SelectItem value="5">{t("slots.slots", { count: 5 })}</SelectItem>
            <SelectItem value="10">
              {t("slots.slots", { count: 10 })}
            </SelectItem>
            <SelectItem value="12">
              {t("slots.slots", { count: 12 })}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">{t("sort.popular")}</SelectItem>
            <SelectItem value="newest">{t("sort.newest")}</SelectItem>
            <SelectItem value="updated">{t("sort.updated")}</SelectItem>
            <SelectItem value="rating">{t("sort.rating")}</SelectItem>
            <SelectItem value="slots_asc">{t("sort.slots_asc")}</SelectItem>
            <SelectItem value="slots_desc">{t("sort.slots_desc")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category filter */}
      <CategoryFilter selected={category} onChange={handleCategoryChange} />

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="size-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">
            {t("search.noResults")}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("search.noResultsDescription")}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchInput("")
              setQ("")
              setCategory(undefined)
              setSort("popular")
              setSlots(undefined)
              router.replace(ROUTES.APP_STORE_SEARCH)
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
            isFetching && "opacity-60 pointer-events-none"
          )}
        >
          {apps.map((app) => (
            <AppStoreCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  )
}
