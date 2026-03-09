"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

function DialogOverlay({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0  fixed inset-0 z-50 bg-black/80",
        className
      )}
      {...props}
    />
  )
}
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

function DialogContent({
  className,
  children,
  onKeyDown,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented) return
      if (event.key !== "Enter") return
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
        return
      if (event.nativeEvent.isComposing) return

      const target = event.target as HTMLElement | null
      if (!target) return

      const targetTag = target.tagName.toLowerCase()
      if (targetTag === "textarea") return
      if (
        target.isContentEditable ||
        target.closest("[contenteditable='true']")
      )
        return
      if (target.closest("[data-disable-enter-submit='true']")) return

      // Let native keyboard activation keep ownership for focused interactive controls.
      if (targetTag === "button" || targetTag === "a") return

      const contentEl = event.currentTarget as HTMLDivElement
      const explicitSubmit = contentEl.querySelector<HTMLButtonElement>(
        "[data-dialog-submit='true']:not([disabled])"
      )
      const nativeSubmit = contentEl.querySelector<HTMLButtonElement>(
        "button[type='submit']:not([disabled])"
      )

      let fallbackSubmit: HTMLButtonElement | null = null
      const footer = contentEl.querySelector<HTMLElement>(
        "[data-slot='footer']"
      )
      if (footer) {
        const footerButtons = Array.from(
          footer.querySelectorAll<HTMLButtonElement>("button:not([disabled])")
        )
        if (footerButtons.length > 0) {
          // Most dialogs render cancel first and primary action last.
          fallbackSubmit = footerButtons[footerButtons.length - 1]
        }
      }

      const submitButton = explicitSubmit ?? nativeSubmit ?? fallbackSubmit
      if (!submitButton) return

      event.preventDefault()
      submitButton.click()
    },
    [onKeyDown]
  )

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg",
          className
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          data-slot="close"
          className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
        >
          <Cross2Icon className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}
DialogContent.displayName = DialogPrimitive.Content.displayName

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="header"
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}
DialogHeader.displayName = "DialogHeader"

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="footer"
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  )
}
DialogFooter.displayName = "DialogFooter"

function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="title"
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
}
DialogTitle.displayName = DialogPrimitive.Title.displayName

function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
}
