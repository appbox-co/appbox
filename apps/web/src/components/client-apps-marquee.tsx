'use client'

import { Marquee } from '@/components/magicui/marquee'
import { AppCard } from '@/components/app-card'

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
  secondRow,
}: ClientAppsMarqueeProps) {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
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
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
    </div>
  )
}
