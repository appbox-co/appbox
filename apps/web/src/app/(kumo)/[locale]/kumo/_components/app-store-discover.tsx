"use client"

import type { ReactNode } from "react"
import { Button, LayerCard } from "@cloudflare/kumo"
import { CaretRightIcon } from "@phosphor-icons/react"
import type { AppCategory, AppStoreItem } from "@/api/apps/app-store"
import { categoryIcon, HIDDEN_CATEGORY_ID } from "./app-categories"
import { AppIcon } from "./app-icon"
import {
  AppLink,
  FeaturedCard,
  InstalledBadge,
  ShelfCard,
  visibleCategories,
  type AppCovers,
  type InstalledCounts
} from "./app-store-cards"
import { timeOf } from "./sort-head"
import type { AppStoreFilters } from "./use-app-store-filters"

const COPY = {
  featured: "Featured",
  featuredHint: "Hand-picked by the Appbox team.",
  charts: "Top charts",
  chartsHint: "What other Appbox users are running.",
  popular: "Most popular",
  topRated: "Highest rated",
  newest: "New arrivals",
  seeAll: "See all",
  categories: "Browse by category",
  appCount: (count: number) => `${count} app${count === 1 ? "" : "s"}`,
  updated: "Recently updated",
  updatedHint: "Fresh versions, ready to install or update.",
  newestFirst: "Most recently added first."
} as const

/** How many of each thing a section shows. */
const FEATURED_LIMIT = 3
const CHART_LIMIT = 5
const SHELF_LIMIT = 4
const CATEGORY_SHELVES = 2

interface DiscoverProps {
  /** Whole catalogue, most popular first. */
  apps: AppStoreItem[]
  categories: AppCategory[]
  installed: InstalledCounts
  /** Cover screenshots for the featured apps. */
  covers: AppCovers
  onFiltersChange: (patch: Partial<AppStoreFilters>) => void
}

/** The hand-picked apps the store front leads with. */
export function featuredApps(apps: AppStoreItem[]) {
  return apps.filter((app) => app.featured === 1).slice(0, FEATURED_LIMIT)
}

/* -------------------------------------------------------------------------- */
/*  Section scaffolding                                                        */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  description,
  onSeeAll,
  children
}: {
  title: string
  description?: string
  onSeeAll?: () => void
  children: ReactNode
}) {
  return (
    <section className="grid grid-cols-1 gap-3">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-kumo-subtle">{description}</p>}
        </div>
        {onSeeAll && (
          <Button variant="ghost" size="sm" onClick={onSeeAll}>
            {COPY.seeAll}
          </Button>
        )}
      </div>
      {children}
    </section>
  )
}

const shelfGridClass =
  "grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"

function Shelf({
  apps,
  installed
}: {
  apps: AppStoreItem[]
  installed: InstalledCounts
}) {
  return (
    <ul className={shelfGridClass}>
      {apps.map((app) => (
        <li key={app.id} className="min-w-0">
          <ShelfCard app={app} installed={installed.get(app.id)} />
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */
/*  Top charts                                                                 */
/* -------------------------------------------------------------------------- */

/** A numbered chart, as in the App Store's top lists. */
function RankedList({
  title,
  apps,
  installed,
  onSeeAll
}: {
  title: string
  apps: AppStoreItem[]
  installed: InstalledCounts
  onSeeAll: () => void
}) {
  return (
    <LayerCard>
      <LayerCard.Secondary className="justify-between">
        <h3>{title}</h3>
        <Button variant="ghost" size="sm" onClick={onSeeAll}>
          {COPY.seeAll}
        </Button>
      </LayerCard.Secondary>
      <LayerCard.Primary className="gap-0 p-0">
        <ol className="list-none divide-y divide-kumo-hairline">
          {apps.map((app, index) => {
            const category = visibleCategories(app)[0]
            const count = installed.get(app.id) ?? 0
            return (
              <li
                key={app.id}
                className="relative flex items-center gap-3 px-4 py-2.5 hover:bg-kumo-tint has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-kumo-brand"
              >
                <span className="w-4 shrink-0 text-center text-kumo-subtle tabular-nums">
                  {index + 1}
                </span>
                <AppIcon
                  icon={app.icon_image}
                  name={app.display_name}
                  className="size-9 rounded-lg"
                />
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate font-medium">
                    <AppLink app={app} />
                  </span>
                  <span className="truncate text-sm text-kumo-subtle">
                    {app.publisher}
                    {category && ` · ${category.label}`}
                  </span>
                </div>
                {count > 0 ? (
                  <InstalledBadge count={count} />
                ) : (
                  <CaretRightIcon
                    aria-hidden="true"
                    size={12}
                    className="shrink-0 text-kumo-subtle"
                  />
                )}
              </li>
            )
          })}
        </ol>
      </LayerCard.Primary>
    </LayerCard>
  )
}

/* -------------------------------------------------------------------------- */
/*  Discover                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The store front: what to look at before you know what you want. Borrows the
 * featured picks, numbered charts, category tiles and collections of consumer
 * app stores, drawn with Kumo's surfaces.
 */
export function AppStoreDiscover({
  apps,
  categories,
  installed,
  covers,
  onFiltersChange
}: DiscoverProps) {
  const featured = featuredApps(apps)
  const topRated = [...apps].sort((a, b) => b.rating - a.rating)
  const newest = [...apps].sort(
    (a, b) => timeOf(b.created_at) - timeOf(a.created_at)
  )
  const updated = [...apps].sort(
    (a, b) => timeOf(b.updated_at) - timeOf(a.updated_at)
  )

  // Count from the catalogue itself, so tiles never promise apps that are hidden.
  const browsable = categories
    .filter((category) => category.id !== HIDDEN_CATEGORY_ID)
    .map((category) => ({
      category,
      apps: apps.filter((app) =>
        app.categories?.some((entry) => entry.key === category.id)
      )
    }))
    .filter((entry) => entry.apps.length > 0)
  const largest = [...browsable]
    .sort((a, b) => b.apps.length - a.apps.length)
    .slice(0, CATEGORY_SHELVES)

  return (
    <div className="grid grid-cols-1 gap-10">
      {featured.length > 0 && (
        <Section title={COPY.featured} description={COPY.featuredHint}>
          <ul className="grid list-none grid-cols-1 gap-4 md:grid-cols-3">
            {featured.map((app) => (
              <li key={app.id} className="min-w-0">
                <FeaturedCard
                  app={app}
                  installed={installed.get(app.id)}
                  cover={covers.get(app.id)}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={COPY.charts} description={COPY.chartsHint}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <RankedList
            title={COPY.popular}
            apps={apps.slice(0, CHART_LIMIT)}
            installed={installed}
            onSeeAll={() => onFiltersChange({ sort: "popular" })}
          />
          <RankedList
            title={COPY.topRated}
            apps={topRated.slice(0, CHART_LIMIT)}
            installed={installed}
            onSeeAll={() => onFiltersChange({ sort: "rating" })}
          />
          <RankedList
            title={COPY.newest}
            apps={newest.slice(0, CHART_LIMIT)}
            installed={installed}
            onSeeAll={() => onFiltersChange({ sort: "newest" })}
          />
        </div>
      </Section>

      {browsable.length > 0 && (
        <Section title={COPY.categories}>
          <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {browsable.map(({ category, apps: inCategory }) => {
              const CategoryIcon = categoryIcon(category.display_name)
              return (
                <li key={category.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      onFiltersChange({ category: String(category.id) })
                    }
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-kumo-base px-4 py-3 text-left ring ring-kumo-hairline outline-none hover:bg-kumo-tint focus-visible:ring-2 focus-visible:ring-kumo-brand"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-kumo-fill text-kumo-default">
                      <CategoryIcon size={18} />
                    </span>
                    <span className="grid min-w-0 gap-0.5">
                      <span className="truncate font-medium">
                        {category.display_name}
                      </span>
                      <span className="text-sm text-kumo-subtle">
                        {COPY.appCount(inCategory.length)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Section>
      )}

      <Section
        title={COPY.updated}
        description={COPY.updatedHint}
        onSeeAll={() => onFiltersChange({ sort: "updated" })}
      >
        <Shelf apps={updated.slice(0, SHELF_LIMIT)} installed={installed} />
      </Section>

      {largest.map(({ category, apps: inCategory }) => (
        <Section
          key={category.id}
          title={category.display_name}
          description={COPY.newestFirst}
          onSeeAll={() =>
            onFiltersChange({ category: String(category.id), sort: "newest" })
          }
        >
          <Shelf
            apps={[...inCategory]
              .sort((a, b) => timeOf(b.created_at) - timeOf(a.created_at))
              .slice(0, SHELF_LIMIT)}
            installed={installed}
          />
        </Section>
      ))}
    </div>
  )
}
