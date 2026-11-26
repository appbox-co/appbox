"use client"

import type { FileItem } from "@/api/files/files"
import { formatBytes } from "@/lib/utils/format"
import { FileActionsMenu, hasFileActions } from "./file-actions-menu"
import { FileTypeIcon } from "./file-icon"

interface FileGridProps {
  items: FileItem[]
  onNavigate: (id: string) => void
  onRename: (item: FileItem) => void
  onDelete: (item: FileItem) => void
  onDownload: (item: FileItem) => void
}

/** A tile's surface, whether or not it can be opened. */
const TILE =
  "flex h-full w-full min-w-0 flex-col items-center gap-2 rounded-xl bg-kumo-base p-3 ring ring-kumo-hairline"

/**
 * The folder's contents as tiles: folders first, then files, by name. A tile
 * opens its folder, or downloads its file, when clicked.
 */
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
    // The container the number of columns responds to.
    <div className="@container">
      <ul className="grid list-none grid-cols-2 gap-3 p-3 @lg:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-5 @6xl:grid-cols-6">
        {sorted.map((item) => {
          const canOpen = canOpenItem(item)

          const body = (
            <>
              {/* Icon */}
              <span className="flex size-12 items-center justify-center">
                <FileTypeIcon name={item.name} type={item.type} size={32} />
              </span>

              {/* Name */}
              <span className="line-clamp-2 w-full text-center leading-tight wrap-break-word">
                {item.name}
              </span>

              {/* Size (files only) */}
              {item.type === "file" && (
                <span className="text-xs text-kumo-subtle tabular-nums">
                  {formatBytes(Number(item.size) || 0, 1)}
                </span>
              )}
            </>
          )

          return (
            <li key={item.id} className="relative min-w-0">
              {canOpen ? (
                <button
                  type="button"
                  title={item.name}
                  className={`${TILE} cursor-pointer hover:bg-kumo-tint focus-visible:outline-2 focus-visible:outline-kumo-brand`}
                  onClick={() => handleOpenItem(item)}
                >
                  {body}
                </button>
              ) : (
                <div title={item.name} className={TILE}>
                  {body}
                </div>
              )}

              {/* Action menu — only show if the item has at least one action.
                  It sits beside the tile's button, not inside it, so neither
                  a click nor a key press on it opens the item. */}
              {hasFileActions(item) && (
                <div className="absolute end-1.5 top-1.5">
                  <FileActionsMenu
                    item={item}
                    onRename={onRename}
                    onDelete={onDelete}
                    onDownload={onDownload}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
