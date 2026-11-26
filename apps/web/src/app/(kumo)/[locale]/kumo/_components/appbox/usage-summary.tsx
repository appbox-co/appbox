"use client"

import type { ReactNode } from "react"
import { cn } from "@cloudflare/kumo"
import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react"
import { formatBytes, formatStorageGB } from "@/lib/utils"
import { percentOf, usageTone } from "../shared"
import { UsageRing } from "../ui/usage-ring"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  storage: "Storage",
  appSlots: "App slots",
  bandwidth: "Bandwidth (30 days)",
  boost: "Boost slots used",
  boostSlots: (count: number) => `${count} slot${count === 1 ? "" : "s"}`
} as const

/** What an Appbox, or several added together, are using. */
export interface UsageFigures {
  /** GB. */
  storageUsed: number
  /** GB. */
  storageTotal: number
  /** Bytes sent in the last 30 days. */
  uploadUsed: number
  /** Bytes received in the last 30 days. */
  downloadUsed: number
  slotsUsed: number
  slotsTotal: number
  boostSlots: number
}

/** A thin bar showing how much of something is used. */
export function Meter({
  label,
  percent,
  valueText
}: {
  label: string
  percent: number
  valueText: string
}) {
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(percent, 100)}
      aria-valuetext={valueText}
      className="h-1.5 overflow-hidden rounded-full bg-kumo-fill"
    >
      <div
        className={cn("h-full rounded-full", usageTone(percent))}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  )
}

/** Bytes sent and received, side by side. */
export function Transfer({
  up,
  down,
  className
}: {
  up: number
  down: number
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-kumo-subtle tabular-nums",
        className
      )}
    >
      <span className="flex items-center gap-1 whitespace-nowrap">
        <ArrowUpIcon aria-hidden="true" size={12} />
        {formatBytes(up)}
      </span>
      <span className="flex items-center gap-1 whitespace-nowrap">
        <ArrowDownIcon aria-hidden="true" size={12} />
        {formatBytes(down)}
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Strip: four figures in a row, for screens with no room for a side column   */
/* -------------------------------------------------------------------------- */

function StripCell({
  label,
  value,
  suffix,
  children
}: {
  label: string
  value: string
  suffix?: string
  children?: ReactNode
}) {
  return (
    <div className="grid min-w-0 content-start gap-1.5 bg-kumo-base px-5 py-4">
      <dt className="text-sm text-kumo-subtle">{label}</dt>
      <dd className="grid gap-2">
        <span className="truncate text-xl font-semibold tabular-nums">
          {value}
          {suffix && (
            <span className="text-base font-normal text-kumo-subtle">
              {" "}
              {suffix}
            </span>
          )}
        </span>
        {children}
      </dd>
    </div>
  )
}

export function UsageStrip({ figures }: { figures: UsageFigures }) {
  const storagePercent = percentOf(figures.storageUsed, figures.storageTotal)
  const slotsPercent = percentOf(figures.slotsUsed, figures.slotsTotal)

  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-kumo-hairline shadow-xs ring ring-kumo-line sm:grid-cols-2 lg:grid-cols-4">
      <StripCell
        label={COPY.storage}
        value={formatStorageGB(figures.storageUsed)}
        suffix={`/ ${formatStorageGB(figures.storageTotal)}`}
      >
        <Meter
          label={COPY.storage}
          percent={storagePercent}
          valueText={`${storagePercent}%`}
        />
      </StripCell>
      <StripCell
        label={COPY.bandwidth}
        value={formatBytes(figures.uploadUsed + figures.downloadUsed)}
      >
        <Transfer up={figures.uploadUsed} down={figures.downloadUsed} />
      </StripCell>
      <StripCell
        label={COPY.appSlots}
        value={String(figures.slotsUsed)}
        suffix={`/ ${figures.slotsTotal}`}
      >
        <Meter
          label={COPY.appSlots}
          percent={slotsPercent}
          valueText={`${figures.slotsUsed} / ${figures.slotsTotal}`}
        />
      </StripCell>
      <StripCell
        label={COPY.boost}
        value={COPY.boostSlots(figures.boostSlots)}
      />
    </dl>
  )
}

/* -------------------------------------------------------------------------- */
/*  Rail: the same figures for the shell's right-hand column                   */
/* -------------------------------------------------------------------------- */

function RailRow({
  ring,
  label,
  children
}: {
  ring?: number
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5 py-2.5">
      {ring !== undefined && (
        <span className="flex h-lh shrink-0 items-center">
          <UsageRing percent={ring} />
        </span>
      )}
      <dt className="min-w-0 flex-1 text-kumo-subtle">{label}</dt>
      <dd className="grid min-w-0 justify-items-end gap-0.5 text-end tabular-nums">
        {children}
      </dd>
    </div>
  )
}

export function UsageRailSection({
  title,
  figures,
  action
}: {
  title: string
  figures: UsageFigures
  /** A small button beside the title. */
  action?: ReactNode
}) {
  return (
    <section className="grid grid-cols-1 gap-1 border-b border-kumo-line px-5 pt-5 pb-3">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      <dl className="grid grid-cols-1 divide-y divide-dashed divide-kumo-line">
        <RailRow
          ring={percentOf(figures.storageUsed, figures.storageTotal)}
          label={COPY.storage}
        >
          <span>
            {formatStorageGB(figures.storageUsed)} /{" "}
            {formatStorageGB(figures.storageTotal)}
          </span>
        </RailRow>
        <RailRow
          ring={percentOf(figures.slotsUsed, figures.slotsTotal)}
          label={COPY.appSlots}
        >
          <span>
            {figures.slotsUsed} / {figures.slotsTotal}
          </span>
        </RailRow>
        <RailRow label={COPY.bandwidth}>
          <span>{formatBytes(figures.uploadUsed + figures.downloadUsed)}</span>
          <Transfer up={figures.uploadUsed} down={figures.downloadUsed} />
        </RailRow>
        <RailRow label={COPY.boost}>
          <span>{COPY.boostSlots(figures.boostSlots)}</span>
        </RailRow>
      </dl>
    </section>
  )
}
