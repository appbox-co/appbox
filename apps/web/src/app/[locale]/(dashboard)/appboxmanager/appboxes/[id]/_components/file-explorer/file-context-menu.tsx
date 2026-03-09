"use client"

import { useTranslations } from "next-intl"
import { Download, Pencil, Trash2 } from "lucide-react"
import type { FileItem } from "@/api/files/files"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface FileContextMenuProps {
  item: FileItem
  children: React.ReactNode
  onRename: (item: FileItem) => void
  onDelete: (item: FileItem) => void
  onDownload: (item: FileItem) => void
}

export function FileContextMenu({
  item,
  children,
  onRename,
  onDelete,
  onDownload
}: FileContextMenuProps) {
  const t = useTranslations("appboxmanager.fileExplorer")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {item.capabilities.canDownload && (
          <DropdownMenuItem onClick={() => onDownload(item)}>
            <Download className="size-4 mr-2" />
            {t("download")}
          </DropdownMenuItem>
        )}
        {item.capabilities.canRename && (
          <DropdownMenuItem onClick={() => onRename(item)}>
            <Pencil className="size-4 mr-2" />
            {t("rename")}
          </DropdownMenuItem>
        )}
        {(item.capabilities.canDownload || item.capabilities.canRename) &&
          item.capabilities.canDelete && <DropdownMenuSeparator />}
        {item.capabilities.canDelete && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="size-4 mr-2" />
            {t("delete")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
