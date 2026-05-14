import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DashboardPageHeaderProps {
  title: ReactNode
  description?: ReactNode
  icon: ReactNode
  action?: ReactNode
  gradient?: string
  className?: string
}

export function DashboardPageHeader({
  title,
  description,
  icon,
  action,
  gradient = "from-[#6366f1] to-[#8b5cf6]",
  className
}: DashboardPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-linear-to-br text-white shadow-sm",
            gradient
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="min-w-0 wrap-break-word text-lg font-semibold leading-tight">
            {title}
          </h1>
          {description && (
            <div className="max-w-2xl text-xs text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
