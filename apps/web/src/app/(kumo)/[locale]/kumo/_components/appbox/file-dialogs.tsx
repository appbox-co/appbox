"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Input } from "@cloudflare/kumo"
import { ActionDialog } from "../ui/actions-dialog"

/*
 * The file explorer's three dialogs. `ActionDialog` supplies what the current
 * design's dialog gives them: Cancel beside the action, and Enter pressing
 * the action (or, while the action is unavailable, Cancel) from the field.
 */

/* -------------------------------------------------------------------------- */
/*  New folder                                                                 */
/* -------------------------------------------------------------------------- */

interface NewFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => void
  isPending: boolean
}

export function NewFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending
}: NewFolderDialogProps) {
  const t = useTranslations("appboxmanager.fileExplorer")
  const [name, setName] = useState("")

  function handleSubmit() {
    const trimmed = name.trim()
    if (trimmed) {
      onSubmit(trimmed)
      setName("")
    }
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setName("")
        onOpenChange(v)
      }}
      title={t("newFolderTitle")}
      description={t("newFolderDescription")}
      cancelLabel={t("cancel")}
      cancelDisabled={isPending}
      onCancel={() => onOpenChange(false)}
      confirmLabel={t("create")}
      confirmDisabled={isPending || !name.trim()}
      confirmLoading={isPending}
      onConfirm={handleSubmit}
    >
      <Input
        autoFocus
        className="w-full"
        aria-label={t("newFolderPlaceholder")}
        placeholder={t("newFolderPlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isPending}
      />
    </ActionDialog>
  )
}

/* -------------------------------------------------------------------------- */
/*  Rename                                                                     */
/* -------------------------------------------------------------------------- */

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

  // Sync name when dialog opens with a new item. Done while rendering, not in
  // an effect, so the field already holds the name when it mounts and takes
  // focus: the handler below selects from whatever is in it at that moment.
  const [synced, setSynced] = useState({ open, currentName })
  if (synced.open !== open || synced.currentName !== currentName) {
    setSynced({ open, currentName })
    if (open) setName(currentName)
  }

  function handleSubmit() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== currentName) {
      onSubmit(trimmed)
    }
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("renameTitle")}
      description={t("renameDescription")}
      cancelLabel={t("cancel")}
      cancelDisabled={isPending}
      onCancel={() => onOpenChange(false)}
      confirmLabel={t("save")}
      confirmDisabled={isPending || !name.trim() || name.trim() === currentName}
      confirmLoading={isPending}
      onConfirm={handleSubmit}
    >
      <Input
        autoFocus
        className="w-full"
        aria-label={t("renamePlaceholder")}
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
    </ActionDialog>
  )
}

/* -------------------------------------------------------------------------- */
/*  Delete                                                                     */
/* -------------------------------------------------------------------------- */

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  onConfirm: () => void
  isPending: boolean
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  isPending
}: DeleteConfirmDialogProps) {
  const t = useTranslations("appboxmanager.fileExplorer")

  return (
    <ActionDialog
      alert
      destructive
      open={open}
      onOpenChange={onOpenChange}
      title={t("deleteTitle")}
      description={t("deleteDescription", { name: itemName })}
      cancelLabel={t("cancel")}
      cancelDisabled={isPending}
      onCancel={() => onOpenChange(false)}
      confirmLabel={t("confirm")}
      confirmDisabled={isPending}
      confirmLoading={isPending}
      onConfirm={onConfirm}
    />
  )
}
