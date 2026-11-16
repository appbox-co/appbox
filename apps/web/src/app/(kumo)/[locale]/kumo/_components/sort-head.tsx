import { Table } from "@cloudflare/kumo"
import {
  CaretDownIcon,
  CaretUpDownIcon,
  CaretUpIcon
} from "@phosphor-icons/react"

/** `null` means the list's default order. */
export type SortState<Key extends string> = {
  key: Key
  dir: "asc" | "desc"
} | null

/** Ascending, then descending, then back to the default order. */
export function nextSort<Key extends string>(
  current: SortState<Key>,
  key: Key
): SortState<Key> {
  if (current?.key !== key) return { key, dir: "asc" }
  return current.dir === "asc" ? { key, dir: "desc" } : null
}

/** A table column header that sorts the table when clicked. */
export function SortHead<Key extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className
}: {
  label: string
  sortKey: Key
  sort: SortState<Key>
  onSort: (key: Key) => void
  className?: string
}) {
  const direction = sort?.key === sortKey ? sort.dir : null
  const Icon =
    direction === "asc"
      ? CaretUpIcon
      : direction === "desc"
        ? CaretDownIcon
        : CaretUpDownIcon

  return (
    <Table.Head
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : "none"
      }
      className={className}
    >
      <button
        type="button"
        title={`Sort by ${label.toLowerCase()}`}
        onClick={() => onSort(sortKey)}
        className="-mx-1.5 -my-1 flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 font-semibold whitespace-nowrap hover:bg-kumo-tint focus-visible:outline-2 focus-visible:outline-kumo-brand"
      >
        {label}
        <Icon
          aria-hidden="true"
          size={12}
          weight="bold"
          className={direction ? undefined : "text-kumo-inactive"}
        />
      </button>
    </Table.Head>
  )
}
