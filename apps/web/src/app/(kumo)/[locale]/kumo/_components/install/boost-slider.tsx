"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react"
import { cn, Link as KumoLink, Slider } from "@cloudflare/kumo"
import { LightningIcon, SparkleIcon } from "@phosphor-icons/react"
import {
  calcMultiplier,
  clampBoost,
  formatFixed,
  formatMemoryPreview,
  formatResourcePreview
} from "./logic"

interface BoostSliderProps {
  value: number
  max: number
  boostIncrement: number
  maxBoostMultiplier: number
  baseMemory: number
  baseCpus: number
  appSlotsCost: number
  cyloFreeSlots: number
  onChange: (value: number) => void
  disabled?: boolean
  upgradeUrl?: string
  className?: string
  showHeader?: boolean
  showUpgradeCta?: boolean
  labels?: {
    title?: string
    resourcePreview?: string
    multiplier?: string
    slotCost?: string
    ram?: string
    cpus?: string
    cta?: string
  }
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-sm text-kumo-subtle">{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  )
}

export function BoostSlider({
  value,
  max,
  boostIncrement,
  maxBoostMultiplier,
  baseMemory,
  baseCpus,
  appSlotsCost,
  cyloFreeSlots,
  onChange,
  disabled,
  upgradeUrl,
  className,
  showHeader = true,
  showUpgradeCta = true,
  labels
}: BoostSliderProps) {
  const boundedValue = clampBoost(value, max)
  const [liveValue, setLiveValue] = useState(boundedValue)

  const progress = max > 0 ? liveValue / max : 0
  const effectiveMultiplier = calcMultiplier(
    liveValue,
    boostIncrement,
    maxBoostMultiplier
  )
  const isDisabled = disabled || max <= 0
  const previewMemory = baseMemory * effectiveMultiplier
  const previewCpus = baseCpus * effectiveMultiplier
  const totalSlotCost = appSlotsCost + liveValue

  const milestoneSlots = useMemo(() => {
    if (boostIncrement <= 0 || max <= 0) return []
    const result: number[] = [0]
    const maxWhole = Math.floor(maxBoostMultiplier)
    for (let target = 2; target <= maxWhole; target++) {
      const slots = Math.ceil((target - 1) / boostIncrement)
      if (slots > 0 && slots <= max) result.push(slots)
    }
    return [...new Set(result)].sort((a, b) => a - b)
  }, [boostIncrement, max, maxBoostMultiplier])

  const shouldShowUpgrade = Boolean(upgradeUrl) && max > 0 && progress > 0.5

  const applyNext = useCallback(
    (next: number) => {
      setLiveValue(next)

      if (next !== boundedValue) {
        onChange(next)
      }
    },
    [boundedValue, onChange]
  )

  useEffect(() => {
    setLiveValue(boundedValue)
  }, [boundedValue])

  // The glide (.kumo-slider-glide) starts with the first change of value.
  // Base UI places the thumb a moment after it appears, and that shouldn't glide.
  const [firstValue] = useState(boundedValue)
  const [glide, setGlide] = useState(false)
  if (!glide && liveValue !== firstValue) setGlide(true)

  const title = labels?.title ?? "Boost Slots"

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="grid gap-2">
        {showHeader ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 font-medium">
              <SparkleIcon
                aria-hidden="true"
                size={16}
                className="text-kumo-brand"
              />
              {title}
            </div>
            <div className="font-medium tabular-nums">
              {liveValue} / {max}
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <div className="font-medium tabular-nums">
              {liveValue} / {max}
            </div>
          </div>
        )}

        <Slider<number>
          className={cn(glide && "kumo-slider-glide")}
          value={liveValue}
          min={0}
          // Kumo divides by the range to place the thumb, so an empty range
          // (no boost slots, slider disabled) still needs a width.
          max={max > 0 ? max : 1}
          step={1}
          // Page Up and Page Down move a tenth of the range.
          largeStep={Math.max(1, Math.ceil(max / 10))}
          disabled={isDisabled}
          getAriaLabel={() => title}
          onValueChange={(next) => applyNext(clampBoost(next, max))}
        />

        {/* Milestone labels */}
        {milestoneSlots.length > 0 && (
          // Inset by the track's padding plus half a thumb, so each label
          // sits under the thumb position it describes.
          <div className="relative mx-[11px] h-5">
            {milestoneSlots.map((slot) => {
              const ratio = max > 0 ? slot / max : 0
              const mult = calcMultiplier(
                slot,
                boostIncrement,
                maxBoostMultiplier
              )
              return (
                <span
                  key={slot}
                  className="absolute -translate-x-1/2 text-sm text-kumo-subtle tabular-nums rtl:translate-x-1/2"
                  style={{ insetInlineStart: `${ratio * 100}%` }}
                >
                  {formatFixed(mult)}x
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg ring ring-kumo-hairline">
        <div className="flex items-center gap-1.5 border-b border-kumo-hairline px-3 py-2 text-sm font-medium text-kumo-subtle">
          <LightningIcon aria-hidden="true" size={14} />
          {labels?.resourcePreview ?? "Resource Preview"}
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-3 py-2.5">
          <Stat label={labels?.multiplier ?? "Multiplier"}>
            {formatFixed(effectiveMultiplier)}x
          </Stat>
          <Stat label={labels?.slotCost ?? "Slot Cost"}>
            {totalSlotCost}
            {cyloFreeSlots > 0 ? (
              <span className="font-normal text-kumo-subtle">
                {" "}
                / {cyloFreeSlots}
              </span>
            ) : null}
          </Stat>
          <Stat label={labels?.ram ?? "RAM"}>
            {formatMemoryPreview(previewMemory, baseMemory)}
          </Stat>
          <Stat label={labels?.cpus ?? "CPUs"}>
            {formatResourcePreview(previewCpus, baseCpus)}
          </Stat>
        </dl>
      </div>

      {showUpgradeCta && shouldShowUpgrade && (
        <div>
          <KumoLink href={upgradeUrl} target="_blank" rel="noopener noreferrer">
            {labels?.cta ?? "Want more boost? Upgrade your plan"}
            <KumoLink.ExternalIcon />
          </KumoLink>
        </div>
      )}
    </div>
  )
}
