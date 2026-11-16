import type {
  FileAncestor,
  FileCapabilities,
  FileItem,
  ListDirectoryResponse
} from "@/api/files/files"
import type { SampleHandler } from "./types"

/**
 * Sample files for an Appbox's file explorer.
 *
 * The explorer asks the Appbox server's file explorer host two things about
 * the folder on show, both with `serverApiGet`:
 *
 * - `files/{cyloId}/api/files/{id}`: the folder itself, with the folders
 *   above it (`ancestors`), for the breadcrumb and for whether it can be
 *   written to;
 * - `files/{cyloId}/api/files/{id}/children`: what is in it.
 *
 * `{id}` is the item's path, base64-encoded and then URL-encoded with the
 * padding left as it is (see `filesEndpoint` in `@/api/files/files`). Neither
 * answer is wrapped or mapped: the JSON is the `FileItem`, or the list of
 * them under `items`.
 *
 * Every Appbox gets the same small tree. It is three folders deep, has an
 * empty folder (`downloads/incomplete`) and a read-only one (`backups`), so
 * the explorer's empty state and its restricted menus can both be seen.
 */

/**
 * Whether sample files say they can be downloaded.
 *
 * A download is not a `fetch`: the explorer opens the file's address on the
 * file explorer host in a new tab (`window.open`), which the fetch guard
 * cannot catch. With this on, clicking a sample file, or "Download" in its
 * menu, opens `https://fileexplorer.<server>.<domain>/v1/files/…/download`
 * for a file that does not exist. Turn it off and sample files can no longer
 * be opened or downloaded, and nothing on the page leaves it.
 */
const SAMPLE_FILES_DOWNLOADABLE = false

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const KB = 1024
const MB = 1024 * KB
const GB = 1024 * MB

/** Ages are measured back from here, so they do not drift between requests. */
const LOADED_AT = Date.now()

function ago(age: number) {
  return new Date(LOADED_AT - age).toISOString()
}

interface SampleNode {
  name: string
  /** How long ago it last changed, in milliseconds. */
  age: number
  /** In bytes. Folders have none. */
  size?: number
  /** What a folder holds. Files have none. */
  children?: SampleNode[]
  /** A folder that, with everything in it, can be read but not changed. */
  readOnly?: boolean
}

function file(name: string, size: number, age: number): SampleNode {
  return { name, size: Math.round(size), age }
}

function folder(
  name: string,
  age: number,
  children: SampleNode[],
  readOnly = false
): SampleNode {
  return { name, age, children, readOnly }
}

const ROOT_PATH = "/"

const TREE: SampleNode = folder(ROOT_PATH, 26 * MINUTE, [
  folder(
    "backups",
    5 * DAY,
    [
      file("weekly-snapshot-1.tar.gz", 18.4 * GB, 12 * DAY),
      file("weekly-snapshot-2.tar.gz", 18.9 * GB, 5 * DAY)
    ],
    true
  ),
  folder("documents", 26 * MINUTE, [
    folder("invoices", 9 * DAY, [
      file("invoice-0041.pdf", 84 * KB, 40 * DAY),
      file("invoice-0042.pdf", 86 * KB, 9 * DAY)
    ]),
    file("budget.xlsx", 48 * KB, 3 * HOUR),
    file("floor-plan.png", 1.8 * MB, 61 * DAY),
    file("meeting-notes.md", 6.2 * KB, 2 * DAY),
    file("notes.txt", 2.1 * KB, 26 * MINUTE)
  ]),
  folder("downloads", 35 * MINUTE, [
    folder("incomplete", 35 * MINUTE, []),
    file("holiday-photos.zip", 1.3 * GB, 3 * DAY),
    file("site-backup.tar.gz", 742 * MB, 20 * DAY),
    file("ubuntu-24.04.1-live-server-amd64.iso", 2.6 * GB, 6 * DAY)
  ]),
  folder("media", 1 * DAY, [
    folder("films", 1 * DAY, [
      folder("Big Buck Bunny (2008)", 30 * DAY, [
        file("Big Buck Bunny (2008) 1080p.mkv", 886 * MB, 30 * DAY),
        file("Big Buck Bunny (2008) 1080p.en.srt", 3.4 * KB, 30 * DAY),
        file("poster.jpg", 412 * KB, 30 * DAY)
      ]),
      file("Sintel (2010) 2160p.mkv", 5.7 * GB, 14 * DAY),
      file("Tears of Steel (2012) 1080p.mp4", 1.9 * GB, 1 * DAY)
    ]),
    folder("music", 8 * DAY, [
      folder("Field recordings", 95 * DAY, [
        file("Harbour at dawn.flac", 187 * MB, 95 * DAY),
        file("Rain on a tin roof.flac", 212 * MB, 95 * DAY),
        file("cover.png", 2.1 * MB, 95 * DAY)
      ]),
      file("Lofi sessions vol. 1.mp3", 96 * MB, 8 * DAY),
      file("Morning playlist.m3u", 1.2 * KB, 21 * DAY)
    ])
  ]),
  file("docker-compose.yml", 1.4 * KB, 17 * DAY),
  file("welcome.txt", 512, 400 * DAY)
])

/** One item of the tree, with where it is and what is above it. */
interface Entry {
  node: SampleNode
  path: string
  parent: Entry | null
  /** Its own flag, or that of a folder above it. */
  readOnly: boolean
  children: Entry[]
}

const ENTRIES = new Map<string, Entry>()

function index(node: SampleNode, parent: Entry | null): Entry {
  const path = !parent
    ? ROOT_PATH
    : parent.path === ROOT_PATH
      ? `/${node.name}`
      : `${parent.path}/${node.name}`
  const entry: Entry = {
    node,
    path,
    parent,
    readOnly: Boolean(node.readOnly) || Boolean(parent?.readOnly),
    children: []
  }
  ENTRIES.set(path, entry)
  entry.children = (node.children ?? []).map((child) => index(child, entry))
  return entry
}

index(TREE, null)

/** An item's id: its path in base64, as `ROOT_ID` is for "/". */
function idOf(entry: Entry) {
  return btoa(entry.path)
}

function isFolder(entry: Entry) {
  return entry.node.children !== undefined
}

function capabilitiesOf(entry: Entry): FileCapabilities {
  const writable = !entry.readOnly
  // The root can be added to, but not renamed or removed.
  const removable = writable && entry.parent !== null

  if (isFolder(entry)) {
    return {
      canAddChildren: writable,
      canCopy: entry.parent !== null,
      canDelete: removable,
      canDownload: false,
      canEdit: false,
      canListChildren: true,
      canRemoveChildren: writable,
      canRename: removable
    }
  }
  return {
    canAddChildren: false,
    canCopy: true,
    canDelete: removable,
    canDownload: SAMPLE_FILES_DOWNLOADABLE,
    canEdit: false,
    canListChildren: false,
    canRemoveChildren: false,
    canRename: removable
  }
}

/**
 * The folders above an item, from the root down to its parent. Each carries
 * its own ancestors in turn, as the server sends them.
 */
function ancestorsOf(entry: Entry): FileAncestor[] {
  if (!entry.parent) return []
  const parent = entry.parent
  return [
    ...ancestorsOf(parent),
    {
      id: idOf(parent),
      name: parent.node.name,
      type: "dir",
      capabilities: capabilitiesOf(parent),
      ancestors: ancestorsOf(parent)
    }
  ]
}

/** An item as it appears in its folder's listing. */
function itemOf(entry: Entry): FileItem {
  const { node } = entry
  return {
    id: idOf(entry),
    name: node.name,
    type: isFolder(entry) ? "dir" : "file",
    // The server gives sizes as strings of bytes.
    ...(node.size !== undefined && { size: String(node.size) }),
    // Nothing here was made long before it was last changed.
    createdTime: ago(node.age + 2 * HOUR),
    modifiedTime: ago(node.age),
    ...(entry.parent && { parentId: idOf(entry.parent) }),
    capabilities: capabilitiesOf(entry)
  }
}

/** `files/{cyloId}/api/files/{id}`, with or without `/children`. */
const ROUTE = /^files\/\d+\/api\/files\/([^/]+)(\/children)?$/

/** The entry an id from the address stands for, if the tree has it. */
function entryFor(encodedId: string): Entry | undefined {
  try {
    const path = atob(decodeURIComponent(encodedId))
    // "/media/" and "/media" are the same folder.
    return ENTRIES.get(path.replace(/(.)\/+$/, "$1"))
  } catch {
    // Not base64, so not an id of ours.
    return undefined
  }
}

export const filesSamples: SampleHandler = ({ target, method, path }) => {
  if (target !== "server" || method.toUpperCase() !== "GET") return undefined

  const match = path.match(ROUTE)
  if (!match) return undefined

  const entry = entryFor(match[1])

  if (match[2]) {
    // A file, or a folder the tree does not have, lists as empty.
    const listing: ListDirectoryResponse = {
      items: (entry?.children ?? []).map(itemOf)
    }
    return listing
  }

  if (!entry) return undefined
  const info: FileItem = { ...itemOf(entry), ancestors: ancestorsOf(entry) }
  return info
}
