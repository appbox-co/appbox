"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Banner,
  Button,
  Checkbox,
  cn,
  Empty,
  InputGroup,
  LayerCard,
  LinkButton,
  Select,
  Table,
  Tooltip
} from "@cloudflare/kumo"
import {
  HardDrivesIcon,
  MagnifyingGlassIcon,
  PackageIcon,
  StarIcon,
  WarningCircleIcon,
  XIcon
} from "@phosphor-icons/react"
import type { CyloSummary } from "@/api/cylos/cylos"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { Link } from "@/i18n/routing"
import { kumoRoutes } from "../kumo-routes"
import { EMPTY_IN_CARD, type Loadable } from "../shared"
import { AppIcon } from "../ui/app-icon"
import {
  FILTER_BAR_INPUT,
  FILTER_BAR_SELECT,
  FilterBar
} from "../ui/filter-bar"
import { PageFooter, usePagedRows } from "../ui/paged-rows"
import { ListSkeleton } from "../ui/skeletons"
import { SortHead, timeOf, type SortState } from "../ui/sort-head"
import {
  canRunInBulk,
  INSTANCE_ACTIONS,
  INSTANCE_STATUSES,
  InstanceBulkActions,
  InstanceRowActions,
  InstanceStatusBadge,
  statusLabel,
  useInstanceRunner,
  type InstanceAction
} from "./instance-controls"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  searchPlaceholder: "Search by name, domain or Appbox",
  searchPlaceholderOneAppbox: "Search by name or domain",
  clearSearch: "Clear search",
  status: "Status",
  allStatuses: "All statuses",
  appbox: "Appbox",
  allAppboxes: "All Appboxes",
  sort: "Sort by",
  customSort: "Custom order",
  pinnedColumn: "Pinned",
  actionsColumn: "Actions",
  selectPage: "Select every app on this page",
  select: (name: string) => `Select ${name}`,
  count: (count: number) => `${count} app${count === 1 ? "" : "s"}`,
  countOf: (shown: number, total: number) => `${shown} of ${total} apps`,
  clearSelection: "Clear selection",
  noDomain: "No domain",
  open: (domain: string) => `Open ${domain} in a new tab`,
  slots: (count: number) => `${count} app slot${count === 1 ? "" : "s"}`,
  installed: (date: string) => `Installed ${date}`,
  pin: "Pin to the top",
  unpin: "Unpin",
  emptyTitle: "No apps installed yet",
  emptyHint: "Apps you install from the App Store appear here.",
  browse: "Browse the App Store",
  noMatchTitle: "No apps match those filters",
  noMatchHint: "Try a different search, status or Appbox.",
  clearFilters: "Clear filters",
  loadFailed: "Could not load your installed apps."
} as const

/** The status filter's "no filter" value. */
export const ALL_STATUSES = "all"

/* -------------------------------------------------------------------------- */
/*  Sorting                                                                    */
/* -------------------------------------------------------------------------- */

type SortKey =
  "name" | "domain" | "status" | "appbox" | "version" | "slots" | "installed"

/** `null` is the default: pinned apps first, then the server's order. */
type Sort = SortState<SortKey>

type Sorter = (a: InstalledApp, b: InstalledApp) => number

const statusRank = (status: string) => {
  const rank = (INSTANCE_STATUSES as readonly string[]).indexOf(status)
  return rank === -1 ? INSTANCE_STATUSES.length : rank
}
const byName: Sorter = (a, b) => a.display_name.localeCompare(b.display_name)

const SORTERS: Record<SortKey, Sorter> = {
  name: byName,
  domain: (a, b) => (a.domain ?? "").localeCompare(b.domain ?? ""),
  status: (a, b) => statusRank(a.status) - statusRank(b.status),
  appbox: (a, b) => a.cylo_name.localeCompare(b.cylo_name),
  version: (a, b) =>
    (a.version ?? "").localeCompare(b.version ?? "", undefined, {
      numeric: true
    }),
  slots: (a, b) => a.app_slots - b.app_slots,
  installed: (a, b) => timeOf(a.install_date) - timeOf(b.install_date)
}

/** The sort menu shown on small screens, where there are no column headers. */
const SORT_PRESETS: { value: string; label: string; sort: Sort }[] = [
  { value: "pinned", label: "Pinned first", sort: null },
  {
    value: "name:asc",
    label: "Name, A to Z",
    sort: { key: "name", dir: "asc" }
  },
  {
    value: "installed:desc",
    label: "Newest installed",
    sort: { key: "installed", dir: "desc" }
  },
  {
    value: "installed:asc",
    label: "Oldest installed",
    sort: { key: "installed", dir: "asc" }
  },
  { value: "status:asc", label: "Status", sort: { key: "status", dir: "asc" } },
  { value: "appbox:asc", label: "Appbox", sort: { key: "appbox", dir: "asc" } }
]

export interface InstalledAppsListProps {
  /** The installs to list. */
  apps: Loadable<InstalledApp[]>
  /**
   * The account's Appboxes, when the list spans them: adds the Appbox column
   * and, with more than one, the Appbox filter. Leave out on a page about a
   * single Appbox.
   */
  appboxes?: CyloSummary[]
  /** Install id → saved pin order. Pinned installs lead the default order. */
  pinned: ReadonlyMap<number, number>
  /** Runs the action on the given install ids. Resolves when the requests settle. */
  onAction: (action: InstanceAction, ids: number[]) => Promise<unknown>
  /** Pins or unpins one install. Resolves when the request settles. */
  onTogglePin: (app: InstalledApp, pin: boolean) => Promise<unknown>
  /** The status filter, when the page also sets it from elsewhere. */
  status?: string
  onStatusChange?: (status: string) => void
}

/* -------------------------------------------------------------------------- */
/*  Row pieces shared by the table and the small-screen cards                  */
/* -------------------------------------------------------------------------- */

interface RowProps {
  app: InstalledApp
  /** False on a page about one Appbox, where the column would repeat itself. */
  showAppbox: boolean
  selected: boolean
  onSelect: (selected: boolean) => void
  busy?: InstanceAction
  onRun: (action: InstanceAction) => void
  pinned: boolean
  pinBusy: boolean
  onTogglePin: () => void
}

function NameLink({ app }: { app: InstalledApp }) {
  return (
    <Link
      href={kumoRoutes.installedApp(app.id)}
      className="truncate font-medium text-kumo-default no-underline hover:underline"
    >
      {app.display_name}
    </Link>
  )
}

/** Opens the app itself, in a new tab. */
function DomainLink({
  domain,
  className
}: {
  domain: string
  className?: string
}) {
  if (!domain) {
    return (
      <span className={cn("text-kumo-subtle", className)}>{COPY.noDomain}</span>
    )
  }
  return (
    <a
      href={`https://${domain}`}
      target="_blank"
      rel="noopener noreferrer"
      title={COPY.open(domain)}
      className={cn(
        "block max-w-full truncate font-mono text-[0.9em] text-kumo-subtle no-underline hover:text-kumo-default hover:underline",
        className
      )}
    >
      {domain}
    </a>
  )
}

function PinButton({
  app,
  pinned,
  pinBusy,
  onTogglePin
}: Pick<RowProps, "app" | "pinned" | "pinBusy" | "onTogglePin">) {
  const label = pinned ? COPY.unpin : COPY.pin
  return (
    <Tooltip
      content={label}
      render={
        <Button
          size="sm"
          shape="square"
          variant="ghost"
          aria-label={`${label}: ${app.display_name}`}
          aria-pressed={pinned}
          loading={pinBusy}
          icon={
            <StarIcon
              weight={pinned ? "fill" : "regular"}
              className={pinned ? "text-kumo-warning" : undefined}
            />
          }
          onClick={onTogglePin}
        />
      }
    />
  )
}

function useInstalledDate() {
  const locale = useLocale()
  return (value: string) =>
    new Date(value).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
}

/**
 * One install as a table row. Columns appear as the table gets room for them;
 * until the domain has its own column it sits under the name.
 */
function InstalledAppRow({
  app,
  showAppbox,
  selected,
  onSelect,
  busy,
  onRun,
  pinned,
  pinBusy,
  onTogglePin
}: RowProps) {
  const formatDate = useInstalledDate()

  return (
    <Table.Row variant={selected ? "selected" : "default"}>
      <Table.CheckCell
        checked={selected}
        onCheckedChange={(checked) => onSelect(Boolean(checked))}
        aria-label={COPY.select(app.display_name)}
      />
      <Table.Cell className="px-0!">
        <PinButton
          app={app}
          pinned={pinned}
          pinBusy={pinBusy}
          onTogglePin={onTogglePin}
        />
      </Table.Cell>
      {/* Takes the slack and truncates; the column breakpoints keep it roomy. */}
      <Table.Cell className="w-full max-w-0 overflow-hidden">
        <span className="flex min-w-0 items-center gap-2.5">
          <AppIcon
            icon={app.icon_image}
            name={app.display_name}
            className="size-7"
          />
          <span className="grid min-w-0 gap-0.5">
            <NameLink app={app} />
            <DomainLink domain={app.domain} className="@4xl:hidden" />
          </span>
        </span>
      </Table.Cell>
      <Table.Cell className="hidden @4xl:table-cell">
        <DomainLink
          domain={app.domain}
          className="max-w-56 @min-[78rem]:max-w-72"
        />
      </Table.Cell>
      <Table.Cell>
        <InstanceStatusBadge status={app.status} />
      </Table.Cell>
      {showAppbox && (
        <Table.Cell className="hidden @2xl:table-cell">
          <span className="block max-w-32 truncate">{app.cylo_name}</span>
        </Table.Cell>
      )}
      <Table.Cell className="hidden font-mono text-[0.9em] whitespace-nowrap @min-[67rem]:table-cell">
        {app.version || "—"}
      </Table.Cell>
      <Table.Cell className="hidden tabular-nums @min-[74rem]:table-cell">
        {app.app_slots}
      </Table.Cell>
      <Table.Cell className="hidden whitespace-nowrap text-kumo-subtle @min-[62rem]:table-cell">
        <time dateTime={app.install_date} suppressHydrationWarning>
          {formatDate(app.install_date)}
        </time>
      </Table.Cell>
      <Table.Cell>
        <span className="flex justify-end">
          <InstanceRowActions app={app} busy={busy} onRun={onRun} />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

/** The same install as a card, for screens too narrow for a table. */
function InstalledAppCard({
  app,
  showAppbox,
  selected,
  onSelect,
  busy,
  onRun,
  pinned,
  pinBusy,
  onTogglePin
}: RowProps) {
  const formatDate = useInstalledDate()

  return (
    <LayerCard>
      <LayerCard.Primary
        className={cn(
          "flex-row flex-wrap items-center gap-x-3 gap-y-2.5 px-4 py-3.5",
          selected && "bg-kumo-tint"
        )}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(Boolean(checked))}
          aria-label={COPY.select(app.display_name)}
        />
        <AppIcon
          icon={app.icon_image}
          name={app.display_name}
          className="size-10 rounded-lg"
        />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="grid min-w-0 text-base">
              <NameLink app={app} />
            </h3>
            <InstanceStatusBadge status={app.status} />
          </div>
          <DomainLink domain={app.domain} />
        </div>
        <div className="flex w-full items-center justify-end gap-1">
          <InstanceRowActions app={app} busy={busy} onRun={onRun} />
          <PinButton
            app={app}
            pinned={pinned}
            pinBusy={pinBusy}
            onTogglePin={onTogglePin}
          />
        </div>
      </LayerCard.Primary>

      <LayerCard.Secondary className="flex-wrap justify-between gap-x-4 gap-y-1 font-normal">
        <span className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
          {showAppbox && (
            <span className="flex min-w-0 items-center gap-1.5">
              <HardDrivesIcon
                aria-hidden="true"
                size={14}
                className="shrink-0"
              />
              <span className="truncate">{app.cylo_name}</span>
            </span>
          )}
          {app.version && (
            <span className="font-mono text-[0.9em]">{app.version}</span>
          )}
          <span>{COPY.slots(app.app_slots)}</span>
        </span>
        <time dateTime={app.install_date} suppressHydrationWarning>
          {COPY.installed(formatDate(app.install_date))}
        </time>
      </LayerCard.Secondary>
    </LayerCard>
  )
}

/* -------------------------------------------------------------------------- */
/*  List                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Installed apps as a table: dense enough for dozens of apps, with columns
 * that line up for scanning and sorting. Search, filters, selection, pins and
 * the power controls come from the current design. Where there is no room for
 * a table each app becomes a card instead.
 */
export function InstalledAppsList({
  apps,
  appboxes,
  pinned,
  onAction,
  onTogglePin,
  status: statusProp,
  onStatusChange
}: InstalledAppsListProps) {
  const t = useTranslations("appboxmanager.installedApps")

  const [query, setQuery] = useState("")
  const [ownStatus, setOwnStatus] = useState<string>(ALL_STATUSES)
  const status = statusProp ?? ownStatus
  const setStatus = (next: string) => {
    setOwnStatus(next)
    onStatusChange?.(next)
  }
  const [cylo, setCylo] = useState<string>(ALL_STATUSES)
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set())
  const [pinBusy, setPinBusy] = useState<ReadonlySet<number>>(new Set())
  const { busy, bulk, runRow, runBulk } = useInstanceRunner(onAction)

  const all = apps.status === "ready" ? apps.data : []
  const showAppbox = appboxes !== undefined
  const searchPlaceholder = showAppbox
    ? COPY.searchPlaceholder
    : COPY.searchPlaceholderOneAppbox
  const presets = showAppbox
    ? SORT_PRESETS
    : SORT_PRESETS.filter((preset) => preset.sort?.key !== "appbox")

  const needle = query.trim().toLowerCase()
  const matches = all.filter(
    (app) =>
      (status === ALL_STATUSES || app.status === status) &&
      (cylo === ALL_STATUSES || String(app.cylo_id) === cylo) &&
      (!needle ||
        `${app.display_name} ${app.domain} ${app.cylo_name} ${app.version} ${app.status}`
          .toLowerCase()
          .includes(needle))
  )
  // Ties and unpinned apps keep the server's order.
  const { rows, total, sort, setSort, sortBy, firstPage, pager } = usePagedRows(
    matches,
    {
      sorters: SORTERS,
      tieBreak: byName,
      unsorted: (a, b) =>
        (pinned.get(a.id) ?? Number.POSITIVE_INFINITY) -
        (pinned.get(b.id) ?? Number.POSITIVE_INFINITY)
    }
  )

  // A selection outlives paging and filtering, as in the current design.
  const selectedRows = all.filter((app) => selected.has(app.id))
  const unavailable = selectedRows.filter(
    (app) => !INSTANCE_ACTIONS.some((action) => canRunInBulk(action, app))
  ).length
  const allOnPage = rows.length > 0 && rows.every((app) => selected.has(app.id))
  const someOnPage = rows.some((app) => selected.has(app.id))
  const filtered =
    status !== ALL_STATUSES || cylo !== ALL_STATUSES || needle !== ""
  const sortValue = sort ? `${sort.key}:${sort.dir}` : SORT_PRESETS[0].value

  const toggle = (ids: number[], on: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)))
      return next
    })
  const togglePage = (on: boolean) =>
    toggle(
      rows.map((app) => app.id),
      on
    )

  const togglePin = async (app: InstalledApp) => {
    setPinBusy((current) => new Set(current).add(app.id))
    try {
      await onTogglePin(app, !pinned.has(app.id))
    } catch {
      // Reported by the request.
    } finally {
      setPinBusy((current) => {
        const next = new Set(current)
        next.delete(app.id)
        return next
      })
    }
  }

  const clearFilters = () => {
    setQuery("")
    setStatus(ALL_STATUSES)
    setCylo(ALL_STATUSES)
    firstPage()
  }

  const rowProps = (app: InstalledApp): RowProps => ({
    app,
    showAppbox,
    selected: selected.has(app.id),
    onSelect: (on) => toggle([app.id], on),
    busy: busy.get(app.id),
    onRun: (action) => void runRow(action, app),
    pinned: pinned.has(app.id),
    pinBusy: pinBusy.has(app.id),
    onTogglePin: () => void togglePin(app)
  })

  return (
    // The container the table's columns and the card fallback respond to.
    <div className="@container grid min-w-0 grid-cols-1 gap-3">
      {/* The sort menu comes last and gives way to the table's sortable
          headers once the table shows. */}
      <FilterBar dropLastWhenWide>
        <InputGroup className={FILTER_BAR_INPUT}>
          <InputGroup.Addon>
            <MagnifyingGlassIcon />
          </InputGroup.Addon>
          <InputGroup.Input
            value={query}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value)
              firstPage()
            }}
          />
          {query && (
            <InputGroup.Addon align="end" className="pr-1">
              <InputGroup.Button
                shape="square"
                icon={XIcon}
                aria-label={COPY.clearSearch}
                onClick={() => {
                  setQuery("")
                  firstPage()
                }}
              />
            </InputGroup.Addon>
          )}
        </InputGroup>

        <Select
          aria-label={COPY.status}
          className={cn(FILTER_BAR_SELECT, "@xl:w-40")}
          value={status}
          onValueChange={(value) => {
            setStatus(value ? String(value) : ALL_STATUSES)
            firstPage()
          }}
          renderValue={(value) =>
            value === ALL_STATUSES
              ? COPY.allStatuses
              : statusLabel(String(value))
          }
        >
          <Select.Option value={ALL_STATUSES}>{COPY.allStatuses}</Select.Option>
          {INSTANCE_STATUSES.map((option) => (
            <Select.Option key={option} value={option}>
              {statusLabel(option)}
            </Select.Option>
          ))}
        </Select>

        {appboxes && appboxes.length > 1 && (
          <Select
            aria-label={COPY.appbox}
            className={cn(FILTER_BAR_SELECT, "@xl:w-44")}
            value={cylo}
            onValueChange={(value) => {
              setCylo(value ? String(value) : ALL_STATUSES)
              firstPage()
            }}
            renderValue={(value) =>
              appboxes.find((entry) => String(entry.id) === value)?.name ??
              COPY.allAppboxes
            }
          >
            <Select.Option value={ALL_STATUSES}>
              {COPY.allAppboxes}
            </Select.Option>
            {appboxes.map((entry) => (
              <Select.Option key={entry.id} value={String(entry.id)}>
                {entry.name}
              </Select.Option>
            ))}
          </Select>
        )}

        <Select
          aria-label={COPY.sort}
          className={FILTER_BAR_SELECT}
          value={sortValue}
          onValueChange={(value) => {
            setSort(
              presets.find((preset) => preset.value === value)?.sort ?? null
            )
          }}
          renderValue={(value) =>
            presets.find((preset) => preset.value === value)?.label ??
            COPY.customSort
          }
        >
          {presets.map((preset) => (
            <Select.Option key={preset.value} value={preset.value}>
              {preset.label}
            </Select.Option>
          ))}
        </Select>
      </FilterBar>

      {apps.status === "loading" && <ListSkeleton rows={6} icons />}

      {apps.status === "error" && (
        <Banner
          variant="error"
          icon={<WarningCircleIcon weight="fill" />}
          title={COPY.loadFailed}
        />
      )}

      {apps.status === "ready" && all.length === 0 && (
        <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
          <Empty
            className={EMPTY_IN_CARD}
            icon={<PackageIcon size={40} />}
            title={COPY.emptyTitle}
            description={COPY.emptyHint}
            contents={
              <LinkButton href={kumoRoutes.appStore} variant="primary">
                {COPY.browse}
              </LinkButton>
            }
          />
        </div>
      )}

      {all.length > 0 && (
        // One surface around bar, table and pagination once there is room
        // for the table; separate cards below that. `overflow-clip` rounds
        // the corners without stopping the bar from sticking to the page.
        <div className="grid grid-cols-1 gap-3 @xl:gap-0 @xl:overflow-clip @xl:rounded-lg @xl:bg-kumo-base @xl:shadow-xs @xl:ring @xl:ring-kumo-line">
          {/* Doubles as the bulk bar once anything is selected, so it stays
              in reach while the table scrolls. The negative offset cancels
              the page padding above it. */}
          <div className="z-10 flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 ps-4 pe-3 @xl:sticky @xl:-top-8 @xl:border-b @xl:border-kumo-hairline @xl:bg-kumo-base @xl:py-2">
            <span className="flex @xl:hidden">
              <Checkbox
                checked={allOnPage}
                indeterminate={someOnPage && !allOnPage}
                disabled={rows.length === 0}
                onCheckedChange={(checked) => togglePage(Boolean(checked))}
                aria-label={COPY.selectPage}
              />
            </span>
            {selectedRows.length > 0 ? (
              <>
                <span className="text-kumo-subtle">
                  {t("bulkSelected", { count: selectedRows.length })}
                  {unavailable > 0 &&
                    ` · ${t("bulkUnavailable", { count: unavailable })}`}
                </span>
                <InstanceBulkActions
                  apps={selectedRows}
                  bulk={bulk}
                  onRun={(action) =>
                    void runBulk(action, selectedRows).then(
                      (done) => done && setSelected(new Set())
                    )
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(new Set())}
                >
                  {COPY.clearSelection}
                </Button>
              </>
            ) : (
              <span className="text-kumo-subtle" aria-live="polite">
                {filtered
                  ? COPY.countOf(total, all.length)
                  : COPY.count(all.length)}
              </span>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline @xl:rounded-none @xl:ring-0">
              <Empty
                className={EMPTY_IN_CARD}
                icon={<PackageIcon size={40} />}
                title={COPY.noMatchTitle}
                description={COPY.noMatchHint}
                contents={
                  <Button variant="secondary" onClick={clearFilters}>
                    {COPY.clearFilters}
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto @xl:block">
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.CheckHead
                        checked={allOnPage}
                        indeterminate={someOnPage && !allOnPage}
                        onCheckedChange={(checked) =>
                          togglePage(Boolean(checked))
                        }
                        aria-label={COPY.selectPage}
                      />
                      <Table.Head className="px-0!">
                        <span className="sr-only">{COPY.pinnedColumn}</span>
                      </Table.Head>
                      <SortHead
                        label={t("name")}
                        sortKey="name"
                        sort={sort}
                        onSort={sortBy}
                      />
                      <SortHead
                        label={t("domain")}
                        sortKey="domain"
                        sort={sort}
                        onSort={sortBy}
                        className="hidden @4xl:table-cell"
                      />
                      <SortHead
                        label={t("status")}
                        sortKey="status"
                        sort={sort}
                        onSort={sortBy}
                      />
                      {showAppbox && (
                        <SortHead
                          label={t("cylo")}
                          sortKey="appbox"
                          sort={sort}
                          onSort={sortBy}
                          className="hidden @2xl:table-cell"
                        />
                      )}
                      <SortHead
                        label={t("version")}
                        sortKey="version"
                        sort={sort}
                        onSort={sortBy}
                        className="hidden @min-[67rem]:table-cell"
                      />
                      <SortHead
                        label={t("slots")}
                        sortKey="slots"
                        sort={sort}
                        onSort={sortBy}
                        className="hidden @min-[74rem]:table-cell"
                      />
                      <SortHead
                        label={t("installedDate")}
                        sortKey="installed"
                        sort={sort}
                        onSort={sortBy}
                        className="hidden @min-[62rem]:table-cell"
                      />
                      <Table.Head>
                        <span className="sr-only">{COPY.actionsColumn}</span>
                      </Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {rows.map((app) => (
                      <InstalledAppRow key={app.id} {...rowProps(app)} />
                    ))}
                  </Table.Body>
                </Table>
              </div>

              <ul className="grid list-none grid-cols-1 gap-3 @xl:hidden">
                {rows.map((app) => (
                  <li key={app.id} className="min-w-0">
                    <InstalledAppCard {...rowProps(app)} />
                  </li>
                ))}
              </ul>
            </>
          )}

          <PageFooter
            pager={pager}
            className="@xl:border-t @xl:border-kumo-hairline @xl:p-3"
          />
        </div>
      )}
    </div>
  )
}
