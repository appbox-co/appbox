import type { ReactNode } from "react"

/**
 * A list of account settings, one per row: what it is at the start, its value
 * or control at the end. Sits edge to edge in a flush `Panel`.
 */
export function SettingList({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-1 divide-y divide-kumo-hairline">
      {children}
    </dl>
  )
}

export function SettingRow({
  label,
  hint,
  children
}: {
  label: string
  /** A line under the label saying what the setting is for. */
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2.5 px-5 py-4">
      <dt className="grid min-w-0 gap-0.5">
        <span className="font-medium">{label}</span>
        {hint && <span className="text-kumo-subtle">{hint}</span>}
      </dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-3">{children}</dd>
    </div>
  )
}

/** The title and one-line description at the top of an account page. */
export function AccountHeader({
  icon,
  title,
  description,
  action
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="grid gap-1.5">
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold">
          {icon}
          {title}
        </h1>
        <p className="text-kumo-subtle">{description}</p>
      </div>
      {action}
    </header>
  )
}
