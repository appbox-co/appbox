"use client"

/* eslint-disable @next/next/no-img-element */
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { cn, formatBytes } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  ImageCell                                                                  */
/* -------------------------------------------------------------------------- */

interface ImageCellProps {
  src: string
  alt: string
  text: string
  size?: number
  className?: string
}

export function ImageCell({
  src,
  alt,
  text,
  size = 32,
  className
}: ImageCellProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="rounded-md object-cover"
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-md bg-muted"
          style={{ width: size, height: size }}
        />
      )}
      <span className="truncate font-medium">{text}</span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  StatusCell                                                                 */
/* -------------------------------------------------------------------------- */

type StatusVariant =
  | "online"
  | "offline"
  | "enabled"
  | "disabled"
  | "migrating"
  | "installing"
  | "uninstalling"
  | "restarting"
  | "frozen"
  | "error"
  | "pending"
  | "active"
  | "inactive"
  | "suspended"

const statusStyles: Record<StatusVariant, string> = {
  online:
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400",
  active:
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400",
  enabled:
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400",
  offline: "bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400",
  disabled: "bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400",
  error: "bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400",
  suspended: "bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400",
  migrating:
    "bg-amber-500/15 text-amber-700 border-amber-500/25 dark:text-amber-400",
  installing:
    "bg-blue-500/15 text-blue-700 border-blue-500/25 dark:text-blue-400",
  uninstalling:
    "bg-orange-500/15 text-orange-700 border-orange-500/25 dark:text-orange-400",
  restarting:
    "bg-sky-500/15 text-sky-700 border-sky-500/25 dark:text-sky-400",
  frozen:
    "bg-cyan-500/15 text-cyan-700 border-cyan-500/25 dark:text-cyan-400",
  pending:
    "bg-amber-500/15 text-amber-700 border-amber-500/25 dark:text-amber-400",
  inactive: "bg-zinc-500/15 text-zinc-700 border-zinc-500/25 dark:text-zinc-400"
}

const statusDotStyles: Record<StatusVariant, string> = {
  online: "bg-emerald-500",
  active: "bg-emerald-500",
  enabled: "bg-emerald-500",
  offline: "bg-red-500",
  disabled: "bg-red-500",
  error: "bg-red-500",
  suspended: "bg-red-500",
  migrating: "bg-amber-500 animate-pulse",
  installing: "bg-blue-500 animate-pulse",
  uninstalling: "bg-orange-500 animate-pulse",
  restarting: "bg-sky-500 animate-pulse",
  frozen: "bg-cyan-500",
  pending: "bg-amber-500 animate-pulse",
  inactive: "bg-zinc-500"
}

interface StatusCellProps {
  status: string | number | boolean | null | undefined
  label?: string
  className?: string
}

export function StatusCell({ status, label, className }: StatusCellProps) {
  const rawStatus = String(status ?? "inactive")
  const normalised = rawStatus.toLowerCase() as StatusVariant
  const style = statusStyles[normalised] ?? statusStyles.inactive
  const dotStyle = statusDotStyles[normalised] ?? statusDotStyles.inactive

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", style, className)}
    >
      <span className={cn("size-1.5 rounded-full", dotStyle)} />
      {label ?? rawStatus}
    </Badge>
  )
}

/* -------------------------------------------------------------------------- */
/*  DateCell                                                                   */
/* -------------------------------------------------------------------------- */

interface DateCellProps {
  date: string | number | Date
  className?: string
}

export function DateCell({ date, className }: DateCellProps) {
  const d = new Date(date)
  const formatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
  const relative = formatDistanceToNow(d, { addSuffix: true })

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("text-muted-foreground text-sm", className)}>
            {formatted}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{relative}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/* -------------------------------------------------------------------------- */
/*  BytesCell                                                                  */
/* -------------------------------------------------------------------------- */

interface BytesCellProps {
  bytes: number
  decimals?: number
  className?: string
}

export function BytesCell({ bytes, decimals = 2, className }: BytesCellProps) {
  return (
    <span className={cn("tabular-nums", className)}>
      {formatBytes(bytes, decimals)}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  ProgressCell                                                               */
/* -------------------------------------------------------------------------- */

interface ProgressCellProps {
  value: number
  max?: number
  label?: string
  className?: string
}

export function ProgressCell({
  value,
  max = 100,
  label,
  className
}: ProgressCellProps) {
  const percent = Math.min(Math.round((value / max) * 100), 100)

  const barColor =
    percent >= 90
      ? "bg-red-500"
      : percent >= 75
        ? "bg-amber-500"
        : "bg-emerald-500"

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="bg-muted relative h-2 w-full max-w-[120px] overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-muted-foreground text-sm tabular-nums">
        {label ?? `${percent}%`}
      </span>
    </div>
  )
}
