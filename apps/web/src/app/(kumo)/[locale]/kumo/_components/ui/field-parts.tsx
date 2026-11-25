"use client"

import type { ReactNode } from "react"
import { Label, Loader } from "@cloudflare/kumo"

/**
 * Small presentational pieces for form fields, in the install dialog and the
 * installed-app forms. They cover the gaps around Kumo's own Field: controls
 * it cannot wrap, and the helper lines shown next to them.
 */

/**
 * A label with the required asterisk the current dialog shows. Kumo's Field
 * only marks optional fields, and with untranslated text, so the mark is kept.
 */
export function withRequiredMark(label: ReactNode, required: boolean) {
  if (!required) return label
  return (
    <>
      {label}
      <span aria-hidden="true" className="text-kumo-danger">
        *
      </span>
    </>
  )
}

/** Error line under a control, sized like Kumo's Field error. */
export function FieldError({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-snug text-kumo-danger">{children}</p>
}

/** Label, content and error for content that is not a Kumo form control. */
export function FieldBlock({
  label,
  error,
  children
}: {
  label: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}

/** Quiet inset box for read-only values and "nothing to choose yet" messages. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-kumo-tint px-3 py-2 text-kumo-subtle">
      {children}
    </p>
  )
}

/** A spinner beside the message that says what is loading. */
export function LoadingRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-kumo-subtle">
      {/* The message already says it; the spinner adds nothing for a reader. */}
      <span aria-hidden="true" className="flex h-lh shrink-0 items-center">
        <Loader size="sm" />
      </span>
      <span>{children}</span>
    </div>
  )
}
