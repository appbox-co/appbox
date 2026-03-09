"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface UsageGaugeProps {
  value: number
  max?: number
  label: string
  unit?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "auto"
  className?: string
}

const SIZE_CONFIG = {
  sm: {
    svgSize: 80,
    strokeWidth: 6,
    fontSize: "text-lg",
    labelSize: "text-[10px]"
  },
  md: {
    svgSize: 120,
    strokeWidth: 8,
    fontSize: "text-2xl",
    labelSize: "text-xs"
  },
  lg: {
    svgSize: 160,
    strokeWidth: 10,
    fontSize: "text-3xl",
    labelSize: "text-sm"
  }
} as const

function getAutoColor(percentage: number): string {
  if (percentage >= 90) return "hsl(var(--destructive))"
  if (percentage >= 75) return "hsl(30 90% 55%)" // orange
  return "hsl(142 71% 45%)" // green
}

export function UsageGauge({
  value,
  max = 100,
  label,
  unit = "%",
  size = "md",
  variant = "default",
  className
}: UsageGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const config = SIZE_CONFIG[size]
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  // Animate on mount / value change
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setAnimatedValue(percentage)
    })
    return () => cancelAnimationFrame(timer)
  }, [percentage])

  const radius = (config.svgSize - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  // Semicircle: use 75% of circumference for the arc
  const arcLength = circumference * 0.75
  const dashOffset = arcLength - (arcLength * animatedValue) / 100

  const strokeColor =
    variant === "auto" ? getAutoColor(percentage) : "hsl(var(--primary))"

  const displayValue = unit === "%" ? Math.round(percentage) : value

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className="relative"
        style={{ width: config.svgSize, height: config.svgSize }}
      >
        <svg
          width={config.svgSize}
          height={config.svgSize}
          viewBox={`0 0 ${config.svgSize} ${config.svgSize}`}
          className="-rotate-[135deg]"
        >
          {/* Background track */}
          <circle
            cx={config.svgSize / 2}
            cy={config.svgSize / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <circle
            cx={config.svgSize / 2}
            cy={config.svgSize / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-bold leading-none text-foreground",
              config.fontSize
            )}
          >
            {displayValue}
            <span className="text-[0.5em] font-normal text-muted-foreground">
              {unit}
            </span>
          </span>
        </div>
      </div>
      <span
        className={cn("font-medium text-muted-foreground", config.labelSize)}
      >
        {label}
      </span>
    </div>
  )
}
