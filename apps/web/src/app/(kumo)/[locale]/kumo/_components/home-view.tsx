"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import {
  Badge,
  Banner,
  cn,
  Empty,
  LayerCard,
  LinkButton,
  SkeletonLine
} from "@cloudflare/kumo"
import {
  ArrowRightIcon,
  CaretRightIcon,
  HardDrivesIcon,
  MagnifyingGlassIcon,
  NewspaperIcon,
  PlusIcon,
  ShieldWarningIcon,
  WarningCircleIcon,
  WarningIcon,
  type Icon
} from "@phosphor-icons/react"
import type { AppStoreItem } from "@/api/apps/app-store"
import type { BlogPost } from "@/api/blog/blog"
import type { CyloSummary } from "@/api/cylos/cylos"
import { useCyloBandwidth, useCyloDiskQuota } from "@/api/cylos/hooks/use-cylos"
import type { Notification } from "@/api/notifications/notifications"
import { Link } from "@/i18n/routing"
import { formatBytes, formatStorageGB } from "@/lib/utils/format"
import { AppIcon } from "./app-icon"
import { AppStrip, type StripApp } from "./app-strip"
import { AppboxStatusBadges } from "./appbox-status"
import { kumoRoutes } from "./kumo-routes"
import { useQuickSearch } from "./quick-search"
import {
  EMPTY_IN_CARD,
  notificationIcon,
  percentOf,
  usageTone,
  type Loadable,
  type ServiceUsage
} from "./shared"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  greeting: (name: string) => `Welcome back, ${name}`,
  search: "Search apps, Appboxes and pages",
  announcement: "New",
  appboxes: "Appboxes",
  apps: "Apps",
  recents: "Recent activity",
  noApps: "No apps installed yet.",
  recommended: "Recommended",
  twoFactorTitle: "Two-factor authentication is off",
  twoFactorMeta: "Account security",
  twoFactorAction: "Enable 2FA",
  lowQuotaTitle: (name: string) => `${name} is low on storage`,
  lowQuotaMeta: (used: string, total: string) =>
    `Storage · ${used} of ${total} used`,
  throttledTitle: (name: string) => `${name} is being throttled`,
  throttledMeta: "Network",
  suspendedTitle: (name: string) => `${name} is suspended`,
  suspendedMeta: "Billing",
  viewAppbox: "View Appbox",
  yourAppboxes: "Your Appboxes",
  addAppbox: "Add Appbox",
  storage: "Storage",
  storageHint: (used: string, total: string) => `${used} of ${total}`,
  appSlots: "App slots",
  upload: "Upload, 30 days",
  download: "Download, 30 days",
  appsOn: (name: string) => `Apps on ${name}`,
  newestApps: "New in the App Store",
  recentlyUpdated: "Recently updated",
  blog: "From the blog"
} as const

export interface HomeViewProps {
  userName: string
  showTwoFactorPrompt: boolean
  services: Loadable<CyloSummary[]>
  /** Installed apps keyed by Appbox id, pinned first. */
  apps: Loadable<ReadonlyMap<number, StripApp[]>>
  notifications: Loadable<Notification[]>
  onNotificationOpen?: (notification: Notification) => void
  newestApps: Loadable<AppStoreItem[]>
  recentlyUpdated: Loadable<AppStoreItem[]>
  blogPosts: Loadable<BlogPost[]>
}

/* -------------------------------------------------------------------------- */
/*  Search box                                                                 */
/* -------------------------------------------------------------------------- */

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="flex size-5 items-center justify-center rounded border border-kumo-hairline bg-kumo-base font-sans text-xs text-kumo-subtle">
      {children}
    </kbd>
  )
}

/** Looks like a search field, opens the ⌘K palette. */
function SearchBox() {
  const openSearch = useQuickSearch()

  return (
    <div className="kumo-search-surface w-full rounded-2xl bg-kumo-tint p-1 ring ring-kumo-hairline">
      <button
        type="button"
        onClick={openSearch}
        className="flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl bg-kumo-base px-3 text-left text-kumo-placeholder shadow-xs ring ring-kumo-line outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand"
      >
        <MagnifyingGlassIcon size={16} className="shrink-0 text-kumo-subtle" />
        <span className="min-w-0 flex-1 truncate">{COPY.search}</span>
        <span aria-hidden="true" className="flex shrink-0 items-center gap-1">
          <Key>⌘</Key>
          <Key>K</Key>
        </span>
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Link lists                                                                 */
/* -------------------------------------------------------------------------- */

function CountChip({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-kumo-fill px-1.5 text-xs/5 font-normal text-kumo-default tabular-nums">
      {count}
    </span>
  )
}

const SKELETON_WIDTHS = ["w-3/4", "w-1/2", "w-2/3"]

const rowClass =
  "group flex w-full items-center gap-2 rounded-sm py-2.5 text-left text-kumo-default no-underline outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kumo-brand"

function LinkRow({
  href,
  onClick,
  icon,
  context,
  children
}: {
  href?: string
  onClick?: () => void
  icon: ReactNode
  /** Quieter prefix, e.g. the Appbox an app lives on. */
  context?: string
  children: ReactNode
}) {
  const content = (
    <>
      <span className="flex size-5 shrink-0 items-center justify-center text-kumo-subtle">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">
        {context && <span className="text-kumo-subtle">{context} / </span>}
        <span className="group-hover:underline">{children}</span>
      </span>
      <CaretRightIcon
        aria-hidden="true"
        size={12}
        className="shrink-0 text-kumo-subtle"
      />
    </>
  )

  return (
    <li>
      {href ? (
        <Link href={href} className={rowClass}>
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className={cn(rowClass, "cursor-pointer")}
        >
          {content}
        </button>
      )}
    </li>
  )
}

/** A plain titled list of links, as on the Cloudflare account home. */
function LinkList<T>({
  title,
  count,
  href,
  state,
  emptyMessage,
  errorMessage,
  limit = 5,
  children
}: {
  title: string
  count?: number
  href?: string
  state: Loadable<T[]>
  emptyMessage: string
  errorMessage: string
  limit?: number
  children: (item: T) => ReactNode
}) {
  const heading = (
    <>
      {title}
      {count !== undefined && <CountChip count={count} />}
    </>
  )

  return (
    <section className="min-w-0">
      <h2 className="flex h-8 items-center text-base font-normal text-kumo-subtle">
        {href ? (
          <Link
            href={href}
            className="flex items-center gap-1.5 rounded-sm text-kumo-subtle no-underline outline-none hover:text-kumo-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kumo-brand"
          >
            {heading}
            <CaretRightIcon aria-hidden="true" size={12} />
          </Link>
        ) : (
          <span className="flex items-center gap-1.5">{heading}</span>
        )}
      </h2>

      {state.status === "loading" ? (
        <ul className="divide-y divide-kumo-hairline">
          {SKELETON_WIDTHS.map((width) => (
            <li key={width} className="flex h-10 items-center">
              <SkeletonLine className={cn("h-2.5 rounded-full", width)} />
            </li>
          ))}
        </ul>
      ) : state.status === "error" ? (
        <p className="py-2.5 text-kumo-danger">{errorMessage}</p>
      ) : state.data.length === 0 ? (
        <p className="py-2.5 text-kumo-subtle">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-kumo-hairline">
          {state.data.slice(0, limit).map(children)}
        </ul>
      )}
    </section>
  )
}

function statusDot(status: string) {
  if (status === "online") return "bg-kumo-success"
  if (status === "restarting") return "bg-kumo-warning"
  if (status === "suspended") return "bg-kumo-danger"
  return "bg-kumo-fill"
}

/* -------------------------------------------------------------------------- */
/*  Recommended                                                                */
/* -------------------------------------------------------------------------- */

interface Recommendation {
  id: string
  tone: "warning" | "danger"
  icon: Icon
  title: string
  meta: string
  action: string
  href: string
}

/** Things that need the user's attention, derived from account and Appbox state. */
function buildRecommendations(
  showTwoFactorPrompt: boolean,
  cylos: CyloSummary[]
): Recommendation[] {
  const items: Recommendation[] = []

  for (const cylo of cylos) {
    const appbox = {
      action: COPY.viewAppbox,
      href: kumoRoutes.appbox(cylo.id)
    }
    if (cylo.status === "suspended") {
      items.push({
        id: `suspended-${cylo.id}`,
        tone: "danger",
        icon: WarningCircleIcon,
        title: COPY.suspendedTitle(cylo.name),
        meta: COPY.suspendedMeta,
        ...appbox
      })
    }
    if (cylo.is_low_quota) {
      items.push({
        id: `quota-${cylo.id}`,
        tone: "danger",
        icon: WarningCircleIcon,
        title: COPY.lowQuotaTitle(cylo.name),
        meta: COPY.lowQuotaMeta(
          formatStorageGB(cylo.storage_used),
          formatStorageGB(cylo.storage_total)
        ),
        ...appbox
      })
    }
    if (cylo.is_throttled) {
      items.push({
        id: `throttled-${cylo.id}`,
        tone: "warning",
        icon: WarningIcon,
        title: COPY.throttledTitle(cylo.name),
        meta: COPY.throttledMeta,
        ...appbox
      })
    }
  }

  if (showTwoFactorPrompt) {
    items.push({
      id: "two-factor",
      tone: "warning",
      icon: ShieldWarningIcon,
      title: COPY.twoFactorTitle,
      meta: COPY.twoFactorMeta,
      action: COPY.twoFactorAction,
      href: kumoRoutes.twoFactor
    })
  }

  return items
}

function Recommended({ items }: { items: Recommendation[] }) {
  if (items.length === 0) return null

  return (
    <section className="grid grid-cols-1 gap-3">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        {COPY.recommended}
        <CountChip count={items.length} />
      </h2>
      <ul className="grid grid-cols-1 gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-lg bg-kumo-base px-4 py-3 shadow-xs ring ring-kumo-line"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md",
                item.tone === "danger"
                  ? "bg-kumo-danger-tint text-kumo-danger"
                  : "bg-kumo-warning-tint text-kumo-warning"
              )}
            >
              <item.icon size={16} />
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5">
              <span className="truncate font-medium">{item.title}</span>
              <span className="truncate text-sm text-kumo-subtle">
                {item.meta}
              </span>
            </div>
            <LinkButton
              href={item.href}
              variant="secondary"
              size="sm"
              className="shrink-0"
            >
              {item.action}
            </LinkButton>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Appbox cards                                                               */
/* -------------------------------------------------------------------------- */

function Stat({
  label,
  value,
  suffix,
  hint,
  children
}: {
  label: string
  value: string
  suffix?: string
  hint?: string
  children?: ReactNode
}) {
  return (
    <div className="grid content-start gap-1">
      <dt className="text-sm text-kumo-subtle">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">
        {value}
        {suffix && (
          <span className="text-base font-normal text-kumo-subtle">
            {" "}
            {suffix}
          </span>
        )}
      </dd>
      {children}
      {hint && <dd className="text-sm text-kumo-subtle">{hint}</dd>}
    </div>
  )
}

export function AppboxCard({
  cylo,
  usage,
  apps = []
}: {
  cylo: CyloSummary
  usage?: ServiceUsage
  /** Installed apps, pinned first. Shown as a shortcut strip. */
  apps?: StripApp[]
}) {
  const storageUsed = usage?.storageUsedGb ?? cylo.storage_used
  const storagePercent = percentOf(storageUsed, cylo.storage_total)
  const upload = usage?.uploadBytes ?? cylo.upload_used
  const download = usage?.downloadBytes ?? cylo.download_used

  return (
    <LayerCard>
      {/* Wraps, so a name is not squeezed out by its badges on a phone. */}
      <LayerCard.Secondary className="flex-wrap justify-between gap-x-3 gap-y-1.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <Link
            href={kumoRoutes.appbox(cylo.id)}
            className="truncate font-medium text-kumo-default no-underline hover:underline"
          >
            {cylo.name}
          </Link>
          <span className="truncate font-mono text-[0.9em] font-normal">
            {cylo.server_name}
          </span>
        </div>
        <AppboxStatusBadges cylo={cylo} />
      </LayerCard.Secondary>

      <LayerCard.Primary className="gap-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            label={COPY.storage}
            value={`${storagePercent}%`}
            hint={COPY.storageHint(
              formatStorageGB(storageUsed),
              formatStorageGB(cylo.storage_total)
            )}
          >
            <dd
              role="meter"
              aria-label={COPY.storage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(storagePercent, 100)}
              aria-valuetext={`${storagePercent}%`}
              className="h-1.5 overflow-hidden rounded-full bg-kumo-fill"
            >
              <div
                className={cn("h-full rounded-full", usageTone(storagePercent))}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </dd>
          </Stat>
          <Stat
            label={COPY.appSlots}
            value={String(cylo.app_slots_used)}
            suffix={`/ ${cylo.app_slots_total}`}
          />
          <Stat label={COPY.upload} value={formatBytes(upload, 1)} />
          <Stat label={COPY.download} value={formatBytes(download, 1)} />
        </dl>

        {apps.length > 0 && (
          <div className="flex items-center gap-3 border-t border-kumo-hairline pt-3">
            <span className="shrink-0 text-kumo-subtle">{COPY.apps}</span>
            <AppStrip apps={apps} label={COPY.appsOn(cylo.name)} />
          </div>
        )}
      </LayerCard.Primary>
    </LayerCard>
  )
}

/**
 * `AppboxCard` with the live quota and bandwidth the servers push over the
 * WebSocket, in place of the summary's figures once they arrive.
 */
function LiveAppboxCard({
  cylo,
  apps
}: {
  cylo: CyloSummary
  apps: StripApp[]
}) {
  const { data: quota } = useCyloDiskQuota(cylo.id)
  const { data: bandwidth } = useCyloBandwidth(cylo.id)

  return (
    <AppboxCard
      cylo={cylo}
      apps={apps}
      usage={{
        storageUsedGb: quota?.used_gb,
        uploadBytes: bandwidth?.upload_bytes,
        downloadBytes: bandwidth?.download_bytes
      }}
    />
  )
}

function Appboxes({
  services,
  apps
}: {
  services: Loadable<CyloSummary[]>
  apps: ReadonlyMap<number, StripApp[]>
}) {
  const tc = useTranslations("common")

  return (
    <section className="grid grid-cols-1 gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">{COPY.yourAppboxes}</h2>
        <LinkButton href="/" variant="secondary" size="sm" icon={PlusIcon}>
          {COPY.addAppbox}
        </LinkButton>
      </div>

      {services.status === "loading" ? (
        <div className="grid gap-4 rounded-lg bg-kumo-base p-4 ring ring-kumo-hairline">
          <SkeletonLine className="h-2.5 w-1/4 rounded-full" />
          <SkeletonLine className="h-5 w-1/2 rounded-full" />
          <SkeletonLine className="h-2.5 w-3/4 rounded-full" />
        </div>
      ) : services.status === "error" ? (
        <Banner
          variant="error"
          icon={<WarningCircleIcon weight="fill" />}
          title={tc("errors.loadServicesFailed")}
        />
      ) : services.data.length === 0 ? (
        <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
          <Empty
            className={EMPTY_IN_CARD}
            icon={<HardDrivesIcon size={40} />}
            title={tc("empty.noServices")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {services.data.map((cylo) => (
            <LiveAppboxCard
              key={cylo.id}
              cylo={cylo}
              apps={apps.get(cylo.id) ?? []}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

const NO_APPS: ReadonlyMap<number, StripApp[]> = new Map()

export function HomeView({
  userName,
  showTwoFactorPrompt,
  services,
  apps,
  notifications,
  onNotificationOpen,
  newestApps,
  recentlyUpdated,
  blogPosts
}: HomeViewProps) {
  const t = useTranslations("dashboard")
  const tc = useTranslations("common")

  const cylos = services.status === "ready" ? services.data : []
  const appsByCylo = apps.status === "ready" ? apps.data : NO_APPS
  const showAppbox = cylos.length > 1

  // Every installed app, pinned ones first, for the "Apps" shortcut list.
  const allApps: Loadable<{ app: StripApp; cylo: CyloSummary }[]> =
    services.status !== "ready"
      ? services
      : apps.status !== "ready"
        ? apps
        : {
            status: "ready",
            data: cylos
              .flatMap((cylo) =>
                (appsByCylo.get(cylo.id) ?? []).map((app) => ({ app, cylo }))
              )
              .sort((a, b) => Number(b.app.pinned) - Number(a.app.pinned))
          }

  const latestPost =
    blogPosts.status === "ready"
      ? [...blogPosts.data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
      : undefined

  return (
    <div className="grid grid-cols-1 gap-10">
      <header className="grid grid-cols-1 justify-items-center gap-5 pt-2 sm:pt-6">
        {latestPost && (
          <Link
            href={`/blog/${latestPost.slug}`}
            className="flex max-w-full items-center gap-2 rounded-full bg-kumo-base py-1 ps-1 pe-3 text-kumo-default no-underline shadow-xs ring ring-kumo-line outline-none hover:bg-kumo-tint focus-visible:ring-2 focus-visible:ring-kumo-brand"
          >
            <Badge variant="blue">{COPY.announcement}</Badge>
            <span className="truncate">{latestPost.title}</span>
            <ArrowRightIcon
              aria-hidden="true"
              size={14}
              className="shrink-0 text-kumo-subtle"
            />
          </Link>
        )}
        <h1 className="text-center text-3xl font-semibold">
          {COPY.greeting(userName)}
        </h1>
        <SearchBox />
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <LinkList
          title={COPY.appboxes}
          count={services.status === "ready" ? cylos.length : undefined}
          href={kumoRoutes.appboxes}
          state={services}
          emptyMessage={tc("empty.noAppboxes")}
          errorMessage={tc("errors.loadServicesFailed")}
        >
          {(cylo) => (
            <LinkRow
              key={cylo.id}
              href={kumoRoutes.appbox(cylo.id)}
              icon={
                <span
                  className={cn("size-2 rounded-full", statusDot(cylo.status))}
                />
              }
            >
              {cylo.name}
            </LinkRow>
          )}
        </LinkList>

        <LinkList
          title={COPY.apps}
          count={allApps.status === "ready" ? allApps.data.length : undefined}
          href={kumoRoutes.installedApps}
          state={allApps}
          emptyMessage={COPY.noApps}
          errorMessage={tc("errors.loadAppsFailed")}
        >
          {({ app, cylo }) => (
            <LinkRow
              key={app.id}
              href={kumoRoutes.installedApp(app.id)}
              icon={<AppIcon icon={app.icon} name={app.name} />}
              context={showAppbox ? cylo.name : undefined}
            >
              {app.name}
            </LinkRow>
          )}
        </LinkList>

        <LinkList
          title={COPY.recents}
          state={notifications}
          emptyMessage={t("notifications.empty")}
          errorMessage={tc("errors.loadNotificationsFailed")}
        >
          {(notification) => {
            const { icon: TypeIcon, className } = notificationIcon(
              notification.type
            )
            return (
              <LinkRow
                key={notification.id}
                onClick={() => onNotificationOpen?.(notification)}
                icon={
                  <TypeIcon
                    size={16}
                    className={className}
                    weight={notification.is_read ? "regular" : "fill"}
                  />
                }
              >
                {notification.content}
              </LinkRow>
            )
          }}
        </LinkList>
      </div>

      {services.status === "ready" && (
        <Recommended items={buildRecommendations(showTwoFactorPrompt, cylos)} />
      )}

      <Appboxes services={services} apps={appsByCylo} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <LinkList
          title={COPY.newestApps}
          href={`${kumoRoutes.appStore}?sort=newest`}
          state={newestApps}
          emptyMessage={tc("empty.noApps")}
          errorMessage={tc("errors.loadAppsFailed")}
        >
          {(app) => (
            <LinkRow
              key={app.id}
              href={kumoRoutes.appStoreApp(app.id)}
              icon={<AppIcon icon={app.icon_image} name={app.display_name} />}
            >
              {app.display_name}
            </LinkRow>
          )}
        </LinkList>

        <LinkList
          title={COPY.recentlyUpdated}
          href={`${kumoRoutes.appStore}?sort=updated`}
          state={recentlyUpdated}
          emptyMessage={tc("empty.noRecentlyUpdated")}
          errorMessage={tc("errors.loadAppsFailed")}
        >
          {(app) => (
            <LinkRow
              key={app.id}
              href={kumoRoutes.appStoreApp(app.id)}
              icon={<AppIcon icon={app.icon_image} name={app.display_name} />}
            >
              {app.display_name}
            </LinkRow>
          )}
        </LinkList>

        <LinkList
          title={COPY.blog}
          href="/blog"
          state={blogPosts}
          emptyMessage={tc("empty.noBlogPosts")}
          errorMessage={tc("errors.loadBlogFailed")}
        >
          {(post) => (
            <LinkRow
              key={post.id}
              href={`/blog/${post.slug}`}
              icon={<NewspaperIcon size={16} />}
            >
              {post.title}
            </LinkRow>
          )}
        </LinkList>
      </div>
    </div>
  )
}
