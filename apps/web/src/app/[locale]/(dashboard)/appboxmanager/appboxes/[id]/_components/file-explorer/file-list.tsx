"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { formatDistanceToNow } from "date-fns"
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react"
import type { FileItem } from "@/api/files/files"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/utils"
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

  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid grid-cols-[1fr_100px_140px_40px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        <button
          className="flex items-center text-left hover:text-foreground transition-colors"
          onClick={() => handleSort("name")}
        >
          {t("name")}
          <SortIcon active={sortKey === "name"} direction={sortDir} />
        </button>
        <button
          className="flex items-center text-left hover:text-foreground transition-colors"
          onClick={() => handleSort("size")}
        >
          {t("size")}
          <SortIcon active={sortKey === "size"} direction={sortDir} />
        </button>
        <button
          className="flex items-center text-left hover:text-foreground transition-colors"
          onClick={() => handleSort("modifiedTime")}
        >
          {t("modified")}
          <SortIcon active={sortKey === "modifiedTime"} direction={sortDir} />
        </button>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/50">
        {sorted.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_100px_140px_40px] gap-2 px-3 py-2 items-center hover:bg-muted/50 transition-colors group"
            onDoubleClick={() => {
              if (item.type === "dir") {
                onNavigate(item.id)
              }
            }}
          >
            {/* Name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <FileIcon name={item.name} type={item.type} />
              <button
                className="truncate text-sm text-left hover:text-primary transition-colors"
                onClick={() => {
                  if (item.type === "dir") {
                    onNavigate(item.id)
                  }
                }}
              >
                {item.name}
              </button>
            </div>

            {/* Size */}
            <span className="text-xs text-muted-foreground tabular-nums">
              {item.type === "file"
                ? formatBytes(Number(item.size) || 0, 1)
                : "—"}
            </span>

            {/* Modified */}
            <span className="text-xs text-muted-foreground">
              {item.modifiedTime
                ? formatDistanceToNow(new Date(item.modifiedTime), {
                    addSuffix: true
                  })
                : "—"}
            </span>

            {/* Actions — only show if the item has at least one action */}
            {(item.capabilities.canDownload ||
              item.capabilities.canRename ||
              item.capabilities.canDelete) && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <FileContextMenu
                  item={item}
                  onRename={onRename}
                  onDelete={onDelete}
                  onDownload={onDownload}
                >
                  <Button variant="ghost" size="icon" className="size-7">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </FileContextMenu>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
