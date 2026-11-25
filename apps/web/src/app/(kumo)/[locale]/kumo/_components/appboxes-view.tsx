"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Banner,
  Button,
  cn,
  Empty,
  InputGroup,
  LinkButton,
  Select,
  Table
} from "@cloudflare/kumo"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  HardDrivesIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  WarningCircleIcon,
  XIcon
} from "@phosphor-icons/react"
import type { CyloSummary } from "@/api/cylos/cylos"
import { useCyloStats } from "@/api/cylos/hooks/use-cylos"
import { Link } from "@/i18n/routing"
import { formatBytes, formatStorageGB } from "@/lib/utils"
import { RAIL_FALLBACK, ShellRail } from "./app-shell"
import { AppStrip, type StripApp } from "./app-strip"
import {
  APPBOX_STATUS_FILTERS,
  AppboxStatusBadge,
  AppboxStatusBadges
} from "./appbox-status"
import { useAppboxesUsage } from "./appbox/use-appboxes-usage"
import { FILTER_BAR_INPUT, FILTER_BAR_SELECT, FilterBar } from "./filter-bar"
import { AppboxCard } from "./home-view"
import { kumoRoutes } from "./kumo-routes"
import { RailStatusCard } from "./rail-status"
import {
  BILLING_BASE_URL,
  EMPTY_IN_CARD,
  percentOf,
  type Loadable,
  type ServiceUsage
} from "./shared"
import { ListSkeleton } from "./skeletons"
import { nextSort, SortHead, sortRows, type SortState } from "./sort-head"
import { Sparkline } from "./sparkline"
import { UsageRing } from "./usage-ring"
import {
  Meter,
  UsageRailSection,
  UsageStrip,
  type UsageFigures
} from "./usage-summary"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  title: "Appboxes",
  add: "Add Appbox",
  totals: "Total usage",
  status: "Status",
  allStatuses: "All statuses",
  searchPlaceholder: "Search by name, server or plan",
  clearSearch: "Clear search",
  sort: "Sort by",
  customSort: "Custom order",
  server: "Server",
  storage: "Storage",
  appSlots: "App slots",
  bandwidth: "Bandwidth (30 days)",
  diskIo: "Disk I/O",
  apps: "Apps",
  noApps: "None yet",
  appsOn: (name: string) => `Apps on ${name}`,
  boost: (count: number) => `${count} boost slot${count === 1 ? "" : "s"}`,
  now: (percent: number) => `${percent}% now`,
  peak: (percent: number) => `${percent}% peak`,
  filterTo: (status: string) => `Show only ${status.toLowerCase()} Appboxes`,
  emptyTitle: "No Appboxes yet",
  emptyHint: "Order one from the billing portal and it appears here.",
  noMatchTitle: "No Appboxes match those filters",
  noMatchHint: "Try a different search or status.",
  clearFilters: "Clear filters"
} as const

export interface AppboxesViewProps {
  /** Every Appbox on the account. */
  cylos: Loadable<CyloSummary[]>
  /** Installed apps keyed by Appbox id, pinned first. */
  apps: ReadonlyMap<number, StripApp[]>
  /** Boost slots in use, keyed by Appbox id. */
  boost: ReadonlyMap<number, number>
}

const ALL_STATUSES = "all"

/* -------------------------------------------------------------------------- */
/*  Rows                                                                       */
/* -------------------------------------------------------------------------- */

/** One Appbox with its figures worked out, so rows, sorting and totals agree. */
interface Row {
  cylo: CyloSummary
  usage: ServiceUsage
  storageUsed: number
  storagePercent: number
  upload: number
  download: number
  slotsPercent: number
  boost: number
  apps: StripApp[]
}

type SortKey = "name" | "status" | "server" | "storage" | "slots" | "bandwidth"
type Sort = SortState<SortKey>

const DEFAULT_SORT: Sort = { key: "name", dir: "asc" }

const statusRank = (row: Row) => {
  const rank = APPBOX_STATUS_FILTERS.findIndex(
    (filter) => filter.state && filter.value === row.cylo.status
  )
  return rank === -1 ? APPBOX_STATUS_FILTERS.length : rank
}

const SORTERS: Record<SortKey, (a: Row, b: Row) => number> = {
  name: (a, b) => a.cylo.name.localeCompare(b.cylo.name),
  status: (a, b) => statusRank(a) - statusRank(b),
  server: (a, b) =>
    a.cylo.server_name.localeCompare(b.cylo.server_name, undefined, {
      numeric: true
    }),
  storage: (a, b) => a.storagePercent - b.storagePercent,
  slots: (a, b) => a.slotsPercent - b.slotsPercent,
  bandwidth: (a, b) => a.upload + a.download - (b.upload + b.download)
}

/** The sort menu shown on small screens, where there are no column headers. */
const SORT_PRESETS: { value: string; label: string; sort: Sort }[] = [
  { value: "name:asc", label: "Name, A to Z", sort: DEFAULT_SORT },
  {
    value: "storage:desc",
    label: "Fullest first",
    sort: { key: "storage", dir: "desc" }
  },
  {
    value: "bandwidth:desc",
    label: "Most bandwidth",
    sort: { key: "bandwidth", dir: "desc" }
  },
  { value: "server:asc", label: "Server", sort: { key: "server", dir: "asc" } }
]

/**
 * Every app on the Appbox as one-click shortcuts, in the slider the home page
 * uses. The width is fixed so a long list cannot widen the table, and grows
 * once the table has room to spare.
 */
function AppShortcuts({ row }: { row: Row }) {
  if (row.apps.length === 0) {
    return <span className="text-kumo-subtle">{COPY.noApps}</span>
  }

  return (
    <div className="flex w-44 @min-[75rem]:w-52">
      <AppStrip apps={row.apps} label={COPY.appsOn(row.cylo.name)} />
    </div>
  )
}

/** A short stroke in a series' colour, tying a figure to its line. */
function SeriesKey({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("h-0.5 w-2.5 shrink-0 rounded-full", className)}
    />
  )
}

/** 30 days of traffic: its shape, and the totals sent and received. */
function Bandwidth({ row }: { row: Row }) {
  // No range: the latest history pushed, which the page asks to be 30 days.
  const { data: stats } = useCyloStats(row.cylo.id)
  const history = stats?.network_history ?? []

  return (
    <span className="flex items-center gap-3">
      <Sparkline
        series={[
          {
            data: history.map((point) => point.download),
            className: "stroke-current text-kumo-subtle"
          },
          {
            data: history.map((point) => point.upload),
            className: "stroke-kumo-brand"
          }
        ]}
      />
      <span className="grid gap-0.5 whitespace-nowrap text-kumo-subtle tabular-nums">
        <span className="flex items-center gap-1.5">
          <SeriesKey className="bg-kumo-brand" />
          <ArrowUpIcon aria-hidden="true" size={12} />
          <span className="sr-only">Upload</span>
          {formatBytes(row.upload, 1)}
        </span>
        <span className="flex items-center gap-1.5">
          <SeriesKey className="bg-current" />
          <ArrowDownIcon aria-hidden="true" size={12} />
          <span className="sr-only">Download</span>
          {formatBytes(row.download, 1)}
        </span>
      </span>
    </span>
  )
}

/** How busy the Appbox's disks have been, as a share of their capacity. */
function DiskIo({ row }: { row: Row }) {
  const { data: stats } = useCyloStats(row.cylo.id)
  const util = (stats?.diskio_history ?? []).map((point) => point.io_util)
  const last = util[util.length - 1]

  return (
    <span className="flex items-center gap-3">
      <Sparkline series={[{ data: util, className: "stroke-kumo-brand" }]} />
      {last === undefined ? (
        <span className="text-kumo-subtle">—</span>
      ) : (
        <span className="grid gap-0.5 whitespace-nowrap tabular-nums">
          <span>{COPY.now(Math.round(last))}</span>
          <span className="text-kumo-subtle">
            {COPY.peak(Math.round(Math.max(...util)))}
          </span>
        </span>
      )}
    </span>
  )
}

/**
 * One Appbox as a table row. Columns appear as the table gets room for them;
 * until the server has its own column it sits under the name.
 */
function AppboxRow({ row }: { row: Row }) {
  const { cylo } = row

  return (
    <Table.Row>
      {/* Takes the slack and truncates; the column breakpoints keep it roomy. */}
      <Table.Cell className="w-full max-w-0 overflow-hidden">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-kumo-tint text-kumo-subtle ring ring-kumo-hairline">
            <HardDrivesIcon aria-hidden="true" size={16} />
          </span>
          <span className="grid min-w-0 gap-0.5">
            <Link
              href={kumoRoutes.appbox(cylo.id)}
              className="truncate font-medium text-kumo-default no-underline hover:underline"
            >
              {cylo.name}
            </Link>
            <span className="truncate text-kumo-subtle">
              <span className="@min-[72rem]:hidden">
                <span className="font-mono text-[0.9em]">
                  {cylo.server_name}
                </span>
                {cylo.package_name && " · "}
              </span>
              {cylo.package_name}
            </span>
          </span>
        </span>
      </Table.Cell>
      <Table.Cell className="hidden font-mono text-[0.9em] whitespace-nowrap @min-[72rem]:table-cell">
        {cylo.server_name}
      </Table.Cell>
      <Table.Cell>
        <AppboxStatusBadges
          cylo={cylo}
          className="grid justify-items-start gap-1"
        />
      </Table.Cell>
      <Table.Cell>
        <div className="grid w-44 gap-1.5">
          <div className="flex items-baseline justify-between gap-2 whitespace-nowrap tabular-nums">
            <span className="font-medium">{row.storagePercent}%</span>
            <span className="text-kumo-subtle">
              {formatStorageGB(row.storageUsed)} /{" "}
              {formatStorageGB(cylo.storage_total)}
            </span>
          </div>
          <Meter
            label={`${cylo.name}: ${COPY.storage.toLowerCase()}`}
            percent={row.storagePercent}
            valueText={`${row.storagePercent}%`}
          />
        </div>
      </Table.Cell>
      <Table.Cell className="hidden @2xl:table-cell">
        <span className="grid gap-0.5 whitespace-nowrap">
          <span className="flex items-center gap-2 tabular-nums">
            <UsageRing percent={row.slotsPercent} />
            {cylo.app_slots_used} / {cylo.app_slots_total}
          </span>
          {row.boost > 0 && (
            <span className="ps-6 text-kumo-subtle">
              {COPY.boost(row.boost)}
            </span>
          )}
        </span>
      </Table.Cell>
      <Table.Cell className="hidden @min-[66rem]:table-cell">
        <Bandwidth row={row} />
      </Table.Cell>
      <Table.Cell className="hidden @min-[86rem]:table-cell">
        <DiskIo row={row} />
      </Table.Cell>
      <Table.Cell className="hidden @min-[54rem]:table-cell">
        <AppShortcuts row={row} />
      </Table.Cell>
    </Table.Row>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Every Appbox on the account as a table, so they can be compared at a glance
 * and sorted: state, how full each one is, its traffic and its apps. With more
 * than one Appbox the totals sit beside the table (or above it, where there is
 * no room beside). Where there is no room for a table each Appbox is the card
 * the home page shows.
 */
export function AppboxesView({ cylos, apps, boost }: AppboxesViewProps) {
  const t = useTranslations("appboxmanager")
  const tc = useTranslations("common")

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<string>(ALL_STATUSES)
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT)

  const all = cylos.status === "ready" ? cylos.data : []
  const usage = useAppboxesUsage(all)

  const rows: Row[] = all.map((cylo) => {
    const live = usage.get(cylo.id) ?? {}
    const storageUsed = live.storageUsedGb ?? cylo.storage_used
    return {
      cylo,
      usage: live,
      storageUsed,
      storagePercent: percentOf(storageUsed, cylo.storage_total),
      upload: live.uploadBytes ?? cylo.upload_used,
      download: live.downloadBytes ?? cylo.download_used,
      slotsPercent: percentOf(cylo.app_slots_used, cylo.app_slots_total),
      boost: boost.get(cylo.id) ?? 0,
      apps: apps.get(cylo.id) ?? []
    }
  })

  // One Appbox needs neither totals nor filters: its own row says it all.
  const several = rows.length > 1
  const totals = rows.reduce<UsageFigures>(
    (sum, row) => ({
      storageUsed: sum.storageUsed + row.storageUsed,
      storageTotal: sum.storageTotal + row.cylo.storage_total,
      uploadUsed: sum.uploadUsed + row.upload,
      downloadUsed: sum.downloadUsed + row.download,
      slotsUsed: sum.slotsUsed + row.cylo.app_slots_used,
      slotsTotal: sum.slotsTotal + row.cylo.app_slots_total,
      boostSlots: sum.boostSlots + row.boost
    }),
    {
      storageUsed: 0,
      storageTotal: 0,
      uploadUsed: 0,
      downloadUsed: 0,
      slotsUsed: 0,
      slotsTotal: 0,
      boostSlots: 0
    }
  )
  // Whole gigabytes, as each Appbox's own figure is given.
  totals.storageUsed = Math.round(totals.storageUsed)

  const activeFilter = APPBOX_STATUS_FILTERS.find(
    (filter) => filter.value === status
  )
  const needle = query.trim().toLowerCase()
  const matches = rows.filter(
    ({ cylo }) =>
      (!activeFilter || activeFilter.test(cylo)) &&
      (!needle ||
        `${cylo.name} ${cylo.server_name} ${cylo.package_name}`
          .toLowerCase()
          .includes(needle))
  )
  // With no sort chosen the server's order stands.
  const ordered = sortRows(matches, sort, SORTERS, SORTERS.name)

  const sortBy = (key: SortKey) => setSort((current) => nextSort(current, key))
  const sortValue = sort ? `${sort.key}:${sort.dir}` : ""
  const clearFilters = () => {
    setQuery("")
    setStatus(ALL_STATUSES)
  }

  const statusCounts = APPBOX_STATUS_FILTERS.map((filter) => ({
    value: filter.value,
    count: all.filter(filter.test).length,
    badge: <AppboxStatusBadge filter={filter} />,
    hint: COPY.filterTo(filter.label)
  })).filter((entry) => entry.count > 0)

  const addButton = (size?: "sm") => (
    <LinkButton
      href={BILLING_BASE_URL}
      target="_blank"
      rel="noopener noreferrer"
      variant={size ? "secondary" : "primary"}
      size={size}
      icon={size ? undefined : PlusIcon}
    >
      {COPY.add}
    </LinkButton>
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold">
            <HardDrivesIcon aria-hidden="true" size={24} />
            {COPY.title}
          </h1>
          <p className="text-kumo-subtle">{t("cylos.description")}</p>
        </div>
        {addButton()}
      </header>

      {several && (
        <>
          {/* With room to spare, the totals live in the shell's right-hand column. */}
          <ShellRail>
            <UsageRailSection title={COPY.totals} figures={totals} />
            <RailStatusCard
              title={COPY.status}
              entries={statusCounts}
              active={status}
              onSelect={(value) =>
                setStatus(status === value ? ALL_STATUSES : value)
              }
            />
          </ShellRail>

          {/* Until that column docks, they are a strip: above the list, or
              after it on small screens, where it would push the list down. */}
          <section
            className={cn(
              "order-last grid grid-cols-1 gap-2 sm:order-none",
              RAIL_FALLBACK
            )}
          >
            <h2 className="font-medium text-kumo-subtle">{COPY.totals}</h2>
            <UsageStrip figures={totals} />
          </section>
        </>
      )}

      {/* The container the table's columns and the card fallback respond to. */}
      <div className="@container grid min-w-0 grid-cols-1 gap-3">
        {several && (
          // The sort menu comes last and gives way to the table's sortable
          // headers once the table shows.
          <FilterBar dropLastWhenWide>
            <InputGroup className={FILTER_BAR_INPUT}>
              <InputGroup.Addon>
                <MagnifyingGlassIcon />
              </InputGroup.Addon>
              <InputGroup.Input
                value={query}
                placeholder={COPY.searchPlaceholder}
                aria-label={COPY.searchPlaceholder}
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <InputGroup.Addon align="end" className="pr-1">
                  <InputGroup.Button
                    shape="square"
                    icon={XIcon}
                    aria-label={COPY.clearSearch}
                    onClick={() => setQuery("")}
                  />
                </InputGroup.Addon>
              )}
            </InputGroup>

            <Select
              aria-label={COPY.status}
              className={cn(FILTER_BAR_SELECT, "@xl:w-44")}
              value={status}
              onValueChange={(value) =>
                setStatus(value ? String(value) : ALL_STATUSES)
              }
              renderValue={(value) =>
                APPBOX_STATUS_FILTERS.find((filter) => filter.value === value)
                  ?.label ?? COPY.allStatuses
              }
            >
              <Select.Option value={ALL_STATUSES}>
                {COPY.allStatuses}
              </Select.Option>
              {APPBOX_STATUS_FILTERS.map((filter) => (
                <Select.Option key={filter.value} value={filter.value}>
                  {filter.label}
                </Select.Option>
              ))}
            </Select>

            <Select
              aria-label={COPY.sort}
              className={FILTER_BAR_SELECT}
              value={sortValue}
              onValueChange={(value) =>
                setSort(
                  SORT_PRESETS.find((preset) => preset.value === value)?.sort ??
                    null
                )
              }
              renderValue={(value) =>
                SORT_PRESETS.find((preset) => preset.value === value)?.label ??
                COPY.customSort
              }
            >
              {SORT_PRESETS.map((preset) => (
                <Select.Option key={preset.value} value={preset.value}>
                  {preset.label}
                </Select.Option>
              ))}
            </Select>
          </FilterBar>
        )}

        {cylos.status === "loading" && <ListSkeleton rows={3} icons />}

        {cylos.status === "error" && (
          <Banner
            variant="error"
            icon={<WarningCircleIcon weight="fill" />}
            title={tc("errors.loadAppboxesFailed")}
          />
        )}

        {cylos.status === "ready" && rows.length === 0 && (
          <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
            <Empty
              className={EMPTY_IN_CARD}
              icon={<HardDrivesIcon size={40} />}
              title={COPY.emptyTitle}
              description={COPY.emptyHint}
              contents={addButton()}
            />
          </div>
        )}

        {rows.length > 0 && ordered.length === 0 && (
          <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
            <Empty
              className={EMPTY_IN_CARD}
              icon={<HardDrivesIcon size={40} />}
              title={COPY.noMatchTitle}
              description={COPY.noMatchHint}
              contents={
                <Button variant="secondary" onClick={clearFilters}>
                  {COPY.clearFilters}
                </Button>
              }
            />
          </div>
        )}

        {ordered.length > 0 && (
          <>
            <div className="hidden overflow-x-auto rounded-lg bg-kumo-base shadow-xs ring ring-kumo-line @xl:block">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <SortHead
                      label={t("cylos.name")}
                      sortKey="name"
                      sort={sort}
                      onSort={sortBy}
                    />
                    <SortHead
                      label={COPY.server}
                      sortKey="server"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @min-[72rem]:table-cell"
                    />
                    <SortHead
                      label={COPY.status}
                      sortKey="status"
                      sort={sort}
                      onSort={sortBy}
                    />
                    <SortHead
                      label={COPY.storage}
                      sortKey="storage"
                      sort={sort}
                      onSort={sortBy}
                    />
                    <SortHead
                      label={COPY.appSlots}
                      sortKey="slots"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @2xl:table-cell"
                    />
                    <SortHead
                      label={COPY.bandwidth}
                      sortKey="bandwidth"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @min-[66rem]:table-cell"
                    />
                    <Table.Head className="hidden whitespace-nowrap @min-[86rem]:table-cell">
                      {COPY.diskIo}
                    </Table.Head>
                    <Table.Head className="hidden @min-[54rem]:table-cell">
                      {COPY.apps}
                    </Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {ordered.map((row) => (
                    <AppboxRow key={row.cylo.id} row={row} />
                  ))}
                </Table.Body>
              </Table>
            </div>

            <ul className="grid list-none grid-cols-1 gap-3 @xl:hidden">
              {ordered.map((row) => (
                <li key={row.cylo.id} className="min-w-0">
                  <AppboxCard
                    cylo={row.cylo}
                    usage={row.usage}
                    apps={row.apps}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
