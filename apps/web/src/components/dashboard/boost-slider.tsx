"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import confetti from "canvas-confetti"
import { motion } from "framer-motion"
import { ExternalLink, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

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

function clampBoost(value: number, max: number) {
  return Math.max(0, Math.min(value, Math.max(0, max)))
}

function calcMultiplier(
  slots: number,
  boostIncrement: number,
  maxBoostMultiplier: number
) {
  return Math.min(1 + slots * boostIncrement, maxBoostMultiplier)
}

function formatFixed(value: number, fraction = 1) {
  return Number.isFinite(value) ? value.toFixed(fraction) : "0.0"
}

function gradientForProgress(progress: number) {
  if (progress <= 0.3) {
    return "linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)"
  }
  if (progress <= 0.6) {
    return "linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)"
  }
  return "linear-gradient(90deg, #06b6d4 0%, #f59e0b 55%, #f97316 100%)"
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
  const lastSlotRef = useRef(boundedValue)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  const [sparklePulse, setSparklePulse] = useState(false)

  const progress = max > 0 ? liveValue / max : 0
  const effectiveMultiplier = calcMultiplier(
    liveValue,
    boostIncrement,
    maxBoostMultiplier
  )
  const previewMemory = baseMemory * effectiveMultiplier
  const previewCpus = baseCpus * effectiveMultiplier
  const totalSlotCost = appSlotsCost + liveValue

  const milestoneSlots = useMemo(() => {
    if (boostIncrement <= 0 || max <= 0) return []
    const result: number[] = []
    const maxWhole = Math.floor(maxBoostMultiplier)
    for (let target = 2; target <= maxWhole; target++) {
      const slots = Math.ceil((target - 1) / boostIncrement)
      if (slots > 0 && slots <= max) result.push(slots)
    }
    return [...new Set(result)].sort((a, b) => a - b)
  }, [boostIncrement, max, maxBoostMultiplier])

  const shouldShowUpgrade = Boolean(upgradeUrl) && max > 0 && progress > 0.5

  function confettiFromNotch(slot: number, isMilestone = false) {
    if (!trackRef.current || typeof window === "undefined") return
    const rect = trackRef.current.getBoundingClientRect()
    const slotRatio = max > 0 ? slot / max : 0
    const x = rect.left + rect.width * slotRatio
    const y = rect.top + rect.height / 2
    const intensity = max > 0 ? Math.min(1, slot / max) : 0

    confetti({
      particleCount: Math.round(10 + intensity * 22 + (isMilestone ? 26 : 0)),
      spread: Math.round(36 + intensity * 34 + (isMilestone ? 24 : 0)),
      startVelocity: Math.round(24 + intensity * 20 + (isMilestone ? 12 : 0)),
      ticks: isMilestone ? 220 : 140,
      origin: {
        x: x / window.innerWidth,
        y: y / window.innerHeight
      },
      colors: ["#6366f1", "#06b6d4", "#f59e0b", "#f97316"]
    })
  }

  const applyNext = useCallback(
    (next: number) => {
      const prev = lastSlotRef.current

      if (next > prev) {
        for (let slot = prev + 1; slot <= next; slot++) {
          if (milestoneSlots.includes(slot)) {
            confettiFromNotch(slot, true)
          }
        }
      }

      lastSlotRef.current = next
      setLiveValue(next)

      if (next !== boundedValue) {
        setSparklePulse(true)
        onChange(next)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boundedValue, max, milestoneSlots, onChange]
  )

  const valueFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current || max <= 0) return 0
      const rect = trackRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return clampBoost(Math.round(ratio * max), max)
    },
    [max]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || max <= 0) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      draggingRef.current = true
      applyNext(valueFromPointer(e.clientX))
    },
    [disabled, max, applyNext, valueFromPointer]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return
      applyNext(valueFromPointer(e.clientX))
    },
    [applyNext, valueFromPointer]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return
      draggingRef.current = false
      e.currentTarget.releasePointerCapture(e.pointerId)
    },
    []
  )

  useEffect(() => {
    setLiveValue(boundedValue)
    lastSlotRef.current = boundedValue
  }, [boundedValue])

  useEffect(() => {
    if (!sparklePulse) return
    const timer = window.setTimeout(() => setSparklePulse(false), 280)
    return () => window.clearTimeout(timer)
  }, [sparklePulse])

  const rangeGradient = gradientForProgress(progress)
  const isDisabled = disabled || max <= 0

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        {showHeader ? (
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="size-4 text-primary" />
              {labels?.title ?? "Boost Slots"}
            </div>
            <div className="text-sm font-semibold tabular-nums">
              {liveValue} / {max}
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <div className="text-sm font-semibold tabular-nums">
              {liveValue} / {max}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {/* Custom slider track — single coordinate system for visual + interaction */}
          <div className="relative py-2">
            <div
              ref={trackRef}
              role="slider"
              tabIndex={isDisabled ? -1 : 0}
              aria-valuemin={0}
              aria-valuemax={max}
              aria-valuenow={liveValue}
              aria-disabled={isDisabled || undefined}
              className={cn(
                "relative h-2.5 w-full rounded-full bg-muted",
                isDisabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer touch-none select-none"
              )}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Filled range */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-[background,filter] duration-300",
                  sparklePulse && "animate-pulse"
                )}
                style={{
                  width: `${progress * 100}%`,
                  background: rangeGradient
                }}
              />

              {/* Notch dots */}
              {Array.from({ length: max + 1 }).map((_, notch) => {
                const ratio = max > 0 ? notch / max : 0
                const filled = notch <= liveValue
                return (
                  <div
                    key={notch}
                    className={cn(
                      "absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-150",
                      filled
                        ? "border-white/70 bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                        : "border-border bg-muted"
                    )}
                    style={{ left: `${ratio * 100}%` }}
                  />
                )
              })}

              {/* Milestone dots */}
              {milestoneSlots.map((slot) => {
                const ratio = max > 0 ? slot / max : 0
                const reached = slot <= liveValue
                return (
                  <div
                    key={`milestone-${slot}`}
                    className={cn(
                      "absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
                      reached
                        ? "border-white bg-primary shadow-[0_0_14px_rgba(99,102,241,0.9)]"
                        : "border-primary/60 bg-background/90"
                    )}
                    style={{ left: `${ratio * 100}%` }}
                  />
                )
              })}

              {/* Thumb */}
              <div
                className={cn(
                  "absolute top-1/2 z-20 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-background/60 shadow-[0_0_0_4px_rgba(99,102,241,0.18)] backdrop-blur-xs transition-shadow",
                  !isDisabled && "ring-ring/50 focus-visible:ring-4"
                )}
                style={{ left: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* Milestone labels */}
          {milestoneSlots.length > 0 && (
            <div className="relative h-5">
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
                    className="absolute -translate-x-1/2 text-[10px] font-medium text-muted-foreground"
                    style={{ left: `${ratio * 100}%` }}
                  >
                    {formatFixed(mult)}x
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <motion.div
        className="rounded-xl border bg-muted/20 p-3"
        animate={{ scale: sparklePulse ? 1.01 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Zap className="size-3.5 text-amber-500" />
          {labels?.resourcePreview ?? "Resource Preview"}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-md bg-background/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {labels?.multiplier ?? "Multiplier"}
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {formatFixed(effectiveMultiplier)}x
            </p>
          </div>
          <div className="rounded-md bg-background/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {labels?.slotCost ?? "Slot Cost"}
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {totalSlotCost}
              {cyloFreeSlots > 0 ? (
                <span className="text-muted-foreground">
                  {" "}
                  / {cyloFreeSlots}
                </span>
              ) : null}
            </p>
          </div>
          <div className="rounded-md bg-background/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {labels?.ram ?? "RAM"}
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {formatFixed(previewMemory, 2)} GB
            </p>
          </div>
          <div className="rounded-md bg-background/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {labels?.cpus ?? "CPUs"}
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {formatFixed(previewCpus, 2)}
            </p>
          </div>
        </div>
      </motion.div>

      {showUpgradeCta && shouldShowUpgrade && (
        <a
          href={upgradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          {labels?.cta ?? "Want more boost? Upgrade your plan"}
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  )
}
