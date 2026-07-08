import type { ReactNode } from "react"
import {
  CloudIcon,
  GaugeIcon,
  HardDriveIcon,
  MousePointerClickIcon,
  RouteIcon,
  ServerCogIcon
} from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"

type RedditFeatureCard = {
  title: string
  description: string
}

interface RedditFeatureCardsSectionProps {
  headline1: string
  headline2: string
  description: string
  cards: RedditFeatureCard[]
}

const icons = [
  HardDriveIcon,
  GaugeIcon,
  MousePointerClickIcon,
  RouteIcon,
  CloudIcon,
  ServerCogIcon
]

interface RedditFeatureItemProps {
  area: string
  icon: ReactNode
  title: string
  description: string
}

function RedditFeatureItem({
  area,
  icon,
  title,
  description
}: RedditFeatureItemProps) {
  return (
    <li className={`min-h-56 list-none ${area}`}>
      <div className="bg-background/20 relative h-full rounded-2xl border p-2 backdrop-blur-xs md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="border-0.75 relative flex h-full flex-col rounded-xl p-6 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
          <div className="w-fit rounded-lg border border-gray-600 p-2">
            {icon}
          </div>
          <div className="mt-4 flex flex-1 flex-col justify-center">
            <div className="space-y-3">
              <h3 className="-tracking-4 text-balance pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-black md:text-2xl/[1.875rem] dark:text-white">
                {title}
              </h3>
              <p className="font-sans text-sm/[1.125rem] text-black md:text-base/[1.375rem] dark:text-neutral-400">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

export function RedditFeatureCardsSection({
  headline1,
  headline2,
  description,
  cards
}: RedditFeatureCardsSectionProps) {
  return (
    <section id="features" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-[980px] text-center">
        <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {headline1}
          <br />
          <span className="bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            {headline2}
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <ul className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = icons[index] ?? CloudIcon
          const areas = [
            "md:col-span-1 lg:col-span-1",
            "md:col-span-1 lg:col-span-1",
            "md:col-span-1 lg:col-span-2",
            "md:col-span-2 lg:col-span-2",
            "md:col-span-1 lg:col-span-1",
            "md:col-span-3 lg:col-span-1"
          ]

          return (
            <RedditFeatureItem
              key={card.title}
              area={areas[index] ?? "md:col-span-1 lg:col-span-1"}
              icon={
                <Icon
                  className="size-4 text-black dark:text-neutral-400"
                  aria-hidden="true"
                />
              }
              title={card.title}
              description={card.description}
            />
          )
        })}
      </ul>
    </section>
  )
}
