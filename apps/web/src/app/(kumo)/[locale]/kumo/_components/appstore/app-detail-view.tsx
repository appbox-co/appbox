"use client"

import { useState, type ReactNode } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Badge,
  Button,
  Empty,
  Link as KumoLink,
  LinkButton,
  Pagination,
  SkeletonLine,
  Table
} from "@cloudflare/kumo"
import {
  DownloadSimpleIcon,
  PackageIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  WarningIcon
} from "@phosphor-icons/react"
import {
  getEffectiveAppSlots,
  type AppStoreItem,
  type AppVersion
} from "@/api/apps/app-store"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { type MinimumPlan } from "../install/use-plan-restrictions"
import { kumoRoutes } from "../kumo-routes"
import { EMPTY_IN_CARD, type Loadable } from "../shared"
import { AppIcon } from "../ui/app-icon"
import { DetailRow } from "../ui/detail-row"
import { Panel } from "../ui/panel"
import { HIDDEN_CATEGORY_ID } from "./app-categories"
import { AppInstances, type InstanceAction } from "./app-instances"
import { AppScreenshots, extractScreenshots } from "./app-screenshots"
import { InstalledBadge } from "./app-store-cards"
import { Markdown } from "./markdown"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  notFoundTitle: "App not found",
  notFoundHint: "The requested app could not be found.",
  backToStore: "Back to the App Store",
  featured: "Featured",
  install: "Install",
  usesSlots: (count: number) =>
    `Uses ${count} app slot${count === 1 ? "" : "s"} on your Appbox.`,
  minimumPlan: (plan: string) => `Available from the ${plan} plan`,
  minimumPlanHint:
    "None of your Appboxes are on a plan that includes this app.",
  rate: "Rate this app",
  upvote: (count: number) => `Upvote. ${count} votes`,
  downvote: (count: number) => `Downvote. ${count} votes`,
  about: "About",
  versions: "Versions",
  noVersions: "No versions available.",
  yourInstalls: "Your installs",
  details: "Details",
  version: "Version",
  appSlots: "App slots",
  publisher: "Publisher",
  added: "Added",
  updated: "Updated",
  resources: "Resources",
  developer: "Developer site",
  documentation: "Documentation",
  support: "Help and support",
  unlimited: "Unlimited"
} as const

const VERSIONS_PER_PAGE = 5

export interface AppDetailViewProps {
  app: Loadable<AppStoreItem>
  versions: Loadable<AppVersion[]>
  /** The signed-in user's installs of this app. */
  instances: Loadable<InstalledApp[]>
  /** Set when none of the user's Appboxes may run this app. */
  minimumPlan?: MinimumPlan | null
  votePending?: boolean
  onVote: (direction: "up" | "down" | null) => void
  onInstall: () => void
  onInstanceAction: (action: InstanceAction, ids: number[]) => Promise<unknown>
  /** Comments section, supplied by the page. */
  comments?: ReactNode
}

/* -------------------------------------------------------------------------- */
/*  Pieces                                                                     */
/* -------------------------------------------------------------------------- */

function useDate() {
  const locale = useLocale()
  return (value: string | undefined) => {
    const date = value ? new Date(value) : null
    if (!date || Number.isNaN(date.getTime())) return "—"
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }
}

/** 0 means "no limit" for a version's base memory and CPUs. */
function limit(value: number | undefined, unit = "") {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return "—"
  if (amount === 0) return COPY.unlimited
  return unit ? `${amount} ${unit}` : String(amount)
}

function VersionsTable({
  versions,
  fallbackSlots
}: {
  versions: Loadable<AppVersion[]>
  fallbackSlots: number
}) {
  const t = useTranslations("appstore")
  const formatDate = useDate()
  const [page, setPage] = useState(1)

  if (versions.status === "loading") {
    return (
      <div className="grid gap-3 p-4">
        <SkeletonLine className="h-2.5 w-1/3 rounded-full" />
        <SkeletonLine className="h-2.5 w-2/3 rounded-full" />
      </div>
    )
  }
  if (versions.status === "error" || versions.data.length === 0) {
    return <p className="px-5 py-4 text-kumo-subtle">{COPY.noVersions}</p>
  }

  const rows = versions.data.slice(
    (page - 1) * VERSIONS_PER_PAGE,
    page * VERSIONS_PER_PAGE
  )

  return (
    <div className="grid grid-cols-1">
      <div className="overflow-x-auto">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>{t("app.version")}</Table.Head>
              <Table.Head>{COPY.appSlots}</Table.Head>
              <Table.Head className="hidden sm:table-cell">
                {t("app.baseMemory")}
              </Table.Head>
              <Table.Head className="hidden sm:table-cell">
                {t("app.baseCpus")}
              </Table.Head>
              <Table.Head className="hidden md:table-cell">
                {t("app.added")}
              </Table.Head>
              <Table.Head className="hidden lg:table-cell">
                {t("app.changes")}
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((version) => {
              const slots = Number(version.app_slots ?? 0)
              return (
                <Table.Row key={version.id}>
                  <Table.Cell className="font-mono text-[0.9em] font-medium whitespace-nowrap">
                    {version.version}
                  </Table.Cell>
                  <Table.Cell className="tabular-nums">
                    {slots > 0 ? slots : fallbackSlots}
                  </Table.Cell>
                  <Table.Cell className="hidden tabular-nums sm:table-cell">
                    {limit(version.memory)}
                  </Table.Cell>
                  <Table.Cell className="hidden tabular-nums sm:table-cell">
                    {limit(version.cpus)}
                  </Table.Cell>
                  <Table.Cell className="hidden whitespace-nowrap text-kumo-subtle md:table-cell">
                    {formatDate(version.created_at)}
                  </Table.Cell>
                  <Table.Cell className="hidden text-kumo-subtle lg:table-cell">
                    <span className="line-clamp-2">
                      {version.changes || "—"}
                    </span>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </div>
      {versions.data.length > VERSIONS_PER_PAGE && (
        <div className="border-t border-kumo-hairline p-3">
          <Pagination
            page={page}
            setPage={setPage}
            perPage={VERSIONS_PER_PAGE}
            totalCount={versions.data.length}
            controls="simple"
          />
        </div>
      )}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="flex items-center gap-4">
        <SkeletonLine className="size-14 shrink-0 rounded-xl" />
        <div className="grid flex-1 gap-3">
          <SkeletonLine className="h-5 w-48 rounded-full" />
          <SkeletonLine className="h-2.5 w-64 rounded-full" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-4 rounded-lg bg-kumo-base p-5 ring ring-kumo-hairline">
          <SkeletonLine className="h-2.5 w-full rounded-full" />
          <SkeletonLine className="h-2.5 w-5/6 rounded-full" />
          <SkeletonLine className="h-2.5 w-2/3 rounded-full" />
        </div>
        <div className="grid gap-4 rounded-lg bg-kumo-base p-5 ring ring-kumo-hairline">
          <SkeletonLine className="h-9 w-full rounded-lg" />
          <SkeletonLine className="h-2.5 w-1/2 rounded-full" />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

export function AppDetailView({
  app: appState,
  versions,
  instances,
  minimumPlan,
  votePending = false,
  onVote,
  onInstall,
  onInstanceAction,
  comments
}: AppDetailViewProps) {
  const t = useTranslations("appstore")
  const formatDate = useDate()

  if (appState.status === "loading") return <DetailSkeleton />

  if (appState.status === "error") {
    return (
      <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
        <Empty
          className={EMPTY_IN_CARD}
          icon={<PackageIcon size={40} />}
          title={COPY.notFoundTitle}
          description={COPY.notFoundHint}
          contents={
            <LinkButton href={kumoRoutes.appStore} variant="secondary">
              {COPY.backToStore}
            </LinkButton>
          }
        />
      </div>
    )
  }

  const app = appState.data
  const slots = getEffectiveAppSlots(app)
  const categories = (app.categories ?? []).filter(
    (category) => category.key !== HIDDEN_CATEGORY_ID
  )
  const screenshots = extractScreenshots(app.marketing_content)
  const installedCount =
    instances.status === "ready" ? instances.data.length : 0
  const upvoted = app.uservote === 1
  const downvoted = app.uservote === 0
  const disabled = app.enabled === 0
  const links = (
    [
      [COPY.developer, app.devsite],
      [COPY.documentation, app.documentation_url],
      [COPY.support, app.helpsite]
    ] as const
  ).flatMap(([label, href]) => (href ? [{ label, href }] : []))

  return (
    <div className="grid grid-cols-1 gap-8">
      <header className="grid grid-cols-1 gap-4">
        <div className="flex items-start gap-4">
          <AppIcon
            icon={app.icon_image}
            name={app.display_name}
            className="size-14 rounded-xl text-lg"
          />
          <div className="grid min-w-0 gap-1.5">
            <h1 className="text-2xl font-semibold">{app.display_name}</h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="font-medium">{app.publisher}</span>
              {categories.map((category) => (
                <Badge key={category.key} variant="outline">
                  {category.label}
                </Badge>
              ))}
              {app.featured === 1 && (
                <Badge variant="blue">{COPY.featured}</Badge>
              )}
              <InstalledBadge count={installedCount} />
            </div>
          </div>
        </div>
        {app.short_description && (
          <p className="max-w-prose text-kumo-subtle">
            {app.short_description}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 grid-cols-1 gap-6">
          {/* Screenshots lead the page, as they do in other app stores. */}
          <AppScreenshots
            key={app.id}
            images={screenshots}
            appName={app.display_name}
          />

          <Panel title={COPY.about}>
            <Markdown content={app.description} />
          </Panel>

          <Panel
            title={COPY.versions}
            count={
              versions.status === "ready" ? versions.data.length : undefined
            }
            flush
          >
            <VersionsTable versions={versions} fallbackSlots={slots} />
          </Panel>

          <Panel
            title={COPY.yourInstalls}
            count={instances.status === "ready" ? installedCount : undefined}
            flush
          >
            <AppInstances instances={instances} onAction={onInstanceAction} />
          </Panel>

          {comments}
        </div>

        {/* One sticky column on wide screens. On small ones its two halves
            split around the main column: Install first, so it is reachable
            without scrolling, then screenshots and the rest, then details. */}
        <aside className="contents lg:sticky lg:top-0 lg:grid lg:grid-cols-1 lg:gap-4">
          <div className="order-first grid gap-3 rounded-lg bg-kumo-base px-5 py-4 shadow-xs ring ring-kumo-line lg:order-none">
            <Button
              variant="primary"
              size="lg"
              // Kumo buttons do not centre their content when stretched.
              className="w-full justify-center"
              icon={DownloadSimpleIcon}
              disabled={disabled}
              onClick={onInstall}
            >
              {disabled ? t("app.disabled") : COPY.install}
            </Button>
            <p className="text-center text-kumo-subtle">
              {COPY.usesSlots(slots)}
            </p>

            {minimumPlan && (
              // Not a Banner: its action sits beside the text, which is too
              // cramped in a column this narrow.
              <div className="grid gap-2.5 rounded-lg bg-kumo-warning-tint px-3.5 py-3">
                <div className="flex items-start gap-2">
                  <span className="flex h-lh shrink-0 items-center text-kumo-warning">
                    <WarningIcon weight="fill" size={16} />
                  </span>
                  <div className="grid gap-0.5">
                    <p className="font-medium">
                      {COPY.minimumPlan(minimumPlan.name)}
                    </p>
                    <p className="text-kumo-subtle">{COPY.minimumPlanHint}</p>
                  </div>
                </div>
                {minimumPlan.upgradeUrl && (
                  <LinkButton
                    href={minimumPlan.upgradeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                  >
                    {t("install.guard.upgradePackage")}
                  </LinkButton>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-kumo-hairline pt-3">
              <span className="text-kumo-subtle">{COPY.rate}</span>
              <span className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  aria-label={COPY.upvote(app.upvotes)}
                  aria-pressed={upvoted}
                  disabled={votePending}
                  icon={
                    <ThumbsUpIcon
                      weight={upvoted ? "fill" : "regular"}
                      className={upvoted ? "text-kumo-success" : undefined}
                    />
                  }
                  onClick={() => onVote(upvoted ? null : "up")}
                >
                  <span className="tabular-nums">{app.upvotes}</span>
                </Button>
                <Button
                  size="sm"
                  aria-label={COPY.downvote(app.downvotes)}
                  aria-pressed={downvoted}
                  disabled={votePending}
                  icon={
                    <ThumbsDownIcon
                      weight={downvoted ? "fill" : "regular"}
                      className={downvoted ? "text-kumo-danger" : undefined}
                    />
                  }
                  onClick={() => onVote(downvoted ? null : "down")}
                >
                  <span className="tabular-nums">{app.downvotes}</span>
                </Button>
              </span>
            </div>
          </div>

          <div className="order-last grid grid-cols-1 gap-4 lg:order-none">
            <Panel title={COPY.details}>
              <dl className="-my-2 divide-y divide-kumo-hairline">
                <DetailRow label={COPY.version}>
                  <span className="font-mono text-[0.9em]">
                    {app.version || "—"}
                  </span>
                </DetailRow>
                <DetailRow label={COPY.appSlots}>{slots}</DetailRow>
                <DetailRow label={COPY.publisher}>{app.publisher}</DetailRow>
                <DetailRow label={COPY.added}>
                  {formatDate(app.created_at)}
                </DetailRow>
                <DetailRow label={COPY.updated}>
                  {formatDate(app.updated_at)}
                </DetailRow>
              </dl>
            </Panel>

            {links.length > 0 && (
              <Panel title={COPY.resources}>
                <ul className="grid list-none gap-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <KumoLink
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                        <KumoLink.ExternalIcon />
                      </KumoLink>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
