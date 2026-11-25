"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, cn, Table } from "@cloudflare/kumo"
import {
  CaretDownIcon,
  CaretUpDownIcon,
  CaretUpIcon
} from "@phosphor-icons/react"
import type { FileItem } from "@/api/files/files"
import { formatBytes } from "@/lib/utils/format"
import { useRelativeTime } from "../short-date"
import { nextSort, SortHead, type SortState } from "../sort-head"
import { FileActionsMenu, hasFileActions } from "./file-actions-menu"
import { FileTypeIcon } from "./file-icon"

/** Prototype-only copy, in English and sentence case. */
const COPY = {
  actionsColumn: "Actions"
}

type SortKey = "name" | "size" | "modifiedTime"
type SortDir = "asc" | "desc"

/** The order the list opens in, and returns to when a column's sort is cleared. */
const DEFAULT_SORT = { key: "name", dir: "asc" } as const

interface FileListProps {
  items: FileItem[]
  onNavigate: (id: string) => void
  onRename: (item: FileItem) => void
  onDelete: (item: FileItem) => void
  onDownload: (item: FileItem) => void
}

function sortItems(items: FileItem[], key: SortKey, dir: SortDir): FileItem[] {
  const sorted = [...items].sort((a, b) => {
    // Directories always first
    if (a.type !== b.type) {
      return a.type === "dir" ? -1 : 1
    }

    let cmp = 0
    switch (key) {
      case "name":
        cmp = a.name.localeCompare(b.name, undefined, {
          sensitivity: "base"
        })
        break
      case "size":
        cmp = (Number(a.size) || 0) - (Number(b.size) || 0)
        break
      case "modifiedTime":
        cmp =
          new Date(a.modifiedTime).getTime() -
          new Date(b.modifiedTime).getTime()
        break
    }
    return dir === "asc" ? cmp : -cmp
  })
  return sorted
}

function SortIcon({
  active,
  direction
}: {
  active: boolean
  direction: SortDir
}) {
  const Icon = !active
    ? CaretUpDownIcon
    : direction === "asc"
      ? CaretUpIcon
      : CaretDownIcon
  return (
    <Icon
      aria-hidden="true"
      size={12}
      weight="bold"
      className={active ? undefined : "text-kumo-inactive"}
    />
  )
}

function fileSize(item: FileItem) {
  return item.type === "file" ? formatBytes(Number(item.size) || 0, 1) : "—"
}

function ModifiedTime({ value }: { value: string }) {
  const relativeTime = useRelativeTime()
  if (!value) return "—"
  return <time dateTime={value}>{relativeTime(value)}</time>
}

/**
 * The folder's contents as a table: folders first, sortable by name, size or
 * date. A row opens its folder, or downloads its file, when clicked. Below
 * the width where size and date fit as columns they move under the name, and
 * the column headers give way to a row of sort buttons.
 */
export function FileList({
  items,
  onNavigate,
  onRename,
  onDelete,
  onDownload
}: FileListProps) {
  const t = useTranslations("appboxmanager.fileExplorer")
  const [sort, setSort] = useState<SortState<SortKey>>(DEFAULT_SORT)

  const sortKey = sort?.key ?? DEFAULT_SORT.key
  const sortDir = sort?.dir ?? DEFAULT_SORT.dir
  const sorted = sortItems(items, sortKey, sortDir)

  function handleSort(key: SortKey) {
    setSort((current) => nextSort(current, key))
  }

  function getSortAriaLabel(key: SortKey, label: string) {
    if (sort?.key !== key) return `Sort by ${label}`
    return `Sort by ${label}, currently ${sort.dir === "asc" ? "ascending" : "descending"}`
  }

  function canOpenItem(item: FileItem) {
    return item.type === "dir" || item.capabilities.canDownload
  }

  function handleOpenItem(item: FileItem) {
    if (item.type === "dir") {
      onNavigate(item.id)
      return
    }

    if (item.capabilities.canDownload) {
      onDownload(item)
    }
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: t("name") },
    { key: "size", label: t("size") },
    { key: "modifiedTime", label: t("modified") }
  ]

  return (
    // The container the columns respond to.
    <div className="@container grid grid-cols-1">
      {/* Sort controls for narrow widths, where the table has no header */}
      <div className="flex flex-wrap items-center gap-1 border-b border-kumo-hairline px-3 py-2 @lg:hidden">
        {columns.map(({ key, label }) => (
          <Button
            key={key}
            size="sm"
            variant="ghost"
            aria-label={getSortAriaLabel(key, label)}
            aria-pressed={sort?.key === key}
            className={sort?.key === key ? "bg-kumo-fill" : undefined}
            onClick={() => handleSort(key)}
          >
            {label}
            <SortIcon active={sort?.key === key} direction={sortDir} />
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <Table.Header className="hidden @lg:table-header-group">
            <Table.Row>
              {columns.map(({ key, label }) => (
                <SortHead
                  key={key}
                  label={label}
                  sortKey={key}
                  sort={sort}
                  onSort={handleSort}
                />
              ))}
              <Table.Head>
                <span className="sr-only">{COPY.actionsColumn}</span>
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sorted.map((item) => {
              const canOpen = canOpenItem(item)

              return (
                <Table.Row
                  key={item.id}
                  className={cn(canOpen && "cursor-pointer hover:bg-kumo-tint")}
                  onClick={() => {
                    if (canOpen) {
                      handleOpenItem(item)
                    }
                  }}
                >
                  {/* Name: takes the slack, so long names shorten instead of
                      widening the table. */}
                  <Table.Cell className="w-full max-w-0">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FileTypeIcon
                        name={item.name}
                        type={item.type}
                        className="shrink-0"
                      />
                      <div className="grid min-w-0 grid-cols-1 gap-0.5">
                        {canOpen ? (
                          // Gives the row a place in the tab order. Enter and
                          // Space press it, and that click is the row's.
                          <button
                            type="button"
                            title={item.name}
                            className="max-w-full cursor-pointer justify-self-start rounded-sm text-left font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kumo-brand @lg:font-normal"
                          >
                            <span className="line-clamp-2 wrap-break-word @lg:line-clamp-1 @lg:break-all">
                              {item.name}
                            </span>
                          </button>
                        ) : (
                          <span
                            title={item.name}
                            className="line-clamp-2 font-medium wrap-break-word @lg:line-clamp-1 @lg:font-normal @lg:break-all"
                          >
                            {item.name}
                          </span>
                        )}
                        {/* Size and date, until they have columns of their own */}
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-kumo-subtle @lg:hidden">
                          <span className="tabular-nums">{fileSize(item)}</span>
                          <ModifiedTime value={item.modifiedTime} />
                        </span>
                      </div>
                    </div>
                  </Table.Cell>

                  {/* Size */}
                  <Table.Cell className="hidden whitespace-nowrap text-kumo-subtle tabular-nums @lg:table-cell">
                    {fileSize(item)}
                  </Table.Cell>

                  {/* Modified */}
                  <Table.Cell className="hidden whitespace-nowrap text-kumo-subtle @lg:table-cell">
                    <ModifiedTime value={item.modifiedTime} />
                  </Table.Cell>

                  {/* Actions — visible by default for touch and pointer users */}
                  <Table.Cell className="py-0!">
                    {hasFileActions(item) && (
                      <div
                        className="flex justify-end"
                        onClick={(event) => event.stopPropagation()}
                        onDoubleClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <FileActionsMenu
                          item={item}
                          onRename={onRename}
                          onDelete={onDelete}
                          onDownload={onDownload}
                        />
                      </div>
                    )}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}
