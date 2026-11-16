"use client"

import Image from "next/image"
import {
  Badge,
  Link as KumoLink,
  LayerCard,
  SkeletonLine
} from "@cloudflare/kumo"
import { ThumbsUpIcon } from "@phosphor-icons/react"
import { getEffectiveAppSlots, type AppStoreItem } from "@/api/apps/app-store"
import { Link } from "@/i18n/routing"
import type { ScreenshotImage } from "@/types/marketing-blocks"
import { HIDDEN_CATEGORY_ID } from "./app-categories"
import { AppIcon } from "./app-icon"
import { screenshotUrl } from "./app-screenshots"
import { useKumoRoutes } from "./kumo-routes"
import { APP_ICON_BASE_URL } from "./shared"

const COPY = {
  slotCount: (count: number) => `${count} app slot${count === 1 ? "" : "s"}`,
  featured: "Featured",
  installed: "Installed",
  installedCount: (count: number) => `Installed ×${count}`,
  votes: (count: number) => `${count} upvote${count === 1 ? "" : "s"}`,
  docs: "Docs"
} as const

/** App id → how many copies of it this account has installed. */
export type InstalledCounts = ReadonlyMap<number, number>

/**
 * App id → cover screenshot. `null` means the app has none; a missing entry
 * means it is still loading.
 */
export type AppCovers = ReadonlyMap<number, ScreenshotImage | null>

export const appGridClass =
  "grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"

export function visibleCategories(app: AppStoreItem) {
  return (app.categories ?? []).filter(
    (category) => category.key !== HIDDEN_CATEGORY_ID
  )
}

/** Stretched over its positioned card, so the whole card opens the app. */
export function AppLink({ app }: { app: AppStoreItem }) {
  const routes = useKumoRoutes()
  return (
    <Link
      href={routes.appStoreApp(app.id)}
      className="text-kumo-default no-underline outline-none after:absolute after:inset-0"
    >
      {app.display_name}
    </Link>
  )
}

export function InstalledBadge({ count }: { count: number }) {
  if (count < 1) return null
  return (
    <Badge variant="success" appearance="dot" className="shrink-0">
      {count > 1 ? COPY.installedCount(count) : COPY.installed}
    </Badge>
  )
}

/* -------------------------------------------------------------------------- */
/*  Catalogue card                                                             */
/* -------------------------------------------------------------------------- */

export function AppCard({
  app,
  installed = 0
}: {
  app: AppStoreItem
  installed?: number
}) {
  const slots = getEffectiveAppSlots(app)

  return (
    <LayerCard className="h-full">
      <LayerCard.Primary className="flex-1 gap-2.5 px-4 pt-4 pb-3.5 hover:bg-kumo-tint has-focus-visible:ring-2 has-focus-visible:ring-kumo-brand">
        <div className="flex items-center gap-2.5">
          <AppIcon
            icon={app.icon_image}
            name={app.display_name}
            className="size-8 rounded-lg"
          />
          <h3 className="min-w-0 flex-1 truncate text-base font-medium">
            <AppLink app={app} />
          </h3>
          {app.featured === 1 && (
            <Badge variant="blue" className="shrink-0">
              {COPY.featured}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium">{app.publisher}</span>
          {visibleCategories(app)
            .slice(0, 2)
            .map((category) => (
              <Badge key={category.key} variant="outline">
                {category.label}
              </Badge>
            ))}
        </div>

        <p className="line-clamp-2 text-kumo-subtle">
          {app.short_description || app.description}
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <Badge variant="secondary">{COPY.slotCount(slots)}</Badge>
          {app.version && <Badge variant="secondary">{app.version}</Badge>}
        </div>
      </LayerCard.Primary>

      <LayerCard.Secondary className="justify-between gap-3 text-sm *:min-h-6">
        <span
          className="flex items-center gap-1.5 tabular-nums"
          title={COPY.votes(app.upvotes)}
        >
          <ThumbsUpIcon aria-hidden="true" size={14} />
          {app.upvotes}
          <span className="sr-only">{COPY.votes(app.upvotes)}</span>
        </span>
        <span className="flex items-center gap-3">
          <InstalledBadge count={installed} />
          {app.documentation_url && (
            <KumoLink
              href={app.documentation_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {COPY.docs}
              <KumoLink.ExternalIcon />
            </KumoLink>
          )}
        </span>
      </LayerCard.Secondary>
    </LayerCard>
  )
}

export function AppCardSkeleton() {
  return (
    <div className="grid gap-4 rounded-lg bg-kumo-base p-4 ring ring-kumo-hairline">
      <div className="flex items-center gap-2.5">
        <SkeletonLine className="size-8 shrink-0 rounded-lg" />
        <SkeletonLine className="h-3 w-1/2 rounded-full" />
      </div>
      <SkeletonLine className="h-2.5 w-1/3 rounded-full" />
      <SkeletonLine className="h-2.5 w-full rounded-full" />
      <SkeletonLine className="h-2.5 w-3/4 rounded-full" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Featured card                                                              */
/* -------------------------------------------------------------------------- */

/** Larger editorial card for the hand-picked apps at the top of the store. */
export function FeaturedCard({
  app,
  installed = 0,
  cover
}: {
  app: AppStoreItem
  installed?: number
  /** `null` when the app has no screenshot, undefined while it is loading. */
  cover?: ScreenshotImage | null
}) {
  const category = visibleCategories(app)[0]

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-xl bg-kumo-base shadow-xs ring ring-kumo-line hover:bg-kumo-tint has-focus-visible:ring-2 has-focus-visible:ring-kumo-brand">
      {/* Decorative: the title link names the app and covers the whole card. */}
      <div
        aria-hidden="true"
        className="relative aspect-video overflow-hidden border-b border-kumo-hairline bg-kumo-tint"
      >
        {cover ? (
          <Image
            src={screenshotUrl(cover.src)}
            alt=""
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            // Featured cards open the store front, so they are above the fold.
            loading="eager"
            className="object-cover object-top"
          />
        ) : (
          cover === null &&
          app.icon_image && (
            // No screenshot: a soft wash of the icon's own colours instead.
            <div
              className="absolute inset-0 scale-150 bg-cover bg-center opacity-40 blur-3xl saturate-150"
              style={{
                backgroundImage: `url("${APP_ICON_BASE_URL}${app.icon_image}")`
              }}
            />
          )
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <AppIcon
            icon={app.icon_image}
            name={app.display_name}
            className="size-10 rounded-lg"
          />
          <div className="grid min-w-0 flex-1 gap-0.5">
            <h3 className="truncate text-lg font-semibold">
              <AppLink app={app} />
            </h3>
            <p className="truncate text-kumo-subtle">
              {app.publisher}
              {category && ` · ${category.label}`}
            </p>
          </div>
          <InstalledBadge count={installed} />
        </div>
        <p className="line-clamp-2 text-kumo-subtle">
          {app.short_description || app.description}
        </p>
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/*  Shelf card                                                                 */
/* -------------------------------------------------------------------------- */

/** Compact card for the horizontal collections ("shelves"). */
export function ShelfCard({
  app,
  installed = 0
}: {
  app: AppStoreItem
  installed?: number
}) {
  return (
    <article className="relative flex h-full gap-3 rounded-lg bg-kumo-base px-4 py-3.5 ring ring-kumo-hairline hover:bg-kumo-tint has-focus-visible:ring-2 has-focus-visible:ring-kumo-brand">
      <AppIcon
        icon={app.icon_image}
        name={app.display_name}
        className="size-10 rounded-lg"
      />
      <div className="grid min-w-0 flex-1 content-start gap-1">
        <div className="flex items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate font-medium">
            <AppLink app={app} />
          </h3>
          <InstalledBadge count={installed} />
        </div>
        <p className="line-clamp-2 text-kumo-subtle">
          {app.short_description || app.description}
        </p>
      </div>
    </article>
  )
}
