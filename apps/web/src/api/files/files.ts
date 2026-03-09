import {
  serverApiDelete,
  serverApiGet,
  serverApiPost,
  serverApiUpload
} from "@/api/client"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface FileCapabilities {
  canAddChildren: boolean
  canCopy: boolean
  canDelete: boolean
  canDownload: boolean
  canEdit: boolean
  canListChildren: boolean
  canRemoveChildren: boolean
  canRename: boolean
}

export interface FileItem {
  id: string // base64-encoded path
  name: string
  type: "file" | "dir"
  size?: string
  createdTime: string
  modifiedTime: string
  parentId?: string
  capabilities: FileCapabilities
  ancestors?: FileAncestor[]
}

export interface FileAncestor {
  id: string
  name: string
  type: "dir"
  capabilities: FileCapabilities
  ancestors?: FileAncestor[]
}

export interface ListDirectoryResponse {
  items: FileItem[]
}

export interface UploadResponse {
  items: FileItem[]
}

/* -------------------------------------------------------------------------- */
/*  Root ID constant                                                           */
/* -------------------------------------------------------------------------- */

/** Base64-encoded "/" — the root resource ID for the file explorer */
export const ROOT_ID = btoa("/")

/* -------------------------------------------------------------------------- */
/*  API helper — builds the file-explorer endpoint prefix                      */
/* -------------------------------------------------------------------------- */

function encodeFileIdForPath(fileId: string): string {
  // Keep base64 padding "=" unescaped for backend route compatibility, while
  // still escaping path-breaking characters (e.g. "/" -> "%2F").
  return encodeURIComponent(fileId).replace(/%3D/gi, "=")
}

function filesEndpoint(
  cyloId: number,
  fileId: string,
  action?: string
): string {
  const encodedFileId = encodeFileIdForPath(fileId)
  const base = `files/${cyloId}/api/files/${encodedFileId}`
  return action ? `${base}/${action}` : base
}

/* -------------------------------------------------------------------------- */
/*  Read operations                                                            */
/* -------------------------------------------------------------------------- */

/** Get metadata for a file or directory */
export async function getFileInfo(
  serverName: string,
  cyloId: number,
  fileId: string
): Promise<FileItem> {
  return serverApiGet<FileItem>(serverName, filesEndpoint(cyloId, fileId))
}

/** List contents of a directory */
export async function listDirectory(
  serverName: string,
  cyloId: number,
  dirId: string
): Promise<ListDirectoryResponse> {
  return serverApiGet<ListDirectoryResponse>(
    serverName,
    filesEndpoint(cyloId, dirId, "children")
  )
}

/* -------------------------------------------------------------------------- */
/*  Write operations                                                           */
/* -------------------------------------------------------------------------- */

/** Create a new folder inside a parent directory */
export async function createFolder(
  serverName: string,
  cyloId: number,
  parentId: string,
  name: string
): Promise<FileItem> {
  return serverApiPost<FileItem>(
    serverName,
    filesEndpoint(cyloId, parentId, "mkdir"),
    { name }
  )
}

/** Upload one or more files to a parent directory */
export async function uploadFiles(
  serverName: string,
  cyloId: number,
  parentId: string,
  files: File[]
): Promise<UploadResponse> {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append("files[]", file)
  })
  return serverApiUpload<UploadResponse>(
    serverName,
    filesEndpoint(cyloId, parentId, "upload"),
    formData
  )
}

/** Rename a file or folder */
export async function renameItem(
  serverName: string,
  cyloId: number,
  itemId: string,
  newName: string
): Promise<FileItem> {
  return serverApiPost<FileItem>(
    serverName,
    filesEndpoint(cyloId, itemId, "rename"),
    { name: newName }
  )
}

/** Delete a file or folder */
export async function deleteItem(
  serverName: string,
  cyloId: number,
  itemId: string
): Promise<boolean> {
  return serverApiDelete<boolean>(serverName, filesEndpoint(cyloId, itemId))
}

/** Build the download URL for a file (used for anchor href or window.open) */
export function getDownloadUrl(
  serverName: string,
  cyloId: number,
  fileId: string
): string {
  const domain = process.env.NEXT_PUBLIC_DOMAIN || "appbox.co"
  return `https://fileexplorer.${serverName}.${domain}/v1/${filesEndpoint(cyloId, fileId, "download")}`
}
