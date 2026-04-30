"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { formatDistanceToNow } from "date-fns"
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react"
import type { FileItem } from "@/api/files/files"
import { Button } from "@/components/ui/button"
import { cn, formatBytes } from "@/lib/utils"
import { FileContextMenu } from "./file-context-menu"
import { FileIcon } from "./file-icon"

type SortKey = "name" | "size" | "modifiedTime"
type SortDir = "asc" | "desc"

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
  if (!active) return <ArrowUpDown className="size-3.5 ml-1 opacity-50" />
  return direction === "asc" ? (
    <ArrowUp className="size-3.5 ml-1" />
  ) : (
    <ArrowDown className="size-3.5 ml-1" />
  )
}

export function FileList({
  items,
  onNavigate,
  onRename,
  onDelete,
  onDownload
}: FileListProps) {
  const t = useTranslations("appboxmanager.fileExplorer")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const sorted = sortItems(items, sortKey, sortDir)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  function getSortAriaLabel(key: SortKey, label: string) {
    if (sortKey !== key) return `Sort by ${label}`
    return `Sort by ${label}, currently ${sortDir === "asc" ? "ascending" : "descending"}`
  }

  return (
    <div className="w-full">
      {/* Mobile sort controls */}
      <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2 text-xs font-medium text-muted-foreground sm:hidden">
        <button
          className="inline-flex items-center rounded-md px-2 py-1 text-left transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => handleSort("name")}
          aria-label={getSortAriaLabel("name", t("name"))}
          aria-pressed={sortKey === "name"}
        >
          {t("name")}
          <SortIcon active={sortKey === "name"} direction={sortDir} />
        </button>
        <button
          className="inline-flex items-center rounded-md px-2 py-1 text-left transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => handleSort("size")}
          aria-label={getSortAriaLabel("size", t("size"))}
          aria-pressed={sortKey === "size"}
        >
          {t("size")}
          <SortIcon active={sortKey === "size"} direction={sortDir} />
        </button>
        <button
          className="inline-flex items-center rounded-md px-2 py-1 text-left transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => handleSort("modifiedTime")}
          aria-label={getSortAriaLabel("modifiedTime", t("modified"))}
          aria-pressed={sortKey === "modifiedTime"}
        >
          {t("modified")}
          <SortIcon active={sortKey === "modifiedTime"} direction={sortDir} />
        </button>
      </div>

      {/* Desktop header */}
      <div className="hidden grid-cols-[minmax(0,1fr)_100px_140px_40px] gap-2 border-b px-3 py-2 text-xs font-medium text-muted-foreground sm:grid">
        <button
          className="flex items-center text-left transition-colors hover:text-foreground"
          onClick={() => handleSort("name")}
        >
          {t("name")}
          <SortIcon active={sortKey === "name"} direction={sortDir} />
        </button>
        <button
          className="flex items-center text-left transition-colors hover:text-foreground"
          onClick={() => handleSort("size")}
        >
          {t("size")}
          <SortIcon active={sortKey === "size"} direction={sortDir} />
        </button>
        <button
          className="flex items-center text-left transition-colors hover:text-foreground"
          onClick={() => handleSort("modifiedTime")}
        >
          {t("modified")}
          <SortIcon active={sortKey === "modifiedTime"} direction={sortDir} />
        </button>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/50">
        {sorted.map((item) => {
          const hasActions =
            item.capabilities.canDownload ||
            item.capabilities.canRename ||
            item.capabilities.canDelete

          return (
            <div
              key={item.id}
              className="grid grid-cols-[minmax(0,1fr)_2.25rem] items-center gap-x-2 gap-y-1 px-3 py-3 transition-colors hover:bg-muted/50 sm:grid-cols-[minmax(0,1fr)_100px_140px_40px] sm:gap-2 sm:py-2"
              onDoubleClick={() => {
                if (item.type === "dir") {
                  onNavigate(item.id)
                }
              }}
            >
              {/* Name */}
              <div
                className={cn(
                  "col-start-1 row-start-1 flex min-w-0 items-center gap-2.5",
                  !hasActions && "col-span-2 sm:col-span-1"
                )}
              >
                <FileIcon
                  name={item.name}
                  type={item.type}
                  className="shrink-0"
                />
                <button
                  className="line-clamp-2 min-w-0 text-left text-sm font-medium leading-snug transition-colors wrap-break-word hover:text-primary sm:line-clamp-none sm:truncate sm:font-normal sm:leading-normal"
                  onClick={() => {
                    if (item.type === "dir") {
                      onNavigate(item.id)
                    }
                  }}
                  title={item.name}
                >
                  {item.name}
                </button>
              </div>

              <div
                className={cn(
                  "col-start-1 row-start-2 ml-8 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground sm:contents",
                  !hasActions && "col-span-2 sm:col-span-1"
                )}
              >
                {/* Size */}
                <span className="tabular-nums">
                  {item.type === "file"
                    ? formatBytes(Number(item.size) || 0, 1)
                    : "—"}
                </span>

                {/* Modified */}
                <span className="min-w-0 wrap-break-word">
                  {item.modifiedTime
                    ? formatDistanceToNow(new Date(item.modifiedTime), {
                        addSuffix: true
                      })
                    : "—"}
                </span>
              </div>

              {/* Actions — visible by default for touch and pointer users */}
              {hasActions && (
                <div className="col-start-2 row-span-2 row-start-1 flex justify-end self-start sm:col-start-auto sm:row-auto sm:self-center">
                  <FileContextMenu
                    item={item}
                    onRename={onRename}
                    onDelete={onDelete}
                    onDownload={onDownload}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground sm:size-7"
                      aria-label={`${item.name} actions`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </FileContextMenu>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
