"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Badge,
  Banner,
  Button,
  cn,
  Dialog,
  Empty,
  InputGroup,
  LinkButton,
  Pagination,
  Select,
  SkeletonLine,
  Table,
  Tooltip
} from "@cloudflare/kumo"
import {
  ArrowElbowDownRightIcon,
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  GlobeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon
} from "@phosphor-icons/react"
import type { Domain } from "@/api/domains/domains"
import { Link } from "@/i18n/routing"
import { AppIcon } from "./app-icon"
import { ShellRail } from "./app-shell"
import { FILTER_BAR_INPUT, FILTER_BAR_SELECT, FilterBar } from "./filter-bar"
import { kumoRoutes } from "./kumo-routes"
import { RailStatusCard } from "./rail-status"
import { EMPTY_IN_CARD, type Loadable } from "./shared"
import { ShortDate } from "./short-date"
import { nextSort, SortHead, type SortState } from "./sort-head"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  title: "Custom domains",
  type: "Type",
  allTypes: "All types",
  usedBy: "Used by",
  serverIp: "Server IP",
  actions: "Actions",
  searchPlaceholder: "Search by domain, app or Appbox",
  clearSearch: "Clear search",
  sort: "Sort by",
  customSort: "Custom order",
  subdomains: (count: number) => `${count} subdomain${count === 1 ? "" : "s"}`,
  unused: "Not in use",
  open: (domain: string) => `Open ${domain}`,
  filterTo: (type: string) => `Show only ${type.toLowerCase()} domains`,
  delete: "Delete domain",
  deleteFailed: "The domain could not be deleted. Try again.",
  dismiss: "Dismiss",
  noMatchTitle: "No domains match those filters",
  noMatchHint: "Try a different search or type.",
  clearFilters: "Clear filters",
  addTitle: "Adding a domain",
  addBody:
    "Domains are added from an app: choose a custom domain when installing it, or add one later from the app's own page.",
  addAction: "Installed apps"
} as const

/* -------------------------------------------------------------------------- */
/*  Rules, carried over from the current page                                  */
/* -------------------------------------------------------------------------- */

/**
 * Suffixes of the domains the platform gives every Appbox and app. They are
 * left out of the list: nothing about them can be changed here.
 */
const PLATFORM_SUFFIXES = [
  "appboxes.co",
  "abx.bz",
  "cylo.net",
  "cylo.io",
  "appbox.co"
]

function isPlatformDomain(domain: Domain) {
  const lower = domain.domain.toLowerCase()
  return PLATFORM_SUFFIXES.some(
    (suffix) => lower === suffix || lower.endsWith(`.${suffix}`)
  )
}

/** A domain the account owns, a subdomain of one, or a domain on its own. */
type DomainKind = "base" | "managed" | "custom"

function kindOf(domain: Domain): DomainKind {
  if (domain.type === "domain") return "base"
  if (domain.type === "subdomain" && domain.parent !== null) return "managed"
  return "custom"
}

/** Quiet badges: a type is a label, not a state that needs attention. */
const KINDS = [
  { value: "base", labelKey: "typeBase", variant: "info" },
  { value: "managed", labelKey: "typeManaged", variant: "secondary" },
  { value: "custom", labelKey: "typeCustom", variant: "outline" }
] as const satisfies readonly { value: DomainKind; [key: string]: string }[]

/** A domain whose DNS record can be checked: the check needs all three. */
export type CheckableDomain = Domain & {
  parent: number
  fqdn: string
  cylo_id: number
}

export interface DnsCheck {
  verified: boolean
  expected_ip?: string
  resolved_ip?: string
}

/** The installed app a domain is attached to. */
export interface DomainInstall {
  name: string
  icon: string
}

export interface DomainsViewProps {
  /** Every domain on the account; the platform's own are filtered out here. */
  domains: Loadable<Domain[]>
  /** Installed apps keyed by install id, for the app's icon and current name. */
  installs: ReadonlyMap<number, DomainInstall>
  /** Appbox names keyed by Appbox id. */
  appboxes: ReadonlyMap<number, string>
  /** Deletes the domain. Rejects if that fails. */
  onDelete: (domain: Domain) => Promise<unknown>
  /** Checks that the domain's DNS record points at its server. */
  onCheckDns: (domain: CheckableDomain) => Promise<DnsCheck>
}

const ALL_KINDS = "all"

/* -------------------------------------------------------------------------- */
/*  Rows                                                                       */
/* -------------------------------------------------------------------------- */

/** One domain with what the page decides about it worked out once. */
interface Row {
  domain: Domain
  kind: DomainKind
  /** The base domain it sorts under: its parent's name, or its own. */
  root: string
  /** How many other domains hang off this one. */
  children: number
  appName: string | null
  appIcon: string
  appbox: string | null
  /** Set when its DNS record can be checked. */
  checkable: CheckableDomain | null
  canDelete: boolean
  /** A base domain that cannot go while subdomains still use it. */
  deleteBlocked: boolean
}

function isCheckable(domain: Domain): domain is CheckableDomain {
  return Boolean(domain.parent && domain.fqdn && domain.cylo_id)
}

type SortKey = "domain" | "type" | "app" | "appbox" | "ip" | "created"
type Sort = SortState<SortKey>

const DEFAULT_SORT: Sort = { key: "domain", dir: "asc" }

const text = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })

const time = (value: string) => {
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

const SORTERS: Record<SortKey, (a: Row, b: Row) => number> = {
  // Each base domain, then the subdomains under it.
  domain: (a, b) =>
    text(a.root, b.root) ||
    Number(a.root !== a.domain.domain) - Number(b.root !== b.domain.domain) ||
    text(a.domain.domain, b.domain.domain),
  type: (a, b) =>
    KINDS.findIndex((kind) => kind.value === a.kind) -
    KINDS.findIndex((kind) => kind.value === b.kind),
  app: (a, b) => text(a.appName ?? "", b.appName ?? ""),
  appbox: (a, b) => text(a.appbox ?? "", b.appbox ?? ""),
  ip: (a, b) => text(a.domain.ip_address ?? "", b.domain.ip_address ?? ""),
  created: (a, b) => time(a.domain.created_at) - time(b.domain.created_at)
}

/** The sort menu shown on small screens, where there are no column headers. */
const SORT_PRESETS: { value: string; label: string; sort: Sort }[] = [
  { value: "domain:asc", label: "Domain, A to Z", sort: DEFAULT_SORT },
  {
    value: "created:desc",
    label: "Newest first",
    sort: { key: "created", dir: "desc" }
  },
  { value: "type:asc", label: "Type", sort: { key: "type", dir: "asc" } }
]

const PAGE_SIZES = [10, 25, 50, 100]
const DEFAULT_PAGE_SIZE = 25

/* -------------------------------------------------------------------------- */
/*  Cells                                                                      */
/* -------------------------------------------------------------------------- */

function KindBadge({ kind }: { kind: DomainKind }) {
  const t = useTranslations("appboxmanager.domains")
  const entry = KINDS.find((item) => item.value === kind) ?? KINDS[0]
  return <Badge variant={entry.variant}>{t(entry.labelKey)}</Badge>
}

/** The name itself. A domain an app answers on opens that app's address. */
function DomainName({ row, className }: { row: Row; className?: string }) {
  const { domain } = row.domain
  if (row.kind === "base") {
    return (
      <span
        title={domain}
        className={cn(
          "block truncate font-mono text-[0.9em] font-medium",
          className
        )}
      >
        {domain}
      </span>
    )
  }

  return (
    <a
      href={`https://${domain}`}
      target="_blank"
      rel="noopener noreferrer"
      title={COPY.open(domain)}
      className={cn(
        "block max-w-full truncate font-mono text-[0.9em] text-kumo-default no-underline hover:underline",
        className
      )}
    >
      {domain}
    </a>
  )
}

/** What the domain is for: the app it serves, or the subdomains under it. */
function UsedBy({ row }: { row: Row }) {
  if (row.kind === "base") {
    return (
      <span className="whitespace-nowrap text-kumo-subtle">
        {row.children > 0 ? COPY.subdomains(row.children) : COPY.unused}
      </span>
    )
  }
  if (!row.appName) return <span className="text-kumo-subtle">—</span>

  const label = (
    <>
      <AppIcon icon={row.appIcon} name={row.appName} />
      <span className="truncate">{row.appName}</span>
    </>
  )
  return row.domain.instance_id ? (
    <Link
      href={kumoRoutes.installedApp(row.domain.instance_id)}
      className="flex max-w-56 min-w-0 items-center gap-2 text-kumo-default no-underline hover:underline"
    >
      {label}
    </Link>
  ) : (
    <span className="flex max-w-56 min-w-0 items-center gap-2 text-kumo-subtle">
      {label}
    </span>
  )
}

function AppboxLink({ row }: { row: Row }) {
  if (!row.appbox || !row.domain.cylo_id) {
    return <span className="text-kumo-subtle">—</span>
  }
  return (
    <Link
      href={kumoRoutes.appbox(row.domain.cylo_id)}
      className="block max-w-40 truncate text-kumo-default no-underline hover:underline"
    >
      {row.appbox}
    </Link>
  )
}

interface RowActionsProps {
  row: Row
  /** Shown under its base domain, which is the row above or near it. */
  nested: boolean
  /** This row's DNS check is running. */
  checking: boolean
  onCheckDns: (domain: CheckableDomain) => void
  onDelete: (domain: Domain) => void
}

/**
 * Checking DNS again and deleting. The delete button keeps its place when it
 * is not offered, so the buttons line up down the column.
 */
function RowActions({ row, checking, onCheckDns, onDelete }: RowActionsProps) {
  const t = useTranslations("appboxmanager.domains")
  const { domain } = row
  const checkable = row.checkable

  return (
    <span className="flex items-center justify-end gap-1">
      {checkable && (
        <Tooltip
          content={t("reverifyDns")}
          render={
            <Button
              size="sm"
              shape="square"
              icon={ArrowsClockwiseIcon}
              aria-label={`${t("reverifyDns")}: ${domain.domain}`}
              loading={checking}
              disabled={checking}
              onClick={() => onCheckDns(checkable)}
            />
          }
        />
      )}

      {row.canDelete ? (
        <Tooltip
          content={COPY.delete}
          render={
            <Button
              size="sm"
              shape="square"
              variant="secondary-destructive"
              icon={TrashIcon}
              aria-label={`${COPY.delete}: ${domain.domain}`}
              onClick={() => onDelete(domain)}
            />
          }
        />
      ) : row.deleteBlocked ? (
        // A disabled button takes no hover, so the wrapper carries the reason.
        <Tooltip
          content={t("deleteBlockedHasChildren")}
          render={
            <span
              tabIndex={0}
              className="flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand"
            />
          }
        >
          <Button
            size="sm"
            shape="square"
            variant="secondary-destructive"
            icon={TrashIcon}
            aria-label={`${COPY.delete}: ${domain.domain}. ${t("deleteBlockedHasChildren")}`}
            className="pointer-events-none"
            disabled
          />
        </Tooltip>
      ) : (
        <span aria-hidden="true" className="size-6.5" />
      )}
    </span>
  )
}

/** One domain as a table row. Columns appear as the table gets room for them. */
function DomainRow(props: RowActionsProps) {
  const { row, nested } = props

  return (
    <Table.Row>
      {/* Takes the slack and truncates. */}
      <Table.Cell className="w-full max-w-0 overflow-hidden">
        <span className="flex min-w-0 items-start gap-2">
          {nested && (
            <span
              aria-hidden="true"
              className="flex h-lh shrink-0 items-center ps-1 text-kumo-inactive"
            >
              <ArrowElbowDownRightIcon size={14} />
            </span>
          )}
          <span className="grid min-w-0 gap-0.5">
            <DomainName row={row} />
            {/* Until "used by" has a column of its own. */}
            {(row.kind === "base" || row.appName) && (
              <span className="truncate text-kumo-subtle @min-[42rem]:hidden">
                {row.kind === "base"
                  ? row.children > 0
                    ? COPY.subdomains(row.children)
                    : COPY.unused
                  : row.appName}
              </span>
            )}
          </span>
        </span>
      </Table.Cell>
      <Table.Cell>
        <KindBadge kind={row.kind} />
      </Table.Cell>
      <Table.Cell className="hidden @min-[42rem]:table-cell">
        <UsedBy row={row} />
      </Table.Cell>
      <Table.Cell className="hidden @min-[62rem]:table-cell">
        <AppboxLink row={row} />
      </Table.Cell>
      <Table.Cell className="hidden font-mono text-[0.9em] whitespace-nowrap text-kumo-subtle @min-[52rem]:table-cell">
        {row.domain.ip_address ?? "—"}
      </Table.Cell>
      <Table.Cell className="hidden @min-[68rem]:table-cell">
        <ShortDate value={row.domain.created_at} />
      </Table.Cell>
      <Table.Cell>
        <RowActions {...props} />
      </Table.Cell>
    </Table.Row>
  )
}

/** One domain as a card, where there is no room for a table. */
function DomainCard(props: RowActionsProps) {
  const t = useTranslations("appboxmanager.domains")
  const { row } = props
  const facts = [
    { label: COPY.usedBy, value: <UsedBy row={row} /> },
    { label: t("cylo"), value: row.appbox ? <AppboxLink row={row} /> : null },
    {
      label: COPY.serverIp,
      value: row.domain.ip_address ? (
        <span className="font-mono text-[0.9em]">{row.domain.ip_address}</span>
      ) : null
    },
    {
      label: t("createdAt"),
      value: <ShortDate value={row.domain.created_at} />
    }
  ].filter((fact) => fact.value !== null)

  return (
    <article className="grid grid-cols-1 gap-3 rounded-lg bg-kumo-base px-4 py-3.5 shadow-xs ring ring-kumo-line">
      <header className="flex items-start justify-between gap-3">
        <DomainName row={row} className="break-all whitespace-normal" />
        <KindBadge kind={row.kind} />
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
      {(row.checkable || row.canDelete || row.deleteBlocked) && (
        <div className="flex justify-end border-t border-kumo-hairline pt-3">
          <RowActions {...props} />
        </div>
      )}
    </article>
  )
}

function ListSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="divide-y divide-kumo-hairline rounded-lg bg-kumo-base shadow-xs ring ring-kumo-line"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-4">
          <SkeletonLine className="h-2.5 w-48 rounded-full" />
          <SkeletonLine className="h-2.5 w-16 rounded-full" />
          <SkeletonLine className="ms-auto h-2.5 w-24 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Every custom domain on the account as a table: what each one is, which app
 * and Appbox it serves, where it points, and the two things that can be done
 * to it here (check its DNS again, delete it). Each base domain is followed by
 * the subdomains under it. Where there is no room for a table each domain is a
 * card.
 */
export function DomainsView({
  domains,
  installs,
  appboxes,
  onDelete,
  onCheckDns
}: DomainsViewProps) {
  const t = useTranslations("appboxmanager.domains")
  const tc = useTranslations("common")

  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<string>(ALL_KINDS)
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE)

  // The target outlives the dialog being open, so that the dialog still shows
  // it while it animates out.
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)

  const [checkingId, setCheckingId] = useState<number | null>(null)
  const [checked, setChecked] = useState<
    ({ domain: Domain } & DnsCheck) | null
  >(null)

  const all =
    domains.status === "ready"
      ? domains.data.filter((domain) => !isPlatformDomain(domain))
      : []

  const names = new Map(all.map((domain) => [domain.id, domain.domain]))
  const childCounts = new Map<number, number>()
  for (const domain of all) {
    if (domain.parent) {
      childCounts.set(domain.parent, (childCounts.get(domain.parent) ?? 0) + 1)
    }
  }

  const rows: Row[] = all.map((domain) => {
    const domainKind = kindOf(domain)
    const children = childCounts.get(domain.id) ?? 0
    const install = domain.instance_id
      ? installs.get(domain.instance_id)
      : undefined
    return {
      domain,
      kind: domainKind,
      root:
        (domain.parent ? names.get(domain.parent) : undefined) ??
        domain.parent_domain ??
        domain.domain,
      children,
      // A base domain is not attached to any one app.
      appName: domainKind === "base" ? null : (install?.name ?? domain.app),
      appIcon: install?.icon ?? "",
      appbox: domain.cylo_id ? (appboxes.get(domain.cylo_id) ?? null) : null,
      // The current page's rule for who gets the button, limited to the
      // domains the check can actually run for.
      checkable: domainKind === "custom" && isCheckable(domain) ? domain : null,
      canDelete: children === 0 && domainKind !== "managed",
      deleteBlocked: children > 0 && domainKind === "base"
    }
  })

  const needle = query.trim().toLowerCase()
  const matches = rows.filter(
    (row) =>
      (kind === ALL_KINDS || row.kind === kind) &&
      (!needle ||
        `${row.domain.domain} ${row.appName ?? ""} ${row.appbox ?? ""} ${row.domain.ip_address ?? ""}`
          .toLowerCase()
          .includes(needle))
  )
  // Array.sort is stable, so with no sort chosen the server's order stands.
  const ordered = sort
    ? [...matches].sort(
        (a, b) =>
          SORTERS[sort.key](a, b) * (sort.dir === "asc" ? 1 : -1) ||
          SORTERS.domain(a, b)
      )
    : matches

  const pageCount = Math.max(1, Math.ceil(ordered.length / perPage))
  const currentPage = Math.min(page, pageCount)
  const shown = ordered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  )

  const sortBy = (key: SortKey) => {
    setSort((current) => nextSort(current, key))
    setPage(1)
  }
  const sortValue = sort ? `${sort.key}:${sort.dir}` : ""
  const filterTo = (value: string) => {
    setKind(value)
    setPage(1)
  }
  const clearFilters = () => {
    setQuery("")
    filterTo(ALL_KINDS)
  }

  const kindCounts = KINDS.map((entry) => ({
    value: entry.value,
    count: rows.filter((row) => row.kind === entry.value).length,
    badge: <KindBadge kind={entry.value} />,
    hint: COPY.filterTo(t(entry.labelKey))
  })).filter((entry) => entry.count > 0)

  const askDelete = (domain: Domain) => {
    setDeleteTarget(domain)
    setDeleteFailed(false)
    setDeleteOpen(true)
  }
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteFailed(false)
    try {
      await onDelete(deleteTarget)
      setDeleteOpen(false)
    } catch {
      setDeleteFailed(true)
    } finally {
      setDeleting(false)
    }
  }

  const checkDns = async (domain: CheckableDomain) => {
    setCheckingId(domain.id)
    setChecked(null)
    try {
      setChecked({ domain, ...(await onCheckDns(domain)) })
    } catch {
      setChecked({ domain, verified: false })
    } finally {
      setCheckingId(null)
    }
  }

  // With each base domain leading its subdomains, show them as nested.
  const grouped = sort?.key === "domain" && sort.dir === "asc"
  const listed = new Set(ordered.map((row) => row.domain.domain))

  const rowProps = (row: Row): RowActionsProps => ({
    row,
    nested: grouped && row.root !== row.domain.domain && listed.has(row.root),
    checking: checkingId === row.domain.id,
    onCheckDns: (domain) => void checkDns(domain),
    onDelete: askDelete
  })

  return (
    <div className="flex flex-col gap-6">
      <header className="grid gap-1.5">
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold">
          <GlobeIcon aria-hidden="true" size={24} />
          {COPY.title}
        </h1>
        <p className="text-kumo-subtle">{t("pageDescription")}</p>
      </header>

      {/* With room to spare: how domains get here, and a count of each type. */}
      {rows.length > 0 && (
        <ShellRail>
          <section className="grid grid-cols-1 gap-2 border-b border-kumo-line px-5 pt-5 pb-5">
            <h2 className="flex min-h-7 items-center font-semibold">
              {COPY.addTitle}
            </h2>
            <p className="text-kumo-subtle">{COPY.addBody}</p>
            <div className="mt-1 flex">
              <LinkButton
                href={kumoRoutes.installedApps}
                size="sm"
                variant="secondary"
              >
                {COPY.addAction}
              </LinkButton>
            </div>
          </section>
          <RailStatusCard
            title={COPY.type}
            entries={kindCounts}
            active={kind}
            onSelect={(value) => filterTo(kind === value ? ALL_KINDS : value)}
          />
        </ShellRail>
      )}

      {/* The container the table's columns and the card fallback respond to. */}
      <div className="@container grid min-w-0 grid-cols-1 gap-3">
        {checked && (
          <Banner
            role={checked.verified ? "status" : "alert"}
            variant={checked.verified ? "default" : "error"}
            icon={
              checked.verified ? (
                <CheckCircleIcon weight="fill" />
              ) : (
                <WarningCircleIcon weight="fill" />
              )
            }
            title={checked.verified ? t("dnsVerified") : t("dnsNotVerified")}
            description={
              <>
                <span className="font-mono text-[0.9em] break-all">
                  {checked.domain.domain}
                </span>
                {!checked.verified && checked.expected_ip && (
                  <> · {t("expectedIp", { ip: checked.expected_ip })}</>
                )}
              </>
            }
            action={
              <Button
                size="sm"
                shape="square"
                variant="ghost"
                icon={XIcon}
                aria-label={COPY.dismiss}
                onClick={() => setChecked(null)}
              />
            }
          />
        )}

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
                  setPage(1)
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
                      setPage(1)
                    }}
                  />
                </InputGroup.Addon>
              )}
            </InputGroup>

            <Select
              aria-label={COPY.type}
              className={cn(FILTER_BAR_SELECT, "@xl:w-40")}
              value={kind}
              onValueChange={(value) =>
                filterTo(value ? String(value) : ALL_KINDS)
              }
              renderValue={(value) => {
                const entry = KINDS.find((item) => item.value === value)
                return entry ? t(entry.labelKey) : COPY.allTypes
              }}
            >
              <Select.Option value={ALL_KINDS}>{COPY.allTypes}</Select.Option>
              {KINDS.map((entry) => (
                <Select.Option key={entry.value} value={entry.value}>
                  {t(entry.labelKey)}
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
                setPage(1)
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

        {domains.status === "loading" && <ListSkeleton />}

        {domains.status === "error" && (
          <Banner
            variant="error"
            icon={<WarningCircleIcon weight="fill" />}
            title={tc("errors.loadFailed")}
          />
        )}

        {domains.status === "ready" && rows.length === 0 && (
          <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
            <Empty
              className={EMPTY_IN_CARD}
              icon={<GlobeIcon size={40} />}
              title={t("emptyTitle")}
              description={t("emptyDescription")}
              contents={
                <LinkButton href={kumoRoutes.appStore} variant="primary">
                  {t("goToAppStore")}
                </LinkButton>
              }
            />
          </div>
        )}

        {rows.length > 0 && ordered.length === 0 && (
          <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
            <Empty
              className={EMPTY_IN_CARD}
              icon={<GlobeIcon size={40} />}
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
          // One card around the table and its pager; plain cards below `@xl`.
          <div className="grid grid-cols-1 gap-3 @xl:gap-0 @xl:overflow-clip @xl:rounded-lg @xl:bg-kumo-base @xl:shadow-xs @xl:ring @xl:ring-kumo-line">
            <div className="hidden overflow-x-auto @xl:block">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <SortHead
                      label={t("domain")}
                      sortKey="domain"
                      sort={sort}
                      onSort={sortBy}
                    />
                    <SortHead
                      label={COPY.type}
                      sortKey="type"
                      sort={sort}
                      onSort={sortBy}
                    />
                    <SortHead
                      label={COPY.usedBy}
                      sortKey="app"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @min-[42rem]:table-cell"
                    />
                    <SortHead
                      label={t("cylo")}
                      sortKey="appbox"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @min-[62rem]:table-cell"
                    />
                    <SortHead
                      label={COPY.serverIp}
                      sortKey="ip"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @min-[52rem]:table-cell"
                    />
                    <SortHead
                      label={t("createdAt")}
                      sortKey="created"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @min-[68rem]:table-cell"
                    />
                    <Table.Head>
                      <span className="sr-only">{COPY.actions}</span>
                    </Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {shown.map((row) => (
                    <DomainRow key={row.domain.id} {...rowProps(row)} />
                  ))}
                </Table.Body>
              </Table>
            </div>

            <ul className="grid list-none grid-cols-1 gap-3 @xl:hidden">
              {shown.map((row) => (
                <li key={row.domain.id} className="min-w-0">
                  <DomainCard {...rowProps(row)} />
                </li>
              ))}
            </ul>

            {ordered.length > PAGE_SIZES[0] && (
              <div className="@xl:border-t @xl:border-kumo-hairline @xl:p-3">
                <Pagination
                  page={currentPage}
                  setPage={setPage}
                  perPage={perPage}
                  totalCount={ordered.length}
                  className="flex-wrap gap-y-3"
                >
                  <Pagination.Info className="whitespace-nowrap" />
                  <Pagination.PageSize
                    value={perPage}
                    options={PAGE_SIZES}
                    onChange={(size) => {
                      setPerPage(size)
                      setPage(1)
                    }}
                  />
                  <Pagination.Controls />
                </Pagination>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete a domain */}
      <Dialog.Root
        role="alertdialog"
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteOpen(false)
        }}
      >
        <Dialog className="grid grid-cols-1 gap-5 px-6 py-5">
          <div className="grid gap-1.5">
            <Dialog.Title className="text-lg font-semibold">
              {COPY.delete}
            </Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              {t("confirmDelete")}
              {deleteTarget && (
                <span className="mt-1 block font-mono text-[0.9em] break-all text-kumo-default">
                  {deleteTarget.domain}
                </span>
              )}
            </Dialog.Description>
          </div>
          {deleteFailed && (
            <Banner
              variant="error"
              icon={<WarningCircleIcon weight="fill" />}
              description={COPY.deleteFailed}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deleting}
              loading={deleting}
            >
              {COPY.delete}
            </Button>
          </div>
        </Dialog>
      </Dialog.Root>
    </div>
  )
}
