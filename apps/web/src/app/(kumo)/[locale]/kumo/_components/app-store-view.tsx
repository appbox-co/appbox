"use client"

import { useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Banner,
  Button,
  cn,
  Empty,
  InputGroup,
  LinkButton,
  Select
} from "@cloudflare/kumo"
import {
  MagnifyingGlassIcon,
  PackageIcon,
  StorefrontIcon,
  WarningCircleIcon,
  XIcon
} from "@phosphor-icons/react"
import type { AppCategory, AppStoreItem } from "@/api/apps/app-store"
import { HIDDEN_CATEGORY_ID } from "./app-categories"
import {
  AppCard,
  AppCardSkeleton,
  appGridClass,
  type AppCovers,
  type InstalledCounts
} from "./app-store-cards"
import { AppStoreDiscover } from "./app-store-discover"
import { FILTER_BAR_INPUT, FILTER_BAR_SELECT, FilterBar } from "./filter-bar"
import { kumoRoutes } from "./kumo-routes"
import { EMPTY_IN_CARD, type Loadable } from "./shared"
import { DEFAULT_SORT, type AppStoreFilters } from "./use-app-store-filters"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  title: "App Store",
  installedApps: "Installed apps",
  searchPlaceholder: "Search apps",
  clearSearch: "Clear search",
  category: "Category",
  allCategories: "All categories",
  slots: "App slots",
  anySlots: "Any size",
  slotCount: (count: number) => `${count} app slot${count === 1 ? "" : "s"}`,
  sort: "Sort by",
  found: (count: number) => `We found ${count} app${count === 1 ? "" : "s"}`,
  allApps: "All apps",
  allAppsHint: (count: number) =>
    `Everything in the store, A to Z. ${count} app${count === 1 ? "" : "s"}.`,
  emptyTitle: "No apps match those filters",
  clearFilters: "Clear filters",
  backToStore: "Back to the store front"
} as const

const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently updated" },
  { value: "rating", label: "Highest rated" },
  { value: "slots_asc", label: "App slots: low to high" },
  { value: "slots_desc", label: "App slots: high to low" }
] as const

/** Slot sizes the catalogue uses, matching the current App Store filter. */
const SLOT_OPTIONS = ["1", "2", "3", "5", "10", "12"]

/** Sentinel for "no filter": Kumo's Select needs a value for every option. */
const ALL = "all"

const SEARCH_DEBOUNCE_MS = 300

const NOT_INSTALLED: InstalledCounts = new Map()

export interface AppStoreViewProps {
  /** Whole catalogue, most popular first. Feeds the store front. */
  catalogue: Loadable<AppStoreItem[]>
  /** Apps matching the current filters. Shown once any filter is set. */
  results: Loadable<AppStoreItem[]>
  /** True while a filter change is being fetched over existing results. */
  refreshing?: boolean
  categories: AppCategory[]
  /** App id → number of copies this account has installed. */
  installed?: InstalledCounts
  /** Cover screenshots for the store front's featured apps. */
  covers: AppCovers
  filters: AppStoreFilters
  onFiltersChange: (patch: Partial<AppStoreFilters>) => void
  onReset: () => void
}

/* -------------------------------------------------------------------------- */
/*  App grid                                                                   */
/* -------------------------------------------------------------------------- */

function AppGrid({
  apps,
  installed,
  refreshing = false,
  onReset
}: {
  apps: Loadable<AppStoreItem[]>
  installed: InstalledCounts
  refreshing?: boolean
  onReset: () => void
}) {
  const t = useTranslations("appstore")
  const tc = useTranslations("common")

  if (apps.status === "loading") {
    return (
      <div className={appGridClass}>
        {Array.from({ length: 9 }).map((_, index) => (
          <AppCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (apps.status === "error") {
    return (
      <Banner
        variant="error"
        icon={<WarningCircleIcon weight="fill" />}
        title={tc("errors.loadAppsFailed")}
      />
    )
  }

  if (apps.data.length === 0) {
    return (
      <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
        <Empty
          className={EMPTY_IN_CARD}
          icon={<PackageIcon size={40} />}
          title={COPY.emptyTitle}
          description={t("search.noResultsDescription")}
          contents={
            <Button variant="secondary" onClick={onReset}>
              {COPY.clearFilters}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <ul
      aria-busy={refreshing}
      className={cn(appGridClass, refreshing && "opacity-60")}
    >
      {apps.data.map((app) => (
        <li key={app.id} className="min-w-0">
          <AppCard app={app} installed={installed.get(app.id)} />
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

export function AppStoreView({
  catalogue,
  results,
  refreshing = false,
  categories,
  installed = NOT_INSTALLED,
  covers,
  filters,
  onFiltersChange,
  onReset
}: AppStoreViewProps) {
  const t = useTranslations("appstore")
  const locale = useLocale()

  // The field updates as you type; the filter (and the URL) follow after a pause.
  const [query, setQuery] = useState(filters.q)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => clearTimer(timer), [])

  const changeQuery = (value: string, immediately = false) => {
    setQuery(value)
    clearTimer(timer)
    if (immediately) {
      onFiltersChange({ q: value.trim() })
    } else {
      timer.current = setTimeout(
        () => onFiltersChange({ q: value.trim() }),
        SEARCH_DEBOUNCE_MS
      )
    }
  }

  const reset = () => {
    clearTimer(timer)
    setQuery("")
    onReset()
  }

  // The full catalogue is for looking an app up, so it reads A to Z.
  const alphabetical: Loadable<AppStoreItem[]> =
    catalogue.status === "ready"
      ? {
          status: "ready",
          data: [...catalogue.data].sort((a, b) =>
            a.display_name.localeCompare(b.display_name, locale, {
              sensitivity: "base"
            })
          )
        }
      : catalogue

  const visibleCategories = categories.filter(
    (category) => category.id !== HIDDEN_CATEGORY_ID
  )
  const filtered =
    filters.q !== "" ||
    filters.category !== undefined ||
    filters.slots !== undefined ||
    filters.sort !== undefined

  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold">
            <StorefrontIcon aria-hidden="true" size={24} />
            {COPY.title}
          </h1>
          <p className="text-kumo-subtle">{t("subtitle")}</p>
        </div>
        <LinkButton href={kumoRoutes.installedApps} variant="secondary">
          {COPY.installedApps}
        </LinkButton>
      </header>

      <div className="grid gap-3">
        <FilterBar>
          <InputGroup className={FILTER_BAR_INPUT}>
            <InputGroup.Addon>
              <MagnifyingGlassIcon />
            </InputGroup.Addon>
            <InputGroup.Input
              value={query}
              placeholder={COPY.searchPlaceholder}
              aria-label={COPY.searchPlaceholder}
              autoComplete="off"
              onChange={(event) => changeQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") changeQuery(query, true)
              }}
            />
            {query && (
              <InputGroup.Addon align="end" className="pr-1">
                <InputGroup.Button
                  shape="square"
                  icon={XIcon}
                  aria-label={COPY.clearSearch}
                  onClick={() => changeQuery("", true)}
                />
              </InputGroup.Addon>
            )}
          </InputGroup>

          <Select
            aria-label={COPY.category}
            className={cn(FILTER_BAR_SELECT, "@xl:w-36 @4xl:w-44")}
            value={filters.category ?? ALL}
            onValueChange={(value) =>
              onFiltersChange({
                category: !value || value === ALL ? undefined : String(value)
              })
            }
            renderValue={(value) =>
              visibleCategories.find(
                (category) => String(category.id) === value
              )?.display_name ?? COPY.allCategories
            }
          >
            <Select.Option value={ALL}>{COPY.allCategories}</Select.Option>
            {visibleCategories.map((category) => (
              <Select.Option key={category.id} value={String(category.id)}>
                <span className="flex w-full items-center justify-between gap-4">
                  {category.display_name}
                  {category.app_count > 0 && (
                    <span className="text-kumo-subtle tabular-nums">
                      {category.app_count}
                    </span>
                  )}
                </span>
              </Select.Option>
            ))}
          </Select>

          <Select
            aria-label={COPY.slots}
            className={cn(FILTER_BAR_SELECT, "@xl:w-32 @4xl:w-36")}
            value={filters.slots ?? ALL}
            onValueChange={(value) =>
              onFiltersChange({
                slots: !value || value === ALL ? undefined : String(value)
              })
            }
            renderValue={(value) =>
              value === ALL ? COPY.anySlots : COPY.slotCount(Number(value))
            }
          >
            <Select.Option value={ALL}>{COPY.anySlots}</Select.Option>
            {SLOT_OPTIONS.map((count) => (
              <Select.Option key={count} value={count}>
                {COPY.slotCount(Number(count))}
              </Select.Option>
            ))}
          </Select>

          <Select
            aria-label={COPY.sort}
            className={cn(FILTER_BAR_SELECT, "@xl:w-40 @4xl:w-52")}
            value={filters.sort ?? DEFAULT_SORT}
            onValueChange={(value) =>
              onFiltersChange({ sort: value ? String(value) : undefined })
            }
            renderValue={(value) =>
              SORT_OPTIONS.find((option) => option.value === value)?.label ??
              SORT_OPTIONS[0].label
            }
          >
            {SORT_OPTIONS.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </FilterBar>

        {filtered && (
          <div className="flex min-h-6.5 items-center justify-between gap-3">
            <p className="text-kumo-subtle" aria-live="polite">
              {results.status === "ready"
                ? COPY.found(results.data.length)
                : "\u00A0"}
            </p>
            <Button variant="ghost" size="sm" onClick={reset}>
              {COPY.backToStore}
            </Button>
          </div>
        )}
      </div>

      {filtered ? (
        <AppGrid
          apps={results}
          installed={installed}
          refreshing={refreshing}
          onReset={reset}
        />
      ) : (
        <div className="grid grid-cols-1 gap-10 pt-2">
          {catalogue.status === "ready" && catalogue.data.length > 0 && (
            <AppStoreDiscover
              apps={catalogue.data}
              categories={categories}
              installed={installed}
              covers={covers}
              onFiltersChange={onFiltersChange}
            />
          )}

          <section className="grid grid-cols-1 gap-3">
            <div className="grid gap-1">
              <h2 className="text-lg font-semibold">{COPY.allApps}</h2>
              {catalogue.status === "ready" && (
                <p className="text-kumo-subtle">
                  {COPY.allAppsHint(catalogue.data.length)}
                </p>
              )}
            </div>
            <AppGrid
              apps={alphabetical}
              installed={installed}
              onReset={reset}
            />
          </section>
        </div>
      )}
    </div>
  )
}

function clearTimer(timer: { current: ReturnType<typeof setTimeout> | null }) {
  if (timer.current) clearTimeout(timer.current)
  timer.current = null
}
