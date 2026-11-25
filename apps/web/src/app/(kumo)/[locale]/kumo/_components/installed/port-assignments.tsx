"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Empty, InputGroup, Table } from "@cloudflare/kumo"
import { MagnifyingGlassIcon, PlugsIcon } from "@phosphor-icons/react"
import { usePortAssignments } from "@/api/installed-apps/hooks/use-port-assignments"
import type { PortAssignment } from "@/api/installed-apps/port-assignments"
import { PageFooter, usePagedRows } from "../paged-rows"
import { Panel } from "../panel"
import { EMPTY_IN_CARD } from "../shared"
import { LinesSkeleton } from "../skeletons"
import { SortHead, type Comparator } from "../sort-head"

interface PortAssignmentsProps {
  serverName: string
  instanceId: number
}

type Column =
  "internal_ip" | "host_ip" | "internal_port" | "host_port" | "protocol"

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

const SORTERS = Object.fromEntries(
  COLUMNS.map(({ key }) => [
    key,
    (a: PortAssignment, b: PortAssignment) => compare(a, b, key)
  ])
) as Record<Column, Comparator<PortAssignment>>

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
  const { rows, sort, sortBy, firstPage, pager } = usePagedRows(matches, {
    sorters: SORTERS,
    perPage: 25
  })

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
              firstPage()
            }}
          />
        </InputGroup>
      </div>

      {isLoading ? (
        <LinesSkeleton />
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
                    onSort={sortBy}
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

      <PageFooter pager={pager} fixedSize />
    </Panel>
  )
}
