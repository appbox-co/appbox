"use client"

import { useCallback, useState } from "react"
import { useTranslations } from "next-intl"
import { Banner, Empty, Loader } from "@cloudflare/kumo"
import { FolderOpenIcon, WarningCircleIcon } from "@phosphor-icons/react"
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
import { Panel } from "../panel"
import { EMPTY_IN_CARD } from "../shared"
import { FileBreadcrumb } from "./file-breadcrumb"
import {
  DeleteConfirmDialog,
  NewFolderDialog,
  RenameDialog
} from "./file-dialogs"
import { FileGrid } from "./file-grid"
import { FileList } from "./file-list"
import { FileToolbar, type FileViewMode } from "./file-toolbar"
import { FileUploadDropzone } from "./file-upload-dropzone"

/**
 * Prototype-only copy, in English and sentence case. The failure message is
 * the current design's own, which is not translated either.
 */
const COPY = {
  loading: "Loading files",
  loadFailed: "Failed to load directory contents."
}

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

/**
 * The files of one Appbox: browse its folders as a list or a grid, upload by
 * button or by dropping files on the list, and create, rename, delete and
 * download. The server says, item by item, which of those are allowed.
 */
export function FileExplorer({ cyloId, serverName }: FileExplorerProps) {
  const t = useTranslations("appboxmanager.fileExplorer")

  // Navigation state
  const [currentDirId, setCurrentDirId] = useState(ROOT_ID)
  const [viewMode, setViewMode] = useState<FileViewMode>("list")

  // Dialog state. The item of a dialog outlives the dialog's closing, so that
  // its name is still there to show while the dialog animates away.
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [renameItem, setRenameItem] = useState<FileItem | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<FileItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

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
            setRenameOpen(false)
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
          setDeleteOpen(false)
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

  const requestRename = useCallback((item: FileItem) => {
    setRenameItem(item)
    setRenameOpen(true)
  }, [])

  const requestDelete = useCallback((item: FileItem) => {
    setDeleteItem(item)
    setDeleteOpen(true)
  }, [])

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                 */
  /* ---------------------------------------------------------------------- */

  if (!serverName) {
    return null
  }

  return (
    <>
      <Panel
        title={t("title")}
        flush
        action={
          <FileToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onNewFolder={() => setNewFolderOpen(true)}
            onUpload={handleUpload}
            canWrite={canWrite}
          />
        }
      >
        <div className="grid min-w-0 grid-cols-1">
          {/* Breadcrumb */}
          <div className="min-w-0 border-b border-kumo-hairline px-3 py-2">
            <FileBreadcrumb
              ancestors={dirInfo?.ancestors ?? []}
              currentName={dirInfo?.name ?? "/"}
              onNavigate={handleNavigate}
            />
          </div>

          {/* Content */}
          <FileUploadDropzone
            onDrop={handleUpload}
            disabled={!canWrite || uploadFiles.isPending}
          >
            <div className="min-h-100 min-w-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader aria-label={COPY.loading} />
                </div>
              ) : error ? (
                <div className="p-4">
                  <Banner
                    variant="error"
                    icon={<WarningCircleIcon weight="fill" />}
                    title={COPY.loadFailed}
                  />
                </div>
              ) : items.length === 0 ? (
                <Empty
                  className={EMPTY_IN_CARD}
                  icon={<FolderOpenIcon size={40} />}
                  title={t("emptyDirectory")}
                  description={t("emptyDirectoryDescription")}
                />
              ) : viewMode === "list" ? (
                <FileList
                  items={items}
                  onNavigate={handleNavigate}
                  onRename={requestRename}
                  onDelete={requestDelete}
                  onDownload={handleDownload}
                />
              ) : (
                <FileGrid
                  items={items}
                  onNavigate={handleNavigate}
                  onRename={requestRename}
                  onDelete={requestDelete}
                  onDownload={handleDownload}
                />
              )}
            </div>
          </FileUploadDropzone>
        </div>
      </Panel>

      {/* Dialogs */}
      <NewFolderDialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        onSubmit={handleCreateFolder}
        isPending={createFolder.isPending}
      />

      <RenameDialog
        open={renameOpen}
        onOpenChange={(open) => {
          if (!open) setRenameOpen(false)
        }}
        currentName={renameItem?.name ?? ""}
        onSubmit={handleRename}
        isPending={renameMutation.isPending}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteOpen(false)
        }}
        itemName={deleteItem?.name ?? ""}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
