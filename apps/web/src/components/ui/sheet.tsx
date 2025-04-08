"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

function SheetOverlay({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-[fade-in_var(--animate-duration-normal)_ease-out] data-[state=closed]:animate-[fade-out_var(--animate-duration-normal)_ease-in]",
        className
      )}
      {...props}
    />
  )
}
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "bg-background fixed z-50 gap-4 p-6 shadow-lg transition ease-in-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=open]:animate-[fade-in_var(--animate-duration-normal)_ease-out,slide-in-from-top_var(--animate-duration-normal)_ease-out] data-[state=closed]:animate-[fade-out_var(--animate-duration-normal)_ease-in,slide-out-to-top_var(--animate-duration-normal)_ease-in]",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=open]:animate-[fade-in_var(--animate-duration-normal)_ease-out,slide-in-from-bottom_var(--animate-duration-normal)_ease-out] data-[state=closed]:animate-[fade-out_var(--animate-duration-normal)_ease-in,slide-out-to-bottom_var(--animate-duration-normal)_ease-in]",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-[state=open]:animate-[fade-in_var(--animate-duration-normal)_ease-out,slide-in-from-left_var(--animate-duration-normal)_ease-out] data-[state=closed]:animate-[fade-out_var(--animate-duration-normal)_ease-in,slide-out-to-left_var(--animate-duration-normal)_ease-in]",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm data-[state=open]:animate-[fade-in_var(--animate-duration-normal)_ease-out,slide-in-from-right_var(--animate-duration-normal)_ease-out] data-[state=closed]:animate-[fade-out_var(--animate-duration-normal)_ease-in,slide-out-to-right_var(--animate-duration-normal)_ease-in]"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="content"
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          data-slot="close"
          className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
        >
          <Cross2Icon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}
SheetContent.displayName = SheetPrimitive.Content.displayName

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="header"
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}
SheetHeader.displayName = "SheetHeader"

function SheetFooter({
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
SheetFooter.displayName = "SheetFooter"

function SheetTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="title"
      className={cn("text-foreground text-lg font-semibold", className)}
      {...props}
    />
  )
}
SheetTitle.displayName = SheetPrimitive.Title.displayName

function SheetDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription
}
