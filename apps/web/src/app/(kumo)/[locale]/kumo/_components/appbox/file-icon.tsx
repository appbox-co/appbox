"use client"

import { cn } from "@cloudflare/kumo"
import {
  FileArchiveIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileCsvIcon,
  FileIcon,
  FileImageIcon,
  FileTextIcon,
  FileVideoIcon,
  FileXlsIcon,
  FolderIcon,
  type Icon
} from "@phosphor-icons/react"

const extensionIconMap: Record<string, Icon> = {
  // Documents
  txt: FileTextIcon,
  md: FileTextIcon,
  pdf: FileTextIcon,
  doc: FileTextIcon,
  docx: FileTextIcon,
  odt: FileTextIcon,
  rtf: FileTextIcon,
  // Spreadsheets
  xls: FileXlsIcon,
  xlsx: FileXlsIcon,
  csv: FileCsvIcon,
  ods: FileXlsIcon,
  // Images
  jpg: FileImageIcon,
  jpeg: FileImageIcon,
  png: FileImageIcon,
  gif: FileImageIcon,
  svg: FileImageIcon,
  webp: FileImageIcon,
  bmp: FileImageIcon,
  ico: FileImageIcon,
  // Video
  mp4: FileVideoIcon,
  mkv: FileVideoIcon,
  avi: FileVideoIcon,
  mov: FileVideoIcon,
  wmv: FileVideoIcon,
  flv: FileVideoIcon,
  webm: FileVideoIcon,
  // Audio
  mp3: FileAudioIcon,
  wav: FileAudioIcon,
  ogg: FileAudioIcon,
  flac: FileAudioIcon,
  aac: FileAudioIcon,
  wma: FileAudioIcon,
  // Code
  js: FileCodeIcon,
  ts: FileCodeIcon,
  jsx: FileCodeIcon,
  tsx: FileCodeIcon,
  py: FileCodeIcon,
  rb: FileCodeIcon,
  go: FileCodeIcon,
  rs: FileCodeIcon,
  java: FileCodeIcon,
  php: FileCodeIcon,
  c: FileCodeIcon,
  cpp: FileCodeIcon,
  h: FileCodeIcon,
  css: FileCodeIcon,
  scss: FileCodeIcon,
  html: FileCodeIcon,
  xml: FileCodeIcon,
  json: FileCodeIcon,
  yaml: FileCodeIcon,
  yml: FileCodeIcon,
  toml: FileCodeIcon,
  sh: FileCodeIcon,
  bash: FileCodeIcon,
  sql: FileCodeIcon,
  // Archives
  zip: FileArchiveIcon,
  tar: FileArchiveIcon,
  gz: FileArchiveIcon,
  bz2: FileArchiveIcon,
  xz: FileArchiveIcon,
  "7z": FileArchiveIcon,
  rar: FileArchiveIcon
}

function getExtension(name: string): string {
  const parts = name.split(".")
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : ""
}

interface FileTypeIconProps {
  name: string
  type: "file" | "dir"
  /** Pixels. The list uses the default; grid tiles ask for a larger one. */
  size?: number
  className?: string
}

/** A folder, or the icon for a file's kind, chosen by its extension. */
export function FileTypeIcon({
  name,
  type,
  size = 20,
  className
}: FileTypeIconProps) {
  if (type === "dir") {
    return (
      <FolderIcon
        aria-hidden="true"
        size={size}
        weight="fill"
        className={cn("text-kumo-subtle", className)}
      />
    )
  }

  const ext = getExtension(name)
  const TypeIcon = extensionIconMap[ext] ?? FileIcon

  return (
    <TypeIcon
      aria-hidden="true"
      size={size}
      className={cn("text-kumo-subtle", className)}
    />
  )
}
