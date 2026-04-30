"use client"

import Image from "next/image"
import Link from "next/link"
import { Package } from "lucide-react"
import type { AppStoreItem } from "@/api/apps/app-store"
import { CardLinkHint } from "@/components/ui/card-link-hint"
import { cn } from "@/lib/utils"

const ICON_BASE_URL = "https://api.appbox.co/assets/images/apps/icons/"

interface AppCardSmallProps {
  app: AppStoreItem
  className?: string
}

export function AppCardSmall({ app, className }: AppCardSmallProps) {
  return (
    <Link
      href={`/appstore/app/${app.id}`}
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm",
        className
      )}
    >
      <div className="shrink-0 overflow-hidden rounded-lg bg-muted">
        {app.icon_image ? (
          <Image
            src={`${ICON_BASE_URL}${app.icon_image}`}
            alt={app.display_name}
            width={40}
            height={40}
            unoptimized
            className="size-10 object-cover"
          />
        ) : (
          <div className="flex size-10 items-center justify-center">
            <Package className="size-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h4 className="min-w-0 truncate text-sm font-medium text-foreground transition-colors duration-200 group-hover:text-primary">
            {app.display_name}
          </h4>
          <CardLinkHint />
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {app.short_description}
        </p>
      </div>
    </Link>
  )
}
