"use client"

import { useId, useSyncExternalStore, type ReactNode } from "react"
import { Badge, Button, Checkbox, cn } from "@cloudflare/kumo"
import {
  ArrowCounterClockwiseIcon,
  BugIcon,
  CaretDownIcon,
  CaretUpIcon
} from "@phosphor-icons/react"

/** Developer panels only exist on the development server. */
export const IS_DEV = process.env.NODE_ENV === "development"

/* -------------------------------------------------------------------------- */
/*  Overrides, kept in this browser                                            */
/* -------------------------------------------------------------------------- */

/**
 * A panel's saved overrides, over its defaults. The defaults alone while the
 * server renders, before anything is saved, or when storage is blocked.
 */
export function loadFlags<T extends object>(key: string, defaults: T): T {
  if (typeof window === "undefined") return defaults
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch {
    return defaults
  }
}

export function saveFlags(key: string, flags: object) {
  try {
    localStorage.setItem(key, JSON.stringify(flags))
  } catch {
    // Blocked storage: the overrides last until the page reloads.
  }
}

/* -------------------------------------------------------------------------- */
/*  Open or minimised, remembered per panel                                    */
/* -------------------------------------------------------------------------- */

const COLLAPSE_EVENT = "kumo-dev-panel-collapse"

function subscribeToCollapse(callback: () => void) {
  window.addEventListener(COLLAPSE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

function readCollapsed(key: string) {
  try {
    return localStorage.getItem(key) === "true"
  } catch {
    return false
  }
}

/**
 * Null while the server renders and the browser takes over, so what is stored
 * in the browser never disagrees with the server's markup.
 */
function useCollapsed(key: string) {
  const collapsed = useSyncExternalStore<boolean | null>(
    subscribeToCollapse,
    () => readCollapsed(key),
    () => null
  )
  const setCollapsed = (next: boolean) => {
    try {
      localStorage.setItem(key, String(next))
    } catch {
      // Blocked storage: there is nowhere to keep the choice.
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT))
  }
  return [collapsed, setCollapsed] as const
}

/* -------------------------------------------------------------------------- */
/*  Frame                                                                      */
/* -------------------------------------------------------------------------- */

interface DevPanelProps {
  title: string
  /** Shown beside the title while the panel is overriding something. */
  active?: string | false
  /** Where the open or minimised choice is kept. */
  collapsedKey: string
  children: ReactNode
}

/**
 * The floating frame every developer panel sits in: pinned to the bottom
 * corner, minimised to its title bar with a click.
 */
export function DevPanel({
  title,
  active,
  collapsedKey,
  children
}: DevPanelProps) {
  const [collapsed, setCollapsed] = useCollapsed(collapsedKey)
  const bodyId = useId()

  if (collapsed === null) return null

  const Caret = collapsed ? CaretUpIcon : CaretDownIcon

  return (
    <aside
      aria-label={title}
      className={cn(
        "fixed end-4 bottom-4 z-40 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-kumo-base shadow-lg ring ring-kumo-line",
        !collapsed && "w-80"
      )}
    >
      <button
        type="button"
        aria-expanded={!collapsed}
        aria-controls={bodyId}
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-start font-medium hover:bg-kumo-tint"
      >
        <BugIcon className="size-4 shrink-0 text-kumo-warning" />
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {active && <Badge variant="warning">{active}</Badge>}
        <Caret className="size-3.5 shrink-0 text-kumo-subtle" />
      </button>

      <div
        id={bodyId}
        hidden={collapsed}
        className="max-h-[min(70vh,40rem)] overflow-y-auto border-t border-kumo-line"
      >
        <div className="grid gap-4 px-4 py-3.5">{children}</div>
      </div>
    </aside>
  )
}

/* -------------------------------------------------------------------------- */
/*  Controls                                                                   */
/* -------------------------------------------------------------------------- */

export function DevSection({
  title,
  children
}: {
  title: ReactNode
  children: ReactNode
}) {
  return (
    <section className="grid gap-2">
      <h3 className="text-xs font-medium text-kumo-subtle">{title}</h3>
      {children}
    </section>
  )
}

interface DevCheckProps {
  checked: boolean
  onToggle: () => void
  label: ReactNode
  hint?: ReactNode
}

export function DevCheck({ checked, onToggle, label, hint }: DevCheckProps) {
  const labelId = useId()
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <span className="flex h-lh items-center">
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          aria-labelledby={labelId}
        />
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span id={labelId}>{label}</span>
        {hint && <span className="text-xs text-kumo-subtle">{hint}</span>}
      </span>
    </label>
  )
}

interface DevChoicesProps<T extends string> {
  options: readonly { value: T; label: string; hint?: string }[]
  /** The chosen option, if any. */
  value: T | null
  onChoose: (value: T) => void
  columns?: 2 | 3
}

/** A grid of buttons where at most one is pressed. */
export function DevChoices<T extends string>({
  options,
  value,
  onChoose,
  columns = 3
}: DevChoicesProps<T>) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        columns === 3 ? "grid-cols-3" : "grid-cols-2"
      )}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={value === option.value ? "primary" : "secondary"}
          aria-pressed={value === option.value}
          title={option.hint}
          onClick={() => onChoose(option.value)}
          className="w-full justify-center"
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

/** What an override does, or what the real value is, in a quiet box. */
export function DevNote({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-1 rounded-md bg-kumo-tint px-3 py-2 text-xs text-kumo-subtle">
      {children}
    </div>
  )
}

export function DevReset({
  onClick,
  disabled,
  children = "Reset to real data"
}: {
  onClick: () => void
  disabled?: boolean
  children?: ReactNode
}) {
  return (
    <Button
      size="sm"
      variant="secondary"
      icon={ArrowCounterClockwiseIcon}
      disabled={disabled}
      onClick={onClick}
      className="w-full justify-center"
    >
      {children}
    </Button>
  )
}
