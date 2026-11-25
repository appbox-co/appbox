"use client"

import { useRef, type KeyboardEvent, type ReactNode } from "react"
import { Banner, Button, Dialog } from "@cloudflare/kumo"
import { WarningCircleIcon } from "@phosphor-icons/react"

/**
 * The dialog an action confirms in, on an installed app or an Appbox's files:
 * a title, what will happen, an optional form, and Cancel beside the action.
 */
export function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  error,
  wide = false,
  alert = false,
  cancelLabel,
  cancelDisabled,
  onCancel,
  confirmLabel,
  confirmDisabled,
  confirmLoading,
  destructive = false,
  onConfirm
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  /** Text, or paragraphs: it is rendered inside a block, not a paragraph. */
  description: ReactNode
  /** A form, between the description and the buttons. */
  children?: ReactNode
  /** Why the action failed, when it did. */
  error?: string
  /** Room for a form or a long description. */
  wide?: boolean
  /** For actions that cannot be undone: a click outside does not dismiss it. */
  alert?: boolean
  cancelLabel: string
  cancelDisabled?: boolean
  onCancel: () => void
  confirmLabel: string
  confirmDisabled?: boolean
  confirmLoading?: boolean
  destructive?: boolean
  onConfirm: () => void
}) {
  const footerRef = useRef<HTMLDivElement>(null)

  /**
   * Enter runs the action, as it does in the current design's dialogs: from a
   * text field, or from the dialog itself after a click on its background.
   * The checks are the ones its DialogContent makes.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return
    if (event.key !== "Enter") return
    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return
    if (event.nativeEvent.isComposing) return

    const target = event.target as HTMLElement | null
    // A field's popup (a select's list) is rendered outside this element, yet
    // its key presses still arrive here through React. Those choose an option.
    if (!target || !event.currentTarget.contains(target)) return

    const targetTag = target.tagName.toLowerCase()
    if (targetTag === "textarea") return
    if (target.isContentEditable || target.closest("[contenteditable='true']"))
      return

    // Let native keyboard activation keep ownership for focused interactive controls.
    if (targetTag === "button" || targetTag === "a") return

    const footer = footerRef.current
    if (!footer) return
    // Cancel is rendered first and the action last.
    const footerButtons = Array.from(
      footer.querySelectorAll<HTMLButtonElement>("button:not([disabled])")
    )
    const submitButton = footerButtons[footerButtons.length - 1]
    if (!submitButton) return

    event.preventDefault()
    submitButton.click()
  }

  return (
    <Dialog.Root
      role={alert ? "alertdialog" : "dialog"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Dialog size={wide ? "lg" : "base"}>
        {/*
         * Kumo's Dialog takes no key handler, so this wrapper fills the popup
         * and takes it instead. It is focusable so that Enter still works
         * after a click on the dialog's own background.
         */}
        <div
          tabIndex={-1}
          className="grid grid-cols-1 gap-5 px-6 py-5 outline-none"
          onKeyDown={handleKeyDown}
        >
          <div className="grid grid-cols-1 gap-1.5">
            <Dialog.Title className="text-lg font-semibold wrap-break-word">
              {title}
            </Dialog.Title>
            <Dialog.Description
              render={<div />}
              className="grid grid-cols-1 gap-2 wrap-break-word text-kumo-subtle"
            >
              {description}
            </Dialog.Description>
          </div>

          {children}

          {error && (
            <Banner
              role="alert"
              variant="error"
              icon={<WarningCircleIcon weight="fill" />}
              title={error}
            />
          )}

          <div ref={footerRef} className="flex justify-end gap-2">
            <Button disabled={cancelDisabled} onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              variant={destructive ? "destructive" : "primary"}
              loading={confirmLoading}
              disabled={confirmDisabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  )
}
