"use client"

import { MoreHorizontal } from "lucide-react"
import type { FileItem } from "@/api/files/files"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/utils"
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-3">
      {sorted.map((item) => (
        <div
          key={item.id}
          className="group relative flex flex-col items-center gap-2 rounded-lg border border-transparent p-3 hover:bg-muted/50 hover:border-border/50 transition-colors cursor-default"
          onDoubleClick={() => {
            if (item.type === "dir") {
              onNavigate(item.id)
            }
          }}
        >
          {/* Action menu — only show if the item has at least one action */}
          {(item.capabilities.canDownload ||
            item.capabilities.canRename ||
            item.capabilities.canDelete) && (
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <FileContextMenu
                item={item}
                onRename={onRename}
                onDelete={onDelete}
                onDownload={onDownload}
              >
                <Button variant="ghost" size="icon" className="size-6">
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </FileContextMenu>
            </div>
          )}

          {/* Icon */}
          <div className="flex items-center justify-center size-12">
            <FileIcon name={item.name} type={item.type} className="size-8" />
          </div>

          {/* Name */}
          <button
            className="w-full text-center text-xs leading-tight truncate hover:text-primary transition-colors"
            onClick={() => {
              if (item.type === "dir") {
                onNavigate(item.id)
              }
            }}
            title={item.name}
          >
            {item.name}
          </button>

          {/* Size (files only) */}
          {item.type === "file" && (
            <span className="text-[10px] text-muted-foreground">
              {formatBytes(Number(item.size) || 0, 1)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
