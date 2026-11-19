"use client"

import { useCallback, useState, type DragEvent } from "react"
import { useTranslations } from "next-intl"
import { UploadSimpleIcon } from "@phosphor-icons/react"

interface FileUploadDropzoneProps {
  children: React.ReactNode
  onDrop: (files: File[]) => void
  disabled?: boolean
}

/**
 * Wraps the file area so that files dragged onto it are uploaded to the
 * folder on show. While a drag is over it, a notice covers the files.
 */
export function FileUploadDropzone({
  children,
  onDrop,
  disabled
}: FileUploadDropzoneProps) {
  const t = useTranslations("appboxmanager.fileExplorer")
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onDrop(files)
      }
    },
    [disabled, onDrop]
  )

  return (
    <div
      className="relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {isDragging && (
        // Its lower corners follow the card's, which it reaches.
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-b-lg bg-kumo-base/90 ring-2 ring-kumo-brand ring-inset">
          <UploadSimpleIcon
            aria-hidden="true"
            size={40}
            className="text-kumo-subtle"
          />
          <p className="font-medium">{t("dropFilesHere")}</p>
        </div>
      )}
    </div>
  )
}
