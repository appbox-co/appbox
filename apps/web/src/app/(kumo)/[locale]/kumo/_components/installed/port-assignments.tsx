"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Empty,
  InputGroup,
  Pagination,
  SkeletonLine,
  Table
} from "@cloudflare/kumo"
import { MagnifyingGlassIcon, PlugsIcon } from "@phosphor-icons/react"
import { usePortAssignments } from "@/api/installed-apps/hooks/use-port-assignments"
import type { PortAssignment } from "@/api/installed-apps/port-assignments"
import { Panel } from "../panel"
import { EMPTY_IN_CARD } from "../shared"
import { nextSort, SortHead, type SortState } from "../sort-head"

interface PortAssignmentsProps {
  serverName: string
  instanceId: number
}

type Column =
  "internal_ip" | "host_ip" | "internal_port" | "host_port" | "protocol"

const PAGE_SIZE = 25

const COLUMNS: { key: Column; labelKey: string; upper?: boolean }[] = [
  { key: "internal_ip", labelKey: "internalIp" },
  { key: "host_ip", labelKey: "hostIp" },
  { key: "internal_port", labelKey: "internalPort" },
  { key: "host_port", labelKey: "hostPort" },
  { key: "protocol", labelKey: "protocol", upper: true }
]

function compare(a: PortAssignment, b: PortAssignment, key: Column) {
  const left = a[key]
  const right = b[key]
  if (typeof left === "number" && typeof right === "number") return left - right
  return String(left ?? "").localeCompare(String(right ?? ""), undefined, {
    numeric: true
  })
}

/** The ports this app has been given on its server: searchable, sortable, 25 to a page. */
export function PortAssignments({
  serverName,
  instanceId
}: PortAssignmentsProps) {
  const t = useTranslations("appboxmanager.appDetail")
  const { data: ports = [], isLoading } = usePortAssignments(
    serverName,
    instanceId
  )
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortState<Column>>(null)
  const [page, setPage] = useState(1)

  const needle = query.trim().toLowerCase()
  const matches = needle
    ? ports.filter((port) =>
        COLUMNS.some(({ key }) =>
          String(port[key] ?? "")
            .toLowerCase()
            .includes(needle)
        )
      )
    : ports
  const ordered = sort
    ? [...matches].sort(
        (a, b) => compare(a, b, sort.key) * (sort.dir === "asc" ? 1 : -1)
      )
    : matches
  const pageCount = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = ordered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <Panel
      title={t("tabPorts")}
      count={isLoading ? undefined : ports.length}
      flush
    >
      <div className="border-b border-kumo-hairline p-3">
        <InputGroup className="w-full max-w-xs">
          <InputGroup.Addon>
            <MagnifyingGlassIcon />
          </InputGroup.Addon>
          <InputGroup.Input
            value={query}
            placeholder={t("searchPorts")}
            aria-label={t("searchPorts")}
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
        </InputGroup>
      </div>

      {isLoading ? (
        <div className="grid gap-3 p-4">
          <SkeletonLine className="h-2.5 w-1/3 rounded-full" />
          <SkeletonLine className="h-2.5 w-2/3 rounded-full" />
          <SkeletonLine className="h-2.5 w-1/2 rounded-full" />
        </div>
      ) : rows.length === 0 ? (
        <Empty
          className={EMPTY_IN_CARD}
          size="sm"
          icon={<PlugsIcon size={32} />}
          title={t("noPortAssignments")}
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                {COLUMNS.map((column) => (
                  <SortHead
                    key={column.key}
                    label={t(column.labelKey)}
                    sortKey={column.key}
                    sort={sort}
                    onSort={(key) => {
                      setSort((current) => nextSort(current, key))
                      setPage(1)
                    }}
                  />
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((port) => (
                <Table.Row key={port.id}>
                  {COLUMNS.map((column) => (
                    <Table.Cell
                      key={column.key}
                      className={
                        column.upper
                          ? "font-mono text-[0.9em] uppercase"
                          : "font-mono text-[0.9em] tabular-nums"
                      }
                    >
                      {port[column.key] ?? "—"}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}

      {ordered.length > PAGE_SIZE && (
        <div className="border-t border-kumo-hairline p-3">
          <Pagination
            page={currentPage}
            setPage={setPage}
            perPage={PAGE_SIZE}
            totalCount={ordered.length}
          >
            <Pagination.Info />
            <Pagination.Controls />
          </Pagination>
        </div>
      )}
    </Panel>
  )
}
