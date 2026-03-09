"use client"

import Image from "next/image"
import Link from "next/link"
import { Package } from "lucide-react"
import type { AppStoreItem } from "@/api/apps/app-store"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

const ICON_BASE_URL = "https://api.appbox.co/assets/images/apps/icons/"

/* Cycle through a few gradient combos based on app id for visual variety */
const gradients = [
  "from-blue-600/20 to-indigo-600/8 dark:from-blue-500/25 dark:to-indigo-500/12",
  "from-emerald-600/20 to-teal-600/8 dark:from-emerald-500/25 dark:to-teal-500/12",
  "from-indigo-600/20 to-blue-600/8 dark:from-indigo-500/25 dark:to-blue-500/12",
  "from-amber-600/20 to-orange-600/8 dark:from-amber-500/25 dark:to-orange-500/12",
  "from-rose-600/20 to-red-600/8 dark:from-rose-500/25 dark:to-red-500/12",
  "from-cyan-600/20 to-sky-600/8 dark:from-cyan-500/25 dark:to-sky-500/12"
]

interface FeaturedAppCardProps {
  app: AppStoreItem
  index?: number
  className?: string
}

export function FeaturedAppCard({
  app,
  index = 0,
  className
}: FeaturedAppCardProps) {
  const gradient = gradients[index % gradients.length]

  return (
    <Link href={ROUTES.APP_STORE_APP(app.id)} className="group block h-full">
      <div
        className={cn(
          "card-glow relative h-full overflow-hidden rounded-xl border bg-linear-to-br p-5",
          gradient,
          className
        )}
      >
        <div className="flex items-start gap-4">
          {/* App Icon */}
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-background/80 shadow-sm ring-1 ring-border/50">
            {app.icon_image ? (
              <Image
                src={`${ICON_BASE_URL}${app.icon_image}`}
                alt={app.display_name}
                width={64}
                height={64}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Package className="size-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold leading-tight group-hover:text-primary transition-colors">
              {app.display_name}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {app.publisher}
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground/90">
              {app.short_description || app.description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
