"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import {
  createFolder,
  deleteItem,
  getFileInfo,
  listDirectory,
  renameItem,
  uploadFiles
} from "../files"

/* -------------------------------------------------------------------------- */
/*  Queries                                                                    */
/* -------------------------------------------------------------------------- */

export function useFileInfo(
  serverName: string | undefined,
  cyloId: number,
  fileId: string
) {
  return useQuery({
    queryKey: queryKeys.files.info(cyloId, fileId),
    queryFn: () => getFileInfo(serverName!, cyloId, fileId),
    enabled: !!serverName && cyloId > 0
  })
}

export function useDirectoryChildren(
  serverName: string | undefined,
  cyloId: number,
  dirId: string
) {
  return useQuery({
    queryKey: queryKeys.files.children(cyloId, dirId),
    queryFn: () => listDirectory(serverName!, cyloId, dirId),
    enabled: !!serverName && cyloId > 0
  })
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                  */
/* -------------------------------------------------------------------------- */

/** Invalidate the current directory listing after any mutation */
function useInvalidateDirectory() {
  const queryClient = useQueryClient()
  return (cyloId: number, parentId: string) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.files.children(cyloId, parentId)
    })
  }
}

export function useCreateFolder(
  serverName: string | undefined,
  cyloId: number
) {
  const invalidate = useInvalidateDirectory()

  return useMutation({
    mutationFn: ({ parentId, name }: { parentId: string; name: string }) =>
      createFolder(serverName!, cyloId, parentId, name),
    onSuccess: (_data, variables) => {
      invalidate(cyloId, variables.parentId)
    }
  })
}

export function useUploadFiles(serverName: string | undefined, cyloId: number) {
  const invalidate = useInvalidateDirectory()

  return useMutation({
    mutationFn: ({ parentId, files }: { parentId: string; files: File[] }) =>
      uploadFiles(serverName!, cyloId, parentId, files),
    onSuccess: (_data, variables) => {
      invalidate(cyloId, variables.parentId)
    }
  })
}

export function useRenameItem(serverName: string | undefined, cyloId: number) {
  const invalidate = useInvalidateDirectory()

  return useMutation({
    mutationFn: ({
      itemId,
      newName,
      parentId: _parentId
    }: {
      itemId: string
      newName: string
      parentId: string
    }) => renameItem(serverName!, cyloId, itemId, newName),
    onSuccess: (_data, variables) => {
      invalidate(cyloId, variables.parentId)
    }
  })
}

export function useDeleteItem(serverName: string | undefined, cyloId: number) {
  const invalidate = useInvalidateDirectory()

  return useMutation({
    mutationFn: ({
      itemId,
      parentId: _parentId
    }: {
      itemId: string
      parentId: string
    }) => deleteItem(serverName!, cyloId, itemId),
    onSuccess: (_data, variables) => {
      invalidate(cyloId, variables.parentId)
    }
  })
}
