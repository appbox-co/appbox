import Link from "next/link"
import { cn } from "@/lib/utils"

export const a = ({
  className,
  href,
  ...props
}: React.HTMLAttributes<HTMLAnchorElement> & { href?: string }) => {
  const isExternal =
    href?.startsWith("http") ||
    href?.startsWith("https") ||
    href?.startsWith("//") ||
    href?.startsWith("mailto:") ||
    href?.startsWith("tel:")

  if (isExternal) {
    return (
      <a
        className={cn("font-medium underline underline-offset-4", className)}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    )
  }

  return (
    <Link
      className={cn("font-medium underline underline-offset-4", className)}
      href={href || "#"}
      {...props}
    />
  )
}
