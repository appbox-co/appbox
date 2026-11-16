"use client"

import { useLocale } from "next-intl"
import { Tooltip } from "@cloudflare/kumo"
import { formatDistanceToNow } from "date-fns"

/** A date in short form; how long ago that was shows on hover. */
export function ShortDate({ value }: { value: string }) {
  const locale = useLocale()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return <span className="text-kumo-subtle">—</span>
  }

  return (
    <Tooltip
      content={formatDistanceToNow(date, { addSuffix: true })}
      render={
        <time
          dateTime={value}
          className="whitespace-nowrap text-kumo-subtle"
          suppressHydrationWarning
        />
      }
    >
      {date.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric"
      })}
    </Tooltip>
  )
}
