"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn, formatBytes } from "@/lib/utils"
import type { StatCardProps } from "@/types/dashboard"

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getUsageColor(percent: number) {
  if (percent >= 90) return "text-red-500"
  if (percent >= 75) return "text-amber-500"
  return "text-emerald-500"
}

function getUsageBarColor(percent: number) {
  if (percent >= 90) return "bg-red-500"
  if (percent >= 75) return "bg-amber-500"
  return "bg-emerald-500"
}

const iconColorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400",
  emerald:
    "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400",
  amber:
    "bg-amber-500/10 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400",
  cyan: "bg-cyan-400/10 text-cyan-500 dark:bg-cyan-400/15 dark:text-cyan-400",
  purple:
    "bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400",
  red: "bg-red-500/10 text-red-500 dark:bg-red-500/15 dark:text-red-400"
}

/* -------------------------------------------------------------------------- */
/*  StatCard                                                                   */
/* -------------------------------------------------------------------------- */

export function StatCard({
  label,
  value,
  description,
  icon,
  iconColor,
  type = "default",
  progress,
  trend,
  variant: _variant = "default",
  className
}: StatCardProps) {
  const displayValue =
    type === "bytes" && typeof value === "number"
      ? formatBytes(value)
      : type === "multiplier" && typeof value === "number"
        ? `${value}x`
        : String(value)

  return (
    <Card className={cn("card-glow relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Icon with tinted background circle */}
          {icon && (
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full",
                iconColor
                  ? iconColorMap[iconColor]
                  : "bg-muted text-muted-foreground"
              )}
            >
              {icon}
            </div>
          )}

          {/* Text content */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-baseline gap-2">
              <p
                className={cn(
                  "text-xl font-bold tracking-tight",
                  type === "usage" &&
                    typeof progress === "number" &&
                    getUsageColor(progress)
                )}
              >
                {displayValue}
              </p>

              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium",
                    trend.direction === "up"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {trend.direction === "up" ? (
                    <ArrowUp className="size-3" />
                  ) : (
                    <ArrowDown className="size-3" />
                  )}
                  {trend.value}%
                </span>
              )}
            </div>

            <p className="text-muted-foreground text-xs font-medium">{label}</p>

            {description && (
              <p className="text-muted-foreground/70 text-[11px]">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {(type === "progress" || type === "usage") &&
          typeof progress === "number" && (
            <div className="mt-4">
              <div className="bg-muted relative h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    type === "usage" ? getUsageBarColor(progress) : "bg-primary"
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
