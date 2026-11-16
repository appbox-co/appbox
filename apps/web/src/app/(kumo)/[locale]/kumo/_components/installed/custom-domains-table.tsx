"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Badge,
  Button,
  Empty,
  InputGroup,
  Pagination,
  SkeletonLine,
  Table,
  Tooltip
} from "@cloudflare/kumo"
import {
  CaretDownIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  GlobeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  XIcon
} from "@phosphor-icons/react"
import type { InstanceDomain } from "@/api/domains/hooks/use-domains"
import { EMPTY_IN_CARD } from "../shared"
import { ShortDate } from "../short-date"

/**
 * Prototype-only copy, in English and sentence case, for controls the current
 * design has no translation string for.
 */
const COPY = {
  sortBy: (column: string) => `Sort by ${column.toLowerCase()}`,
  clearSearch: "Clear search"
} as const

/** The current table's page sizes: 25 a page, plus its usual choices. */
const PAGE_SIZES = [10, 20, 25, 50, 100]
const DEFAULT_PAGE_SIZE = 25

/** The primary domain is the one the app was installed with. */
function isPrimaryDomain(domain: InstanceDomain) {
  return domain.is_initial === 1 || domain.is_initial === true
}

/* -------------------------------------------------------------------------- */
/*  Sorting                                                                    */
/* -------------------------------------------------------------------------- */

type SortKey = "domain" | "primary" | "added"

/** `null` is the default: the order the server returned. */
type SortState = { key: SortKey; dir: "asc" | "desc" } | null

type Sorter = (a: InstanceDomain, b: InstanceDomain) => number

const time = (value: string) => {
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

const SORTERS: Record<SortKey, Sorter> = {
  domain: (a, b) =>
    a.domain.localeCompare(b.domain, undefined, {
      numeric: true,
      sensitivity: "base"
    }),
  primary: (a, b) => Number(isPrimaryDomain(a)) - Number(isPrimaryDomain(b)),
  added: (a, b) => time(a.created_at) - time(b.created_at)
}

/** A column header that sorts: ascending, then descending, then back to the default. */
function SortHead({
  label,
  sortKey,
  sort,
  onSort,
  className
}: {
  label: string
  sortKey: SortKey
  sort: SortState
  onSort: (key: SortKey) => void
  className?: string
}) {
  const direction = sort?.key === sortKey ? sort.dir : null
  const Icon =
    direction === "asc"
      ? CaretUpIcon
      : direction === "desc"
        ? CaretDownIcon
        : CaretUpDownIcon

  return (
    <Table.Head
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : "none"
      }
      className={className}
    >
      <button
        type="button"
        title={COPY.sortBy(label)}
        onClick={() => onSort(sortKey)}
        className="-mx-1.5 -my-1 flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 font-semibold whitespace-nowrap hover:bg-kumo-tint focus-visible:outline-2 focus-visible:outline-kumo-brand"
      >
        {label}
        <Icon
          aria-hidden="true"
          size={12}
          weight="bold"
          className={direction ? undefined : "text-kumo-inactive"}
        />
      </button>
    </Table.Head>
  )
}

/* -------------------------------------------------------------------------- */
/*  Table                                                                      */
/* -------------------------------------------------------------------------- */

interface CustomDomainsTableProps {
  domains: InstanceDomain[]
  isLoading: boolean
  /** Whether domains can be removed right now (the app is installed and enabled). */
  canManage: boolean
  /** A configuration request is in flight; every "view config" button waits for it. */
  configPending: boolean
  /** The domain that request is for, which shows the spinner. */
  configDomain?: string
  onViewConfig: (domain: string) => void
  onDelete: (domain: InstanceDomain) => void
}

/**
 * The domains attached to one install: search by name, sort by any column,
 * and page through them, as the current table does. Runs edge to edge inside
 * its card.
 */
export function CustomDomainsTable({
  domains,
  isLoading,
  canManage,
  configPending,
  configDomain,
  onViewConfig,
  onDelete
}: CustomDomainsTableProps) {
  const t = useTranslations("appboxmanager.appDetail")

  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortState>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE)

  const needle = query.trim().toLowerCase()
  const matches = needle
    ? domains.filter((domain) => domain.domain.toLowerCase().includes(needle))
    : domains
  // Array.sort is stable, so ties keep the server's order.
  const ordered = sort
    ? [...matches].sort(
        (a, b) => SORTERS[sort.key](a, b) * (sort.dir === "asc" ? 1 : -1)
      )
    : matches

  const pageCount = Math.max(1, Math.ceil(ordered.length / perPage))
  const currentPage = Math.min(page, pageCount)
  const rows = ordered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const sortBy = (key: SortKey) => {
    setSort((current) =>
      current?.key !== key
        ? { key, dir: "asc" }
        : current.dir === "asc"
          ? { key, dir: "desc" }
          : null
    )
    setPage(1)
  }

  const clearSearch = () => {
    setQuery("")
    setPage(1)
  }

  return (
    // The container the date column responds to.
    <div className="@container grid grid-cols-1">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-kumo-hairline p-3">
        <p className="text-kumo-subtle">{t("customDomainsDescription")}</p>
        <InputGroup className="max-w-xs">
          <InputGroup.Addon>
            <MagnifyingGlassIcon />
          </InputGroup.Addon>
          <InputGroup.Input
            value={query}
            placeholder={t("customDomainsSearch")}
            aria-label={t("customDomainsSearch")}
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
                onClick={clearSearch}
              />
            </InputGroup.Addon>
          )}
        </InputGroup>
      </div>

      {isLoading ? (
        <div aria-hidden="true" className="grid gap-3 p-4">
          <SkeletonLine className="h-2.5 w-1/3 rounded-full" />
          <SkeletonLine className="h-2.5 w-2/3 rounded-full" />
          <SkeletonLine className="h-2.5 w-1/2 rounded-full" />
        </div>
      ) : rows.length === 0 ? (
        <Empty
          className={EMPTY_IN_CARD}
          size="sm"
          icon={<GlobeIcon size={32} />}
          title={t("customDomainsEmpty")}
          contents={
            needle ? (
              <Button variant="secondary" onClick={clearSearch}>
                {COPY.clearSearch}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <SortHead
                  label={t("customDomainsDomain")}
                  sortKey="domain"
                  sort={sort}
                  onSort={sortBy}
                />
                <SortHead
                  label={t("customDomainsPrimary")}
                  sortKey="primary"
                  sort={sort}
                  onSort={sortBy}
                />
                <SortHead
                  label={t("customDomainsAdded")}
                  sortKey="added"
                  sort={sort}
                  onSort={sortBy}
                  className="hidden @lg:table-cell"
                />
                <Table.Head>
                  <span className="sr-only">{t("customDomainsActions")}</span>
                </Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((domain) => {
                const primary = isPrimaryDomain(domain)
                return (
                  <Table.Row key={domain.id}>
                    {/* Takes the slack and truncates. */}
                    <Table.Cell className="w-full max-w-0 overflow-hidden">
                      <span
                        className="block truncate font-mono text-[0.9em]"
                        title={domain.domain}
                      >
                        {domain.domain}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={primary ? "info" : "secondary"}>
                        {primary
                          ? t("customDomainsPrimaryYes")
                          : t("customDomainsPrimaryNo")}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="hidden @lg:table-cell">
                      <ShortDate value={domain.created_at} />
                    </Table.Cell>
                    <Table.Cell>
                      <span className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          className="whitespace-nowrap"
                          loading={
                            configPending && configDomain === domain.domain
                          }
                          disabled={configPending}
                          onClick={() => onViewConfig(domain.domain)}
                        >
                          {t("customDomainsViewConfig")}
                        </Button>
                        {/* The primary domain cannot be removed; its slot stays
                            empty so the buttons line up down the column. */}
                        {primary ? (
                          <span aria-hidden="true" className="size-6.5" />
                        ) : (
                          <Tooltip
                            content={t("customDomainsDelete")}
                            render={
                              <Button
                                size="sm"
                                shape="square"
                                variant="secondary-destructive"
                                icon={TrashIcon}
                                aria-label={`${t("customDomainsDelete")}: ${domain.domain}`}
                                disabled={!canManage}
                                onClick={() => {
                                  if (!canManage) return
                                  onDelete(domain)
                                }}
                              />
                            }
                          />
                        )}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        </div>
      )}

      {!isLoading && ordered.length > PAGE_SIZES[0] && (
        <div className="border-t border-kumo-hairline p-3">
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
  )
}
