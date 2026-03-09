"use client"

import Image from "next/image"
import Link from "next/link"
import { Package } from "lucide-react"
import type { AppStoreItem } from "@/api/apps/app-store"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

const ICON_BASE_URL = "https://api.appbox.co/assets/images/apps/icons/"

interface AppStoreCardProps {
  app: AppStoreItem
  className?: string
}

export function AppStoreCard({ app, className }: AppStoreCardProps) {
  return (
    <Link href={ROUTES.APP_STORE_APP(app.id)} className="group block h-full">
      <Card className={cn("card-glow h-full overflow-hidden", className)}>
        <CardContent className="h-full p-4">
          <div className="flex h-full gap-3">
            {/* App Icon */}
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              {app.icon_image ? (
                <Image
                  src={`${ICON_BASE_URL}${app.icon_image}`}
                  alt={app.display_name}
                  width={56}
                  height={56}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Package className="size-7 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* App Info */}
            <div className="flex min-w-0 flex-1 flex-col">
              <h3 className="truncate text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                {app.display_name}
              </h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {app.publisher}
              </p>

              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">
                {app.short_description || app.description}
              </p>

              {/* Categories - pinned to bottom */}
              {app.categories && app.categories.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-1 pt-2">
                  {app.categories
                    .filter((cat) => cat.key !== 16)
                    .slice(0, 3)
                    .map((cat) => (
                      <Badge
                        key={cat.key}
                        variant="outline"
                        className="h-5 border-primary/30 px-1.5 text-[10px] text-primary"
                      >
                        {cat.label}
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
