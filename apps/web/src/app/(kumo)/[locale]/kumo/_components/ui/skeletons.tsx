import { cn, SkeletonLine } from "@cloudflare/kumo"

/** A list page loading: a card of rows; `icons` starts each row with an icon. */
export function ListSkeleton({
  rows = 4,
  icons = false
}: {
  rows?: number
  icons?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className="divide-y divide-kumo-hairline rounded-lg bg-kumo-base shadow-xs ring ring-kumo-line"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-4">
          {icons && <SkeletonLine className="size-7 rounded-md" />}
          <SkeletonLine className="h-2.5 w-40 rounded-full" />
          {!icons && <SkeletonLine className="h-2.5 w-16 rounded-full" />}
          <SkeletonLine className="ms-auto h-2.5 w-24 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/**
 * A detail page loading: its heading (after an icon, with `icon`), then its
 * cards; `aside` puts a column of details beside them on wide screens.
 */
export function ViewSkeleton({
  icon = false,
  aside = false
}: {
  icon?: boolean
  aside?: boolean
}) {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-8">
      <div className="flex items-start gap-4">
        {icon && <SkeletonLine className="size-14 rounded-xl" />}
        <div className={cn("grid flex-1 gap-3", icon && "pt-1")}>
          <SkeletonLine className="h-4 w-48 rounded-full" />
          <SkeletonLine className="h-2.5 w-72 max-w-full rounded-full" />
        </div>
      </div>
      {aside ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-6">
            <SkeletonLine className="h-28 rounded-lg" />
            <SkeletonLine className="h-64 rounded-lg" />
          </div>
          <SkeletonLine className="h-56 rounded-lg" />
        </div>
      ) : (
        <>
          <SkeletonLine className="h-28 rounded-lg" />
          <SkeletonLine className="h-64 rounded-lg" />
        </>
      )}
    </div>
  )
}

/** A table loading inside its card: three lines of text. */
export function LinesSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-3 p-4">
      <SkeletonLine className="h-2.5 w-1/3 rounded-full" />
      <SkeletonLine className="h-2.5 w-2/3 rounded-full" />
      <SkeletonLine className="h-2.5 w-1/2 rounded-full" />
    </div>
  )
}
