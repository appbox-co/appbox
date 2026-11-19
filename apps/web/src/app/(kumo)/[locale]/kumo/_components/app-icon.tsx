import Image from "next/image"
import { cn } from "@cloudflare/kumo"
import { APP_ICON_BASE_URL } from "./shared"

interface AppIconProps {
  /** Icon file name from the catalogue; falls back to the app's initial. */
  icon: string
  name: string
  /** Sets the size, e.g. `size-5`. */
  className?: string
}

/** Small square app icon. Decorative: the app name is always shown beside it. */
export function AppIcon({ icon, name, className }: AppIconProps) {
  if (!icon) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md bg-kumo-tint text-xs font-medium text-kumo-subtle ring ring-kumo-hairline",
          className
        )}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <Image
      src={`${APP_ICON_BASE_URL}${icon}`}
      alt=""
      width={32}
      height={32}
      unoptimized
      className={cn(
        "size-5 shrink-0 rounded-md object-cover ring ring-kumo-hairline",
        className
      )}
    />
  )
}
