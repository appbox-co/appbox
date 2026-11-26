"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Badge,
  Button,
  Empty,
  InputGroup,
  Table,
  Tooltip
} from "@cloudflare/kumo"
import {
  GlobeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  XIcon
} from "@phosphor-icons/react"
import type { InstanceDomain } from "@/api/domains/hooks/use-domains"
import { EMPTY_IN_CARD } from "../shared"
import { PageFooter, usePagedRows } from "../ui/paged-rows"
import { ShortDate } from "../ui/short-date"
import { LinesSkeleton } from "../ui/skeletons"
import { compareText, SortHead, timeOf, type Comparator } from "../ui/sort-head"

/**
 * Prototype-only copy, in English and sentence case, for controls the current
 * design has no translation string for.
 */
const COPY = {
  clearSearch: "Clear search"
} as const

/** The primary domain is the one the app was installed with. */
function isPrimaryDomain(domain: InstanceDomain) {
  return domain.is_initial === 1 || domain.is_initial === true
}

/* -------------------------------------------------------------------------- */
/*  Sorting                                                                    */
/* -------------------------------------------------------------------------- */

type SortKey = "domain" | "primary" | "added"

const SORTERS: Record<SortKey, Comparator<InstanceDomain>> = {
  domain: (a, b) => compareText(a.domain, b.domain),
  primary: (a, b) => Number(isPrimaryDomain(a)) - Number(isPrimaryDomain(b)),
  added: (a, b) => timeOf(a.created_at) - timeOf(b.created_at)
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

  const needle = query.trim().toLowerCase()
  const matches = needle
    ? domains.filter((domain) => domain.domain.toLowerCase().includes(needle))
    : domains
  // Ties keep the server's order.
  const { rows, sort, sortBy, firstPage, pager } = usePagedRows(matches, {
    sorters: SORTERS,
    perPage: 25
  })

  const clearSearch = () => {
    setQuery("")
    firstPage()
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
              firstPage()
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
        <LinesSkeleton />
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

      {!isLoading && <PageFooter pager={pager} />}
    </div>
  )
}
