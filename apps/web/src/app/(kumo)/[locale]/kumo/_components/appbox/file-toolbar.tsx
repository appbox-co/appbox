"use client"

import { useRef } from "react"
import { useTranslations } from "next-intl"
import { Button, ButtonGroup, Tooltip } from "@cloudflare/kumo"
import {
  FolderPlusIcon,
  ListBulletsIcon,
  SquaresFourIcon,
  UploadSimpleIcon,
  type Icon
} from "@phosphor-icons/react"

/** Prototype-only copy, in English and sentence case. */
const COPY = {
  view: "View"
}

export type FileViewMode = "list" | "grid"

interface FileToolbarProps {
  viewMode: FileViewMode
  onViewModeChange: (mode: FileViewMode) => void
  onNewFolder: () => void
  onUpload: (files: FileList) => void
  canWrite: boolean
}

/** One half of the list / grid switch. */
function ViewButton({
  label,
  icon,
  pressed,
  onClick
}: {
  label: string
  icon: Icon
  pressed: boolean
  onClick: () => void
}) {
  return (
    <Tooltip
      content={label}
      render={
        <Button
          size="sm"
          shape="square"
          icon={icon}
          aria-label={label}
          aria-pressed={pressed}
          className={
            pressed ? "bg-kumo-fill not-disabled:hover:bg-kumo-fill" : undefined
          }
          onClick={onClick}
        />
      }
    />
  )
}

/**
 * The file explorer's controls, for the header of its card: upload and new
 * folder where the folder on show can be written to, and the view switch.
 */
export function FileToolbar({
  viewMode,
  onViewModeChange,
  onNewFolder,
  onUpload,
  canWrite
}: FileToolbarProps) {
  const t = useTranslations("appboxmanager.fileExplorer")
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      {canWrite && (
        <>
          {/* On a phone the labels would leave the card's title no room, so
              only the icons show; the labels stay for screen readers. */}
          <Button
            size="sm"
            icon={UploadSimpleIcon}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="max-sm:sr-only">{t("upload")}</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUpload(e.target.files)
                // Reset so the same file can be selected again
                e.target.value = ""
              }
            }}
          />
          <Button size="sm" icon={FolderPlusIcon} onClick={onNewFolder}>
            <span className="max-sm:sr-only">{t("newFolder")}</span>
          </Button>
        </>
      )}

      <ButtonGroup aria-label={COPY.view}>
        <ViewButton
          label={t("listView")}
          icon={ListBulletsIcon}
          pressed={viewMode === "list"}
          onClick={() => onViewModeChange("list")}
        />
        <ViewButton
          label={t("gridView")}
          icon={SquaresFourIcon}
          pressed={viewMode === "grid"}
          onClick={() => onViewModeChange("grid")}
        />
      </ButtonGroup>
    </>
  )
}
