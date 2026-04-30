"use client"

import { MoreHorizontal } from "lucide-react"
import type { FileItem } from "@/api/files/files"
import { Button } from "@/components/ui/button"
import { cn, formatBytes } from "@/lib/utils"
import { FileContextMenu } from "./file-context-menu"
import { FileIcon } from "./file-icon"

interface FileGridProps {
  items: FileItem[]
  onNavigate: (id: string) => void
  onRename: (item: FileItem) => void
  onDelete: (item: FileItem) => void
  onDownload: (item: FileItem) => void
}

export function FileGrid({
  items,
  onNavigate,
  onRename,
  onDelete,
  onDownload
}: FileGridProps) {
  // Sort: dirs first, then files, alphabetically
  const sorted = [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  })

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

  return (
    <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {sorted.map((item) => {
        const hasActions =
          item.capabilities.canDownload ||
          item.capabilities.canRename ||
          item.capabilities.canDelete
        const canOpen = canOpenItem(item)

        return (
          <div
            key={item.id}
            role={canOpen ? "button" : undefined}
            tabIndex={canOpen ? 0 : undefined}
            className={cn(
              "group relative flex min-w-0 flex-col items-center gap-2 rounded-lg border border-transparent p-3 transition-colors hover:border-border/50 hover:bg-muted/50",
              canOpen && "cursor-pointer"
            )}
            onClick={() => {
              if (canOpen) {
                handleOpenItem(item)
              }
            }}
            onKeyDown={(event) => {
              if (!canOpen) return
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                handleOpenItem(item)
              }
            }}
          >
            {/* Action menu — only show if the item has at least one action */}
            {hasActions && (
              <div
                className="absolute right-1.5 top-1.5"
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <FileContextMenu
                  item={item}
                  onRename={onRename}
                  onDelete={onDelete}
                  onDownload={onDownload}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 bg-card/80 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground"
                    aria-label={`${item.name} actions`}
                  >
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </FileContextMenu>
              </div>
            )}

            {/* Icon */}
            <div className="flex size-12 items-center justify-center">
              <FileIcon name={item.name} type={item.type} className="size-8" />
            </div>

            {/* Name */}
            <span
              className={cn(
                "line-clamp-2 w-full text-center text-xs leading-tight transition-colors wrap-break-word",
                canOpen && "group-hover:text-primary"
              )}
              title={item.name}
            >
              {item.name}
            </span>

            {/* Size (files only) */}
            {item.type === "file" && (
              <span className="text-[10px] text-muted-foreground">
                {formatBytes(Number(item.size) || 0, 1)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
