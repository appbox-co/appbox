"use client"

import { AppCard } from "@/components/app-card"
import { Marquee } from "@/components/magicui/marquee"

interface App {
  display_name: string
  publisher: string
  description: string
  icon_image: string
  categories: string[]
}

interface ClientAppsMarqueeProps {
  firstRow: App[]
  secondRow: App[]
}

export function ClientAppsMarquee({
  firstRow,
  secondRow
}: ClientAppsMarqueeProps) {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden mask-fade-both">
      <Marquee pauseOnHover className="[--duration:300s]">
        {firstRow.map((app) => (
          <AppCard
            key={app.display_name}
            name={app.display_name}
            publisher={app.publisher}
            description={app.description}
            iconUrl={app.icon_image}
            categories={app.categories || []}
          />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="mt-4 [--duration:300s]">
        {secondRow.map((app) => (
          <AppCard
            key={app.display_name}
            name={app.display_name}
            publisher={app.publisher}
            description={app.description}
            iconUrl={app.icon_image}
            categories={app.categories || []}
          />
        ))}
      </Marquee>
      
    </div>
  )
}
