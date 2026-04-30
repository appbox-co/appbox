"use client"

import { useRef } from "react"
import { useTranslations } from "next-intl"
import { FolderPlus, LayoutGrid, List, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

interface FileToolbarProps {
  viewMode: "list" | "grid"
  onViewModeChange: (mode: "list" | "grid") => void
  onNewFolder: () => void
  onUpload: (files: FileList) => void
  canWrite: boolean
}

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
    <TooltipProvider delayDuration={300}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {canWrite && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4 mr-1.5" />
              {t("upload")}
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
            <Button variant="outline" size="sm" onClick={onNewFolder}>
              <FolderPlus className="size-4 mr-1.5" />
              {t("newFolder")}
            </Button>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="size-8"
                onClick={() => onViewModeChange("list")}
              >
                <List className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("listView")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="size-8"
                onClick={() => onViewModeChange("grid")}
              >
                <LayoutGrid className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("gridView")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
