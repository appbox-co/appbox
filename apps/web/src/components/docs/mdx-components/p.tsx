import { cn } from "@/lib/utils"

export const p = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("leading-7 not-first:mt-6", className)}
    {...props}
  />
)
