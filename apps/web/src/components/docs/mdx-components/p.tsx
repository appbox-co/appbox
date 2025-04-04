import { cn } from "@/lib/utils"

export const p = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn(
      "leading-7 not-first:mt-6 min-h-[1.5rem]",
      "[&>img]:!relative",
      className
    )}
    {...props}
  />
)
