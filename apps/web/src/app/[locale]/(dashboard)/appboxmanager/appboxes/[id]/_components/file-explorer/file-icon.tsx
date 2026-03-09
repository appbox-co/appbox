"use client"

import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

const extensionIconMap: Record<string, LucideIcon> = {
  // Documents
  txt: FileText,
  md: FileText,
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  odt: FileText,
  rtf: FileText,
  // Spreadsheets
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  ods: FileSpreadsheet,
  // Images
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  svg: FileImage,
  webp: FileImage,
  bmp: FileImage,
  ico: FileImage,
  // Video
  mp4: FileVideo,
  mkv: FileVideo,
  avi: FileVideo,
  mov: FileVideo,
  wmv: FileVideo,
  flv: FileVideo,
  webm: FileVideo,
  // Audio
  mp3: FileAudio,
  wav: FileAudio,
  ogg: FileAudio,
  flac: FileAudio,
  aac: FileAudio,
  wma: FileAudio,
  // Code
  js: FileCode,
  ts: FileCode,
  jsx: FileCode,
  tsx: FileCode,
  py: FileCode,
  rb: FileCode,
  go: FileCode,
  rs: FileCode,
  java: FileCode,
  php: FileCode,
  c: FileCode,
  cpp: FileCode,
  h: FileCode,
  css: FileCode,
  scss: FileCode,
  html: FileCode,
  xml: FileCode,
  json: FileCode,
  yaml: FileCode,
  yml: FileCode,
  toml: FileCode,
  sh: FileCode,
  bash: FileCode,
  sql: FileCode,
  // Archives
  zip: FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  bz2: FileArchive,
  xz: FileArchive,
  "7z": FileArchive,
  rar: FileArchive
}

function getExtension(name: string): string {
  const parts = name.split(".")
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : ""
}

interface FileIconProps {
  name: string
  type: "file" | "dir"
  className?: string
}

export function FileIcon({ name, type, className }: FileIconProps) {
  if (type === "dir") {
    return <Folder className={cn("size-5 text-blue-400", className)} />
  }

  const ext = getExtension(name)
  const Icon = extensionIconMap[ext] ?? File

  return <Icon className={cn("size-5 text-muted-foreground", className)} />
}
