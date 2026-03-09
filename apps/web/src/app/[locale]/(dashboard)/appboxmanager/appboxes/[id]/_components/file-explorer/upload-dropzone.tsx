"use client"

import { useCallback, useState, type DragEvent } from "react"
import { useTranslations } from "next-intl"
import { Upload } from "lucide-react"

interface UploadDropzoneProps {
  children: React.ReactNode
  onDrop: (files: File[]) => void
  disabled?: boolean
}

export function UploadDropzone({
  children,
  onDrop,
  disabled
}: UploadDropzoneProps) {
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
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 backdrop-blur-sm">
          <Upload className="size-10 text-primary/70" />
          <p className="text-sm font-medium text-primary/70">
            {t("dropFilesHere")}
          </p>
        </div>
      )}
    </div>
  )
}
