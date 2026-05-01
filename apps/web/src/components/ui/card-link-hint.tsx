import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CardLinkHintProps {
  className?: string
  hoverScope?: "group" | "card"
}

export function CardLinkHint({
  className,
  hoverScope = "group"
}: CardLinkHintProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted/70 text-muted-foreground/70 transition-all duration-200",
        hoverScope === "card"
          ? "group-hover/card:translate-x-0.5 group-hover/card:bg-primary/10 group-hover/card:text-primary group-focus-visible/card:translate-x-0.5 group-focus-visible/card:bg-primary/10 group-focus-visible/card:text-primary"
          : "group-hover:translate-x-0.5 group-hover:bg-primary/10 group-hover:text-primary group-focus-visible:translate-x-0.5 group-focus-visible:bg-primary/10 group-focus-visible:text-primary",
        className
      )}
    >
      <ChevronRight className="size-3.5" />
    </span>
  )
}
