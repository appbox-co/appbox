"use client"

import type { KeyboardEvent, ReactNode } from "react"
import { useTranslations } from "next-intl"
import {
  Badge,
  Banner,
  Button,
  Collapsible,
  Dialog,
  DropdownMenu,
  Loader
} from "@cloudflare/kumo"
import {
  EyeIcon,
  EyeSlashIcon,
  SlidersHorizontalIcon,
  WarningIcon,
  XIcon
} from "@phosphor-icons/react"
import type {
  CustomTableColumn,
  CustomTableMutation
} from "@/api/custom-tables/custom-tables"

/**
 * Presentational pieces of a custom table: cell contents, the notices above
 * the rows, the column picker and the two dialog layouts. State and requests
 * stay in custom-tables.tsx.
 */

/** Text that stays in English, as it does in the current design. */
const COPY = {
  columns: "Columns",
  close: "Close",
  hide: (title: string) => `Hide ${title}`,
  reveal: (title: string) => `Reveal ${title}`
} as const

/* -------------------------------------------------------------------------- */
/*  Cells                                                                      */
/* -------------------------------------------------------------------------- */

/** The pill for a switch column: on or off. */
export function EnabledBadge({
  enabled,
  label
}: {
  enabled: boolean
  label: string
}) {
  return (
    <Badge
      variant={enabled ? "success" : "neutral"}
      appearance="dot"
      className="shrink-0"
    >
      {label}
    </Badge>
  )
}

/** A secret: masked until revealed, with the button that reveals or hides it. */
export function SecretValue({
  title,
  text,
  canReveal,
  revealed,
  revealing,
  onToggle
}: {
  /** The column's title, for the button's name. */
  title: string
  /** What to show: the mask, the revealed value, or a dash for an empty one. */
  text: string
  canReveal: boolean
  revealed: boolean
  /** The value is being fetched. */
  revealing: boolean
  onToggle: () => void
}) {
  return (
    <span className="flex items-center gap-2">
      <span className="font-mono text-[0.9em]">{text}</span>
      {canReveal ? (
        <Button
          size="sm"
          shape="square"
          variant="ghost"
          icon={revealed ? EyeSlashIcon : EyeIcon}
          loading={revealing}
          aria-label={revealed ? COPY.hide(title) : COPY.reveal(title)}
          onClick={onToggle}
        />
      ) : null}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Notices                                                                    */
/* -------------------------------------------------------------------------- */

/** "Using 3 of 10 rows", with the two numbers set in tabular figures. */
export function RowsUsage({ current, max }: { current: number; max: number }) {
  const t = useTranslations("appboxmanager.appDetail")
  return (
    <p>
      {t
        .raw("customTablesRowsUsage")
        .split(/(\{current\}|\{max\})/)
        .map((part: string, index: number) => {
          if (part === "{current}" || part === "{max}") {
            return (
              <span key={`${part}-${index}`} className="tabular-nums">
                {part === "{current}" ? current : max}
              </span>
            )
          }
          return <span key={`${part}-${index}`}>{part}</span>
        })}
    </p>
  )
}

/** Row changes still being applied, or whose outcome is unknown. */
export function MutationNotices({
  mutations,
  rowLabel,
  retrying,
  onRetry
}: {
  mutations: CustomTableMutation[]
  rowLabel: (rowId: number) => string
  /** A retry is in flight; every retry button waits for it. */
  retrying: boolean
  onRetry: (mutationId: number) => void
}) {
  const t = useTranslations("appboxmanager.appDetail")

  return (
    <div className="grid grid-cols-1 gap-2" aria-live="polite">
      {mutations.map((mutation) => {
        const needsAttention = mutation.status === "unknown"
        return (
          <Banner
            key={mutation.id}
            variant={needsAttention ? "error" : "secondary"}
            icon={
              needsAttention ? (
                <WarningIcon weight="fill" />
              ) : (
                <Loader size="sm" />
              )
            }
            title={rowLabel(mutation.rowId)}
            description={
              mutation.status === "unknown"
                ? t("customTablesMutationUnknown", {
                    action: mutation.mutationType
                  })
                : mutation.status === "admission_pending"
                  ? t("customTablesAdmissionPending")
                  : t("customTablesMutationPending", {
                      action: mutation.mutationType
                    })
            }
            action={
              mutation.canRetry ? (
                <Banner.Action
                  variant="secondary"
                  disabled={retrying}
                  onClick={() => onRetry(mutation.id)}
                >
                  {t("customTablesRetry")}
                </Banner.Action>
              ) : undefined
            }
          />
        )
      })}
    </div>
  )
}

/** Past failed changes, folded away: history, not the rows' current state. */
export function FailedHistory({
  mutations,
  rowLabel
}: {
  mutations: CustomTableMutation[]
  rowLabel: (rowId: number) => string
}) {
  const t = useTranslations("appboxmanager.appDetail")

  return (
    <Collapsible.Root>
      <Collapsible.DefaultTrigger className="font-normal text-kumo-subtle">
        {t("customTablesFailedHistory", { count: mutations.length })}
      </Collapsible.DefaultTrigger>
      <Collapsible.DefaultPanel>
        <p className="text-kumo-subtle">
          {t("customTablesFailedHistoryDescription")}
        </p>
        <ul className="grid list-none grid-cols-1 gap-2 text-kumo-subtle">
          {mutations.map((mutation) => (
            <li key={mutation.id}>
              <span className="font-medium text-kumo-default">
                {rowLabel(mutation.rowId)}:{" "}
              </span>
              {t("customTablesPastMutationFailed", {
                action: mutation.mutationType,
                id: mutation.id
              })}
            </li>
          ))}
        </ul>
      </Collapsible.DefaultPanel>
    </Collapsible.Root>
  )
}

/* -------------------------------------------------------------------------- */
/*  Column picker                                                              */
/* -------------------------------------------------------------------------- */

/** Shows and hides the table's columns. */
export function ColumnsMenu({
  columns,
  hidden,
  onToggle
}: {
  columns: CustomTableColumn[]
  /** Names of the columns currently hidden. */
  hidden: ReadonlySet<string>
  onToggle: (name: string, visible: boolean) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={
          <Button size="sm" icon={SlidersHorizontalIcon}>
            {COPY.columns}
          </Button>
        }
      />
      <DropdownMenu.Content align="end">
        {columns.map((column) => (
          <DropdownMenu.CheckboxItem
            key={column.name}
            checked={!hidden.has(column.name)}
            onCheckedChange={(checked) => onToggle(column.name, checked)}
          >
            {column.title || column.name}
          </DropdownMenu.CheckboxItem>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}

/* -------------------------------------------------------------------------- */
/*  Dialogs                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Enter presses the dialog's main button, as the current design's dialogs do.
 * Kumo's Dialog takes no key handler, so each layout below puts this on a
 * wrapper. The button is the enabled one marked `data-dialog-submit`.
 */
function submitOnEnter(event: KeyboardEvent<HTMLDivElement>) {
  if (event.defaultPrevented) return
  if (event.key !== "Enter") return
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return
  if (event.nativeEvent.isComposing) return

  const target = event.target as HTMLElement | null
  if (!target) return
  // Keys pressed in a popup opened from the dialog (a select's list) reach
  // this handler through React, not through the page; they are not for it.
  if (!event.currentTarget.contains(target)) return

  const targetTag = target.tagName.toLowerCase()
  if (targetTag === "textarea") return
  if (target.isContentEditable || target.closest("[contenteditable='true']")) {
    return
  }
  // Focused buttons and links keep their own keyboard activation.
  if (targetTag === "button" || targetTag === "a") return

  const submitButton = event.currentTarget.querySelector<HTMLButtonElement>(
    "[data-dialog-submit='true']:not([disabled])"
  )
  if (!submitButton) return

  event.preventDefault()
  submitButton.click()
}

interface TableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description: ReactNode
  children?: ReactNode
  /** The dialog's buttons, the one that cancels first. */
  footer: ReactNode
}

/** A form in a dialog: a fixed title and buttons around a body that scrolls. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer
}: TableDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="lg">
        {/* Focusable so that Enter still saves after a click on the dialog's
            own background, and capped at the popup's height so the fields
            scroll between the title and the buttons. */}
        <div
          tabIndex={-1}
          className="relative flex max-h-[inherit] flex-col outline-none"
          onKeyDown={submitOnEnter}
        >
          <header className="grid shrink-0 gap-1.5 border-b border-kumo-line py-5 ps-6 pe-16">
            <Dialog.Title className="text-lg font-semibold">
              {title}
            </Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              {description}
            </Dialog.Description>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-5 overflow-y-auto px-6 py-5">
            {children}
          </div>

          <footer className="flex shrink-0 justify-end gap-2 border-t border-kumo-line px-6 py-4">
            {footer}
          </footer>

          {/* Last in the markup so that opening the dialog puts focus on the
              form rather than on the close button. */}
          <Dialog.Close
            render={
              <Button
                variant="ghost"
                shape="square"
                aria-label={COPY.close}
                icon={XIcon}
                className="absolute end-4 top-4"
              />
            }
          />
        </div>
      </Dialog>
    </Dialog.Root>
  )
}

/** A question to confirm, with an optional field between it and the buttons. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer
}: TableDialogProps) {
  return (
    <Dialog.Root role="alertdialog" open={open} onOpenChange={onOpenChange}>
      <Dialog className="px-6 py-5">
        <div className="grid grid-cols-1 gap-5" onKeyDown={submitOnEnter}>
          <div className="grid gap-1.5">
            <Dialog.Title className="text-lg font-semibold">
              {title}
            </Dialog.Title>
            <Dialog.Description className="wrap-break-word text-kumo-subtle">
              {description}
            </Dialog.Description>
          </div>
          {children}
          <div className="flex justify-end gap-2">{footer}</div>
        </div>
      </Dialog>
    </Dialog.Root>
  )
}
