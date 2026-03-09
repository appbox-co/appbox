"use client"

import { ThumbsDown, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AppRatingProps {
  upvotes: number
  downvotes: number
  userVote?: number | null
  onVote?: (direction: "up" | "down" | null) => void
  isPending?: boolean
  className?: string
  size?: "sm" | "md"
}

export function AppRating({
  upvotes,
  downvotes,
  userVote,
  onVote,
  isPending,
  className,
  size = "md"
}: AppRatingProps) {
  const iconSize = size === "sm" ? "size-3.5" : "size-4"
  const btnSize = size === "sm" ? "size-7" : "size-8"
  const textSize = size === "sm" ? "text-xs" : "text-sm"

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        size="icon"
        variant="ghost"
        className={cn("group", btnSize, userVote === 1 && "bg-emerald-500/10")}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (isPending) return
          onVote?.(userVote === 1 ? null : "up")
        }}
      >
        <ThumbsUp
          className={cn(
            iconSize,
            "transition-colors",
            userVote === 1
              ? "text-emerald-500"
              : "text-foreground/40 group-hover:text-foreground/60"
          )}
        />
      </Button>
      <span
        className={cn(
          "min-w-[1.5rem] text-center font-medium tabular-nums",
          textSize,
          upvotes > 0 && "text-emerald-500"
        )}
      >
        {upvotes}
      </span>

      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "group",
          btnSize,
          userVote === 0 && "text-destructive bg-destructive/10"
        )}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (isPending) return
          onVote?.(userVote === 0 ? null : "down")
        }}
      >
        <ThumbsDown
          className={cn(
            iconSize,
            "transition-colors",
            userVote === 0
              ? "text-destructive"
              : "text-foreground/40 group-hover:text-foreground/60"
          )}
        />
      </Button>
      <span
        className={cn(
          "min-w-[1.5rem] text-center font-medium tabular-nums",
          textSize,
          downvotes > 0 && "text-destructive"
        )}
      >
        {downvotes}
      </span>
    </div>
  )
}
