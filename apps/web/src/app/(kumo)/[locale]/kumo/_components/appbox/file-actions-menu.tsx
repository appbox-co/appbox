"use client"

import { useTranslations } from "next-intl"
import { Button, DropdownMenu } from "@cloudflare/kumo"
import {
  DotsThreeIcon,
  DownloadSimpleIcon,
  PencilSimpleIcon,
  TrashIcon
} from "@phosphor-icons/react"
import type { FileItem } from "@/api/files/files"

/** Whether the server allows anything in the menu for this item. */
export function hasFileActions(item: FileItem) {
  return (
    item.capabilities.canDownload ||
    item.capabilities.canRename ||
    item.capabilities.canDelete
  )
}

interface FileActionsMenuProps {
  item: FileItem
  onRename: (item: FileItem) => void
  onDelete: (item: FileItem) => void
  onDownload: (item: FileItem) => void
}

/**
 * The "…" button of a file or folder and its menu: download, rename and
 * delete, each shown only when the server allows it for that item.
 */
export function FileActionsMenu({
  item,
  onRename,
  onDelete,
  onDownload
}: FileActionsMenuProps) {
  const t = useTranslations("appboxmanager.fileExplorer")

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={
          <Button
            variant="ghost"
            size="sm"
            shape="square"
            icon={DotsThreeIcon}
            aria-label={`${item.name} actions`}
          />
        }
      />
      <DropdownMenu.Content align="end">
        {item.capabilities.canDownload && (
          <DropdownMenu.Item
            icon={DownloadSimpleIcon}
            onClick={() => onDownload(item)}
          >
            {t("download")}
          </DropdownMenu.Item>
        )}
        {item.capabilities.canRename && (
          <DropdownMenu.Item
            icon={PencilSimpleIcon}
            onClick={() => onRename(item)}
          >
            {t("rename")}
          </DropdownMenu.Item>
        )}
        {item.capabilities.canDelete && (
          <DropdownMenu.Item
            icon={TrashIcon}
            variant="danger"
            onClick={() => onDelete(item)}
          >
            {t("delete")}
          </DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
