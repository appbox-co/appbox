import { cn } from "@/lib/utils"

export const code = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  return (
    <code
      className={cn(
        "relative break-words rounded px-[0.3rem] py-[0.2rem] font-mono text-sm",
        className
      )}
      {...props}
    />
  )
}
