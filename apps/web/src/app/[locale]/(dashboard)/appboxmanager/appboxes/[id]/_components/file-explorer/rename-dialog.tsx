"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  onSubmit: (newName: string) => void
  isPending: boolean
}

export function RenameDialog({
  open,
  onOpenChange,
  currentName,
  onSubmit,
  isPending
}: RenameDialogProps) {
  const t = useTranslations("appboxmanager.fileExplorer")
  const [name, setName] = useState(currentName)

  // Sync name when dialog opens with a new item
  useEffect(() => {
    if (open) {
      queueMicrotask(() => setName(currentName))
    }
  }, [open, currentName])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed && trimmed !== currentName) {
      onSubmit(trimmed)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("renameTitle")}</DialogTitle>
            <DialogDescription>{t("renameDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              autoFocus
              placeholder={t("renamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              onFocus={(e) => {
                // Select the filename portion (before the extension)
                const dotIndex = e.target.value.lastIndexOf(".")
                if (dotIndex > 0) {
                  e.target.setSelectionRange(0, dotIndex)
                } else {
                  e.target.select()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                isPending || !name.trim() || name.trim() === currentName
              }
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
