"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Banner, Empty, InputGroup, Pagination, Table } from "@cloudflare/kumo"
import {
  MagnifyingGlassIcon,
  PackageIcon,
  WarningCircleIcon
} from "@phosphor-icons/react"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { Link } from "@/i18n/routing"
import { AppIcon } from "./app-icon"
import {
  InstanceBulkActions,
  InstanceRowActions,
  InstanceStatusBadge,
  useInstanceRunner,
  type InstanceAction
} from "./instance-controls"
import { kumoRoutes } from "./kumo-routes"
import { EMPTY_IN_CARD, type Loadable } from "./shared"
import { LinesSkeleton } from "./skeletons"

export type { InstanceAction }

const PAGE_SIZE = 5

const COPY = {
  selectAll: "Select all installs on this page",
  select: (name: string) => `Select ${name}`,
  loadFailed: "Could not load your installs of this app."
} as const

interface AppInstancesProps {
  instances: Loadable<InstalledApp[]>
  /** Runs the action on the given install ids. Resolves when the requests settle. */
  onAction: (action: InstanceAction, ids: number[]) => Promise<unknown>
}

/** The signed-in user's installs of one app, with per-row and bulk power controls. */
export function AppInstances({ instances, onAction }: AppInstancesProps) {
  const t = useTranslations("appboxmanager.installedApps")
  const locale = useLocale()

  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set())
  const { busy, bulk, runRow, runBulk } = useInstanceRunner(onAction)

  if (instances.status === "loading") {
    return <LinesSkeleton />
  }

  if (instances.status === "error") {
    return (
      <div className="p-3">
        <Banner
          variant="error"
          icon={<WarningCircleIcon weight="fill" />}
          title={COPY.loadFailed}
        />
      </div>
    )
  }

  if (instances.data.length === 0) {
    return (
      <Empty
        className={EMPTY_IN_CARD}
        size="sm"
        icon={<PackageIcon size={32} />}
        title={t("empty")}
      />
    )
  }

  const needle = query.trim().toLowerCase()
  const matches = needle
    ? instances.data.filter((app) =>
        `${app.display_name} ${app.domain} ${app.cylo_name}`
          .toLowerCase()
          .includes(needle)
      )
    : instances.data
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = matches.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const selectedRows = instances.data.filter((app) => selected.has(app.id))
  const allOnPage = rows.length > 0 && rows.every((app) => selected.has(app.id))
  const someOnPage = rows.some((app) => selected.has(app.id))

  const toggle = (ids: number[], on: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)))
      return next
    })

  return (
    <div className="grid grid-cols-1">
      {(instances.data.length > PAGE_SIZE || selectedRows.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-kumo-hairline p-3">
          {selectedRows.length > 0 ? (
            <>
              <span className="pe-1 text-kumo-subtle">
                {t("bulkSelected", { count: selectedRows.length })}
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
            </>
          ) : (
            <InputGroup className="w-full max-w-xs">
              <InputGroup.Addon>
                <MagnifyingGlassIcon />
              </InputGroup.Addon>
              <InputGroup.Input
                value={query}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
              />
            </InputGroup>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.CheckHead
                checked={allOnPage}
                indeterminate={someOnPage && !allOnPage}
                onCheckedChange={(checked) =>
                  toggle(
                    rows.map((app) => app.id),
                    Boolean(checked)
                  )
                }
                aria-label={COPY.selectAll}
              />
              <Table.Head>{t("name")}</Table.Head>
              <Table.Head className="hidden lg:table-cell">
                {t("domain")}
              </Table.Head>
              <Table.Head className="hidden md:table-cell">
                {t("version")}
              </Table.Head>
              <Table.Head>{t("status")}</Table.Head>
              <Table.Head className="hidden md:table-cell">
                {t("cylo")}
              </Table.Head>
              <Table.Head className="hidden xl:table-cell">
                {t("installedDate")}
              </Table.Head>
              <Table.Head>
                <span className="sr-only">Actions</span>
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((app) => {
              return (
                <Table.Row
                  key={app.id}
                  variant={selected.has(app.id) ? "selected" : "default"}
                >
                  <Table.CheckCell
                    checked={selected.has(app.id)}
                    onCheckedChange={(checked) =>
                      toggle([app.id], Boolean(checked))
                    }
                    aria-label={COPY.select(app.display_name)}
                  />
                  <Table.Cell>
                    <span className="flex items-center gap-2.5">
                      <AppIcon
                        icon={app.icon_image}
                        name={app.display_name}
                        className="size-6"
                      />
                      <Link
                        href={kumoRoutes.installedApp(app.id)}
                        className="font-medium text-kumo-default no-underline hover:underline"
                      >
                        {app.display_name}
                      </Link>
                    </span>
                  </Table.Cell>
                  <Table.Cell className="hidden font-mono text-[0.9em] text-kumo-subtle lg:table-cell">
                    {app.domain || "—"}
                  </Table.Cell>
                  <Table.Cell className="hidden font-mono text-[0.9em] md:table-cell">
                    {app.version}
                  </Table.Cell>
                  <Table.Cell>
                    <InstanceStatusBadge status={app.status} />
                  </Table.Cell>
                  <Table.Cell className="hidden md:table-cell">
                    {app.cylo_name}
                  </Table.Cell>
                  <Table.Cell className="hidden whitespace-nowrap text-kumo-subtle xl:table-cell">
                    {new Date(app.install_date).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </Table.Cell>
                  <Table.Cell>
                    <span className="flex justify-end">
                      <InstanceRowActions
                        app={app}
                        busy={busy.get(app.id)}
                        onRun={(action) => void runRow(action, app)}
                      />
                    </span>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </div>

      {matches.length > PAGE_SIZE && (
        <div className="border-t border-kumo-hairline p-3">
          <Pagination
            page={currentPage}
            setPage={setPage}
            perPage={PAGE_SIZE}
            totalCount={matches.length}
            controls="simple"
          />
        </div>
      )}
    </div>
  )
}
