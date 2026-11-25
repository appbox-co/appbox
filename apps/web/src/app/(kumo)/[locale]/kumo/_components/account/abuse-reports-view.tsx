"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Banner,
  Button,
  cn,
  Empty,
  InputGroup,
  Select,
  Table
} from "@cloudflare/kumo"
import {
  FlagIcon,
  MagnifyingGlassIcon,
  WarningCircleIcon,
  XIcon
} from "@phosphor-icons/react"
import type { AbuseReport } from "@/api/account/account"
import { Link } from "@/i18n/routing"
import { ShellRail } from "../app-shell"
import { FILTER_BAR_INPUT, FILTER_BAR_SELECT, FilterBar } from "../filter-bar"
import { kumoRoutes } from "../kumo-routes"
import { PageFooter, usePagedRows } from "../paged-rows"
import { RailStatusCard } from "../rail-status"
import { EMPTY_IN_CARD, type Loadable } from "../shared"
import { ShortDate } from "../short-date"
import { ListSkeleton } from "../skeletons"
import { compareText, SortHead, timeOf, type SortState } from "../sort-head"
import {
  ABUSE_GROUPS,
  abuseGroup,
  AbuseGroupBadge,
  AbuseStatusBadge,
  splitAbuseStatus,
  type AbuseGroup
} from "./abuse-status"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  title: "Abuse reports",
  appbox: "Appbox",
  allStatuses: "All statuses",
  searchPlaceholder: "Search by subject, ID, Appbox or complainant",
  clearSearch: "Clear search",
  sort: "Sort by",
  customSort: "Custom order",
  filterTo: (status: string) => `Show only reports ${status.toLowerCase()}`,
  loadFailed: "Failed to load abuse reports. Please try again.",
  emptyTitle: "No abuse reports",
  emptyHint: "Nothing has been reported against your account.",
  noMatchTitle: "No reports match those filters",
  noMatchHint: "Try a different search or status.",
  clearFilters: "Clear filters"
} as const

export interface AbuseReportsViewProps {
  /** Every abuse report on the account. */
  reports: Loadable<AbuseReport[]>
}

const ALL_GROUPS = "all"

/* -------------------------------------------------------------------------- */
/*  Rows                                                                       */
/* -------------------------------------------------------------------------- */

/** One report with what the page shows about it worked out once. */
interface Row {
  report: AbuseReport
  /** The reference people quote: the provider's id when there is one. */
  reference: string
  group: AbuseGroup
  /** What happened, from the bracketed part of the status, if any. */
  statusDetail: string | null
}

type SortKey = "id" | "appbox" | "subject" | "complainant" | "status" | "date"
type Sort = SortState<SortKey>

/** Newest first: the reports that still need something are usually recent. */
const DEFAULT_SORT: Sort = { key: "date", dir: "desc" }

const groupRank = (group: AbuseGroup) =>
  ABUSE_GROUPS.findIndex((entry) => entry.value === group)

const SORTERS: Record<SortKey, (a: Row, b: Row) => number> = {
  id: (a, b) => compareText(a.reference, b.reference),
  appbox: (a, b) =>
    compareText(a.report.cyloname ?? "", b.report.cyloname ?? ""),
  subject: (a, b) => compareText(a.report.subject, b.report.subject),
  complainant: (a, b) =>
    compareText(a.report.complainant, b.report.complainant),
  status: (a, b) =>
    groupRank(a.group) - groupRank(b.group) ||
    compareText(a.report.status, b.report.status),
  date: (a, b) => timeOf(a.report.created_at) - timeOf(b.report.created_at)
}

/** The sort menu shown on small screens, where there are no column headers. */
const SORT_PRESETS: { value: string; label: string; sort: Sort }[] = [
  { value: "date:desc", label: "Newest first", sort: DEFAULT_SORT },
  {
    value: "date:asc",
    label: "Oldest first",
    sort: { key: "date", dir: "asc" }
  },
  { value: "status:asc", label: "Status", sort: { key: "status", dir: "asc" } }
]

/* -------------------------------------------------------------------------- */
/*  Cells                                                                      */
/* -------------------------------------------------------------------------- */

/** The subject, which is the way into the report. */
function SubjectLink({ row, className }: { row: Row; className?: string }) {
  return (
    <Link
      href={kumoRoutes.abuseReport(row.report.id)}
      className={cn(
        "font-medium text-kumo-default no-underline hover:underline",
        className
      )}
    >
      {row.report.subject || row.reference}
    </Link>
  )
}

/** The status badge, with what happened to the files under it. */
function Status({ row, className }: { row: Row; className?: string }) {
  return (
    <span className={cn("grid justify-items-start gap-1", className)}>
      <AbuseStatusBadge
        status={row.report.status}
        statusCode={row.report.statusCode}
      />
      {row.statusDetail && (
        <span
          title={row.statusDetail}
          className="max-w-full truncate text-kumo-subtle"
        >
          {row.statusDetail}
        </span>
      )}
    </span>
  )
}

/**
 * One report as a table row. Columns appear as the table gets room for them;
 * until then the Appbox and complainant sit under the subject.
 */
function ReportRow({ row }: { row: Row }) {
  const { report } = row

  return (
    <Table.Row>
      <Table.Cell className="font-mono text-[0.9em] whitespace-nowrap">
        {row.reference}
      </Table.Cell>
      <Table.Cell className="hidden font-mono text-[0.9em] whitespace-nowrap text-kumo-subtle @min-[54rem]:table-cell">
        {report.cyloname ?? "—"}
      </Table.Cell>
      {/* Takes the slack and truncates. */}
      <Table.Cell className="w-full max-w-0 overflow-hidden">
        <span className="grid min-w-0 gap-0.5">
          <SubjectLink row={row} className="truncate" />
          {/* Each leaves this line as its own column appears. */}
          {(report.cyloname || report.complainant) && (
            <span className="flex min-w-0 gap-x-1.5 text-kumo-subtle @min-[62rem]:hidden">
              {report.cyloname && (
                <span className="shrink-0 font-mono text-[0.9em] @min-[54rem]:hidden">
                  {report.cyloname}
                </span>
              )}
              {report.cyloname && report.complainant && (
                <span aria-hidden="true" className="@min-[54rem]:hidden">
                  ·
                </span>
              )}
              {report.complainant && (
                <span className="truncate">{report.complainant}</span>
              )}
            </span>
          )}
        </span>
      </Table.Cell>
      <Table.Cell className="hidden @min-[62rem]:table-cell">
        <span className="block max-w-48 truncate text-kumo-subtle">
          {report.complainant || "—"}
        </span>
      </Table.Cell>
      <Table.Cell>
        {/* Wide enough for the longest status, so the badge never spills. */}
        <Status row={row} className="w-56" />
      </Table.Cell>
      <Table.Cell className="hidden @min-[46rem]:table-cell">
        <ShortDate value={report.created_at} />
      </Table.Cell>
    </Table.Row>
  )
}

/** One report as a card, where there is no room for a table. */
function ReportCard({ row }: { row: Row }) {
  const t = useTranslations("account")
  const { report } = row
  const facts = [
    {
      label: t("abuse.id"),
      value: <span className="font-mono text-[0.9em]">{row.reference}</span>
    },
    {
      label: COPY.appbox,
      value: report.cyloname ? (
        <span className="font-mono text-[0.9em]">{report.cyloname}</span>
      ) : null
    },
    {
      label: t("abuse.complainant"),
      value: report.complainant ? (
        <span className="truncate">{report.complainant}</span>
      ) : null
    },
    {
      label: t("abuse.date"),
      value: <ShortDate value={report.created_at} />
    }
  ].filter((fact) => fact.value !== null)

  return (
    <article className="grid grid-cols-1 gap-3 rounded-lg bg-kumo-base px-4 py-3.5 shadow-xs ring ring-kumo-line">
      <header className="grid grid-cols-1 gap-2">
        <SubjectLink row={row} className="break-words" />
        <Status row={row} />
      </header>
      <dl className="grid grid-cols-1 gap-1.5">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex min-w-0 items-center justify-between gap-4"
          >
            <dt className="shrink-0 text-kumo-subtle">{fact.label}</dt>
            <dd className="flex min-w-0 justify-end">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Every abuse report on the account as a table, newest first: its reference,
 * the Appbox it concerns, who complained and where it stands. The subject
 * opens the report. Where there is no room for a table each report is a card.
 */
export function AbuseReportsView({ reports }: AbuseReportsViewProps) {
  const t = useTranslations("account")

  const [query, setQuery] = useState("")
  const [group, setGroup] = useState<string>(ALL_GROUPS)

  const all = reports.status === "ready" ? reports.data : []
  const rows: Row[] = all.map((report) => ({
    report,
    reference: `#${report.isp_id ?? report.id}`,
    group: abuseGroup(report.status, report.statusCode),
    statusDetail: splitAbuseStatus(report.status).detail
  }))

  const needle = query.trim().toLowerCase()
  const matches = rows.filter(
    (row) =>
      (group === ALL_GROUPS || row.group === group) &&
      (!needle ||
        `${row.reference} ${row.report.subject} ${row.report.cyloname ?? ""} ${row.report.complainant} ${row.report.status}`
          .toLowerCase()
          .includes(needle))
  )
  // With no sort chosen the server's order stands.
  const {
    rows: shown,
    total,
    sort,
    setSort,
    sortBy,
    firstPage,
    pager
  } = usePagedRows(matches, {
    sorters: SORTERS,
    defaultSort: DEFAULT_SORT,
    tieBreak: (a, b) => b.report.id - a.report.id
  })

  const sortValue = sort ? `${sort.key}:${sort.dir}` : ""
  const filterTo = (value: string) => {
    setGroup(value)
    firstPage()
  }
  const clearFilters = () => {
    setQuery("")
    filterTo(ALL_GROUPS)
  }

  const groupCounts = ABUSE_GROUPS.map((entry) => ({
    value: entry.value,
    count: rows.filter((row) => row.group === entry.value).length,
    badge: <AbuseGroupBadge group={entry.value} />,
    hint: COPY.filterTo(entry.label)
  })).filter((entry) => entry.count > 0)

  return (
    <div className="flex flex-col gap-6">
      <header className="grid gap-1.5">
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold">
          <FlagIcon aria-hidden="true" size={24} />
          {COPY.title}
        </h1>
        <p className="text-kumo-subtle">{t("abuse.headerDescription")}</p>
      </header>

      {/* With room to spare: how many reports stand where. Each row filters. */}
      {rows.length > 0 && (
        <ShellRail>
          <RailStatusCard
            title={t("abuse.status")}
            entries={groupCounts}
            active={group}
            onSelect={(value) => filterTo(group === value ? ALL_GROUPS : value)}
          />
        </ShellRail>
      )}

      {/* The container the table's columns and the card fallback respond to. */}
      <div className="@container grid min-w-0 grid-cols-1 gap-3">
        {rows.length > 0 && (
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
              aria-label={t("abuse.status")}
              className={cn(FILTER_BAR_SELECT, "@xl:w-44")}
              value={group}
              onValueChange={(value) =>
                filterTo(value ? String(value) : ALL_GROUPS)
              }
              renderValue={(value) =>
                ABUSE_GROUPS.find((entry) => entry.value === value)?.label ??
                COPY.allStatuses
              }
            >
              <Select.Option value={ALL_GROUPS}>
                {COPY.allStatuses}
              </Select.Option>
              {ABUSE_GROUPS.map((entry) => (
                <Select.Option key={entry.value} value={entry.value}>
                  {entry.label}
                </Select.Option>
              ))}
            </Select>

            <Select
              aria-label={COPY.sort}
              className={FILTER_BAR_SELECT}
              value={sortValue}
              onValueChange={(value) => {
                setSort(
                  SORT_PRESETS.find((preset) => preset.value === value)?.sort ??
                    null
                )
              }}
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

        {reports.status === "loading" && <ListSkeleton />}

        {reports.status === "error" && (
          <Banner
            variant="error"
            icon={<WarningCircleIcon weight="fill" />}
            title={COPY.loadFailed}
          />
        )}

        {reports.status === "ready" && rows.length === 0 && (
          <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
            <Empty
              className={EMPTY_IN_CARD}
              icon={<FlagIcon size={40} />}
              title={COPY.emptyTitle}
              description={COPY.emptyHint}
            />
          </div>
        )}

        {rows.length > 0 && total === 0 && (
          <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
            <Empty
              className={EMPTY_IN_CARD}
              icon={<FlagIcon size={40} />}
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

        {total > 0 && (
          // One card around the table and its pager; plain cards below `@xl`.
          <div className="grid grid-cols-1 gap-3 @xl:gap-0 @xl:overflow-clip @xl:rounded-lg @xl:bg-kumo-base @xl:shadow-xs @xl:ring @xl:ring-kumo-line">
            <div className="hidden overflow-x-auto @xl:block">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <SortHead
                      label={t("abuse.id")}
                      sortKey="id"
                      sort={sort}
                      onSort={sortBy}
                    />
                    <SortHead
                      label={COPY.appbox}
                      sortKey="appbox"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @min-[54rem]:table-cell"
                    />
                    <SortHead
                      label={t("abuse.subject")}
                      sortKey="subject"
                      sort={sort}
                      onSort={sortBy}
                    />
                    <SortHead
                      label={t("abuse.complainant")}
                      sortKey="complainant"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @min-[62rem]:table-cell"
                    />
                    <SortHead
                      label={t("abuse.status")}
                      sortKey="status"
                      sort={sort}
                      onSort={sortBy}
                    />
                    <SortHead
                      label={t("abuse.date")}
                      sortKey="date"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @min-[46rem]:table-cell"
                    />
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {shown.map((row) => (
                    <ReportRow key={row.report.id} row={row} />
                  ))}
                </Table.Body>
              </Table>
            </div>

            <ul className="grid list-none grid-cols-1 gap-3 @xl:hidden">
              {shown.map((row) => (
                <li key={row.report.id} className="min-w-0">
                  <ReportCard row={row} />
                </li>
              ))}
            </ul>

            <PageFooter
              pager={pager}
              className="@xl:border-t @xl:border-kumo-hairline @xl:p-3"
            />
          </div>
        )}
      </div>
    </div>
  )
}
