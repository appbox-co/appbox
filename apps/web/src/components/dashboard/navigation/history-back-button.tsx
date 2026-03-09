"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const HISTORY_KEY = "appbox.backHistory.v1"
const MAX_ENTRIES = 50

interface HistoryEntry {
  href: string
  label: string
  ts: number
}

interface HistoryBackButtonProps {
  fallbackHref: string
  fallbackLabel: string
  currentLabel?: string
  className?: string
  loading?: boolean
  anonymizeLabel?: boolean
  anonymizeLabelSingleWord?: boolean
}

function readHistory(): HistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry) =>
        entry &&
        typeof entry.href === "string" &&
        typeof entry.label === "string" &&
        typeof entry.ts === "number"
    )
  } catch {
    return []
  }
}

function writeHistory(entries: HistoryEntry[]) {
  sessionStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(entries.slice(-MAX_ENTRIES))
  )
}

function getPathKey(href: string): string {
  return href.split("#")[0].split("?")[0]
}

export function HistoryBackButton({
  fallbackHref,
  fallbackLabel,
  currentLabel,
  className = "gap-1 -ml-2",
  loading = false,
  anonymizeLabel = false,
  anonymizeLabelSingleWord = false
}: HistoryBackButtonProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentHref = useMemo(() => {
    const query = searchParams?.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])
  const currentPathKey = useMemo(() => getPathKey(currentHref), [currentHref])

  const [target, setTarget] = useState<{ href: string; label: string }>({
    href: fallbackHref,
    label: fallbackLabel
  })
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!currentHref) {
      queueMicrotask(() => setIsReady(true))
      return
    }

    const labelForCurrent = (currentLabel ?? fallbackLabel).trim()
    const history = readHistory()
    const last = history[history.length - 1]

    if (last?.href === currentHref) {
      if (last.label !== labelForCurrent) {
        last.label = labelForCurrent
        last.ts = Date.now()
        writeHistory(history)
      }
    } else if (last && getPathKey(last.href) === currentPathKey) {
      // Same page (different query/hash) — refresh latest entry instead of
      // creating a "new previous page" that points back to itself.
      last.href = currentHref
      last.label = labelForCurrent
      last.ts = Date.now()
      writeHistory(history)
    } else {
      history.push({
        href: currentHref,
        label: labelForCurrent,
        ts: Date.now()
      })
      writeHistory(history)
    }

    const previous = [...history]
      .reverse()
      .find((entry) => getPathKey(entry.href) !== currentPathKey)

    queueMicrotask(() => {
      if (previous) {
        setTarget({
          href: previous.href,
          label: previous.label || fallbackLabel
        })
      } else {
        setTarget({ href: fallbackHref, label: fallbackLabel })
      }
      setIsReady(true)
    })
  }, [currentHref, currentPathKey, currentLabel, fallbackHref, fallbackLabel])

  const handleBackClick = () => {
    const history = readHistory()
    if (!history.length) return

    // Pop the most recent entry for the current page so going "back" behaves
    // like stack navigation and doesn't create a bounce loop.
    for (let i = history.length - 1; i >= 0; i -= 1) {
      if (getPathKey(history[i].href) === currentPathKey) {
        history.splice(i, 1)
        break
      }
    }
    writeHistory(history)
  }

  if (loading || !isReady) {
    return (
      <Button variant="ghost" size="sm" className={className} disabled>
        <Loader2 className="size-4 animate-spin" />
        <span className="inline-block h-4 w-28 animate-pulse rounded bg-muted" />
      </Button>
    )
  }

  return (
    <Button variant="ghost" size="sm" className={className} asChild>
      <Link href={target.href} onClick={handleBackClick}>
        <ArrowLeft className="size-4" />
        <span
          data-anonymize={anonymizeLabel ? true : undefined}
          data-anonymize-single={anonymizeLabelSingleWord ? true : undefined}
        >
          {target.label}
        </span>
      </Link>
    </Button>
  )
}
