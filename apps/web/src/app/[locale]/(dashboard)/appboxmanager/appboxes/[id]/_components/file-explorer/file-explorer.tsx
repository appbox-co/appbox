"use client"

import { useCallback, useState } from "react"
import { useTranslations } from "next-intl"
import { FolderOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getDownloadUrl, ROOT_ID, type FileItem } from "@/api/files/files"
import {
  useCreateFolder,
  useDeleteItem,
  useDirectoryChildren,
  useFileInfo,
  useRenameItem,
  useUploadFiles
} from "@/api/files/hooks/use-files"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { FileBreadcrumb } from "./file-breadcrumb"
import { FileGrid } from "./file-grid"
import { FileList } from "./file-list"
import { FileToolbar } from "./file-toolbar"
import { NewFolderDialog } from "./new-folder-dialog"
import { RenameDialog } from "./rename-dialog"
import { UploadDropzone } from "./upload-dropzone"

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface FileExplorerProps {
  cyloId: number
  serverName: string | undefined
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function FileExplorer({ cyloId, serverName }: FileExplorerProps) {
  const t = useTranslations("appboxmanager.fileExplorer")

  // Navigation state
  const [currentDirId, setCurrentDirId] = useState(ROOT_ID)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  // Dialog state
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [renameItem, setRenameItem] = useState<FileItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<FileItem | null>(null)

  // Queries
  const { data: dirInfo } = useFileInfo(serverName, cyloId, currentDirId)

  const {
    data: dirChildren,
    isLoading,
    error
  } = useDirectoryChildren(serverName, cyloId, currentDirId)

  // Mutations
  const createFolder = useCreateFolder(serverName, cyloId)
  const uploadFiles = useUploadFiles(serverName, cyloId)
  const renameMutation = useRenameItem(serverName, cyloId)
  const deleteMutation = useDeleteItem(serverName, cyloId)

  // Derived state
  const items = dirChildren?.items ?? []
  const canWrite = dirInfo?.capabilities?.canAddChildren ?? false

  /* ---------------------------------------------------------------------- */
  /*  Navigation                                                             */
  /* ---------------------------------------------------------------------- */

  const handleNavigate = useCallback((id: string) => {
    setCurrentDirId(id)
  }, [])

  /* ---------------------------------------------------------------------- */
  /*  Actions                                                                */
  /* ---------------------------------------------------------------------- */

  const handleCreateFolder = useCallback(
    (name: string) => {
      createFolder.mutate(
        { parentId: currentDirId, name },
        {
          onSuccess: () => {
            toast.success(t("createFolderSuccess"))
            setNewFolderOpen(false)
          },
          onError: () => {
            toast.error(t("createFolderError"))
          }
        }
      )
    },
    [createFolder, currentDirId, t]
  )

  const handleUpload = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList)
      toast.info(t("uploading"))

      uploadFiles.mutate(
        { parentId: currentDirId, files },
        {
          onSuccess: () => {
            toast.success(t("uploadSuccess"))
          },
          onError: () => {
            toast.error(t("uploadError"))
          }
        }
      )
    },
    [uploadFiles, currentDirId, t]
  )

  const handleRename = useCallback(
    (newName: string) => {
      if (!renameItem) return
      renameMutation.mutate(
        {
          itemId: renameItem.id,
          newName,
          parentId: renameItem.parentId ?? currentDirId
        },
        {
          onSuccess: () => {
            toast.success(t("renameSuccess"))
            setRenameItem(null)
          },
          onError: () => {
            toast.error(t("renameError"))
          }
        }
      )
    },
    [renameMutation, renameItem, currentDirId, t]
  )

  const handleDelete = useCallback(() => {
    if (!deleteItem) return
    deleteMutation.mutate(
      {
        itemId: deleteItem.id,
        parentId: deleteItem.parentId ?? currentDirId
      },
      {
        onSuccess: () => {
          toast.success(t("deleteSuccess"))
          setDeleteItem(null)
        },
        onError: () => {
          toast.error(t("deleteError"))
        }
      }
    )
  }, [deleteMutation, deleteItem, currentDirId, t])

  const handleDownload = useCallback(
    (item: FileItem) => {
      if (!serverName) return
      const url = getDownloadUrl(serverName, cyloId, item.id)
      window.open(url, "_blank")
    },
    [serverName, cyloId]
  )

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                 */
  /* ---------------------------------------------------------------------- */

  if (!serverName) {
    return null
  }

  return (
    <>
      <Card className="min-w-0 overflow-hidden">
        <CardContent className="p-0">
          {/* Breadcrumb + Toolbar */}
          <div className="min-w-0 space-y-3 border-b px-4 py-3">
            <FileBreadcrumb
              ancestors={dirInfo?.ancestors ?? []}
              currentName={dirInfo?.name ?? "/"}
              onNavigate={handleNavigate}
            />
            <FileToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onNewFolder={() => setNewFolderOpen(true)}
              onUpload={handleUpload}
              canWrite={canWrite}
            />
          </div>

          {/* Content */}
          <UploadDropzone
            onDrop={handleUpload}
            disabled={!canWrite || uploadFiles.isPending}
          >
            <div className="min-h-[400px] min-w-0 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-sm text-destructive">
                    Failed to load directory contents.
                  </p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                  <FolderOpen className="size-12 text-muted-foreground/30" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("emptyDirectory")}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {t("emptyDirectoryDescription")}
                    </p>
                  </div>
                </div>
              ) : viewMode === "list" ? (
                <FileList
                  items={items}
                  onNavigate={handleNavigate}
                  onRename={setRenameItem}
                  onDelete={setDeleteItem}
                  onDownload={handleDownload}
                />
              ) : (
                <FileGrid
                  items={items}
                  onNavigate={handleNavigate}
                  onRename={setRenameItem}
                  onDelete={setDeleteItem}
                  onDownload={handleDownload}
                />
              )}
            </div>
          </UploadDropzone>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NewFolderDialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        onSubmit={handleCreateFolder}
        isPending={createFolder.isPending}
      />

      <RenameDialog
        open={renameItem !== null}
        onOpenChange={(open) => {
          if (!open) setRenameItem(null)
        }}
        currentName={renameItem?.name ?? ""}
        onSubmit={handleRename}
        isPending={renameMutation.isPending}
      />

      <DeleteConfirmDialog
        open={deleteItem !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null)
        }}
        itemName={deleteItem?.name ?? ""}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
