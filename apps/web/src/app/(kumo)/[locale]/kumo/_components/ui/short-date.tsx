"use client"

import { useFormatter, useLocale } from "next-intl"
import { Tooltip } from "@cloudflare/kumo"

/**
 * How long ago, or how far ahead, a time is, in the page's language: "5
 * minutes ago", "in 2 hours", "3 months ago". Every Kumo page says it this
 * way. Empty for a time that cannot be read.
 */
export function useRelativeTime() {
  const format = useFormatter()
  return (value: string | number | Date) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? ""
      : format.relativeTime(date, Date.now())
  }
}

/** A date in short form; how long ago that was shows on hover. */
export function ShortDate({ value }: { value: string }) {
  const locale = useLocale()
  const relativeTime = useRelativeTime()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return <span className="text-kumo-subtle">—</span>
  }

  return (
    <Tooltip
      content={relativeTime(date)}
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
