"use client"

import {
  Cloud,
  Code,
  Cpu,
  Database,
  Download,
  FileText,
  Globe,
  HardDrive,
  HeadphonesIcon,
  Heart,
  Key,
  Layers,
  Lock,
  Monitor,
  MousePointerClick,
  Network,
  Palette,
  Plug,
  Rocket,
  Server,
  Settings,
  Shield,
  Smartphone,
  Star,
  Terminal,
  Upload,
  Users,
  Zap,
  type LucideIcon
} from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { cn } from "@/lib/utils"
import type {
  FeatureItem,
  FeaturesBlock as FeaturesBlockType
} from "@/types/marketing-blocks"

const iconMap: Record<string, LucideIcon> = {
  cloud: Cloud,
  code: Code,
  cpu: Cpu,
  database: Database,
  download: Download,
  docs: FileText,
  file: FileText,
  globe: Globe,
  hard_drive: HardDrive,
  headphones: HeadphonesIcon,
  heart: Heart,
  key: Key,
  layers: Layers,
  lock: Lock,
  monitor: Monitor,
  click: MousePointerClick,
  network: Network,
  palette: Palette,
  plug: Plug,
  rocket: Rocket,
  server: Server,
  settings: Settings,
  shield: Shield,
  smartphone: Smartphone,
  star: Star,
  terminal: Terminal,
  upload: Upload,
  users: Users,
  zap: Zap
}

interface FeaturesBlockProps {
  block: FeaturesBlockType
}

function FeatureCard({ item }: { item: FeatureItem }) {
  const IconComponent = iconMap[item.icon]

  return (
    <div className="bg-background/20 relative h-full rounded-2xl border p-2 backdrop-blur-xs md:rounded-3xl md:p-3">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
      />
      <div className="relative flex h-full flex-col rounded-xl p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
        {IconComponent && (
          <div className="w-fit rounded-lg border border-gray-600 p-2">
            <IconComponent className="size-4 text-black dark:text-neutral-400" />
          </div>
        )}
        <div className="mt-4 flex flex-1 flex-col justify-center">
          <h3 className="-tracking-4 text-balance pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-black md:text-2xl/[1.875rem] dark:text-white">
            {item.title}
          </h3>
          <p className="mt-3 font-sans text-sm/[1.125rem] text-black md:text-base/[1.375rem] dark:text-neutral-400">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  )
}

function getBentoSpan(index: number, total: number): string {
  if (total <= 2) return "md:col-span-1"
  if (total === 3) {
    if (index === 0) return "md:col-span-1 md:row-span-2"
    return "md:col-span-1 md:row-span-1"
  }
  if (total === 4) {
    if (index === 0) return "md:col-span-1 md:row-span-2"
    if (index === 3) return "md:col-span-2 md:row-span-1"
    return "md:col-span-1 md:row-span-1"
  }
  if (total === 5) {
    if (index === 0) return "md:col-span-1 md:row-span-2"
    if (index === 4) return "md:col-span-2 md:row-span-1"
    return "md:col-span-1 md:row-span-1"
  }
  // 6+ items
  if (index === 0) return "md:col-span-1 md:row-span-2"
  if (index === total - 1) return "md:col-span-2 md:row-span-1"
  return "md:col-span-1 md:row-span-1"
}

function BentoGrid({ items }: { items: FeatureItem[] }) {
  return (
    <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((item, i) => (
        <div key={i} className={getBentoSpan(i, items.length)}>
          <FeatureCard item={item} />
        </div>
      ))}
    </div>
  )
}

function StandardGrid({
  items,
  columns
}: {
  items: FeatureItem[]
  columns: number
}) {
  return (
    <ul
      className={cn(
        "grid list-none gap-4",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      )}
    >
      {items.map((item, i) => (
        <li key={i} className="min-h-[10rem]">
          <FeatureCard item={item} />
        </li>
      ))}
    </ul>
  )
}

export function FeaturesBlock({ block }: FeaturesBlockProps) {
  const columns = block.columns || 3
  const layout = block.layout || "grid"

  return (
    <section className="py-16">
      {(block.title || block.subtitle) && (
        <div className="mx-auto mb-12 max-w-3xl text-center">
          {block.title && (
            <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                {block.title}
              </span>
            </h2>
          )}
          {block.subtitle && (
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {block.subtitle}
            </p>
          )}
        </div>
      )}

      {layout === "bento" ? (
        <BentoGrid items={block.items} />
      ) : (
        <StandardGrid items={block.items} columns={columns} />
      )}
    </section>
  )
}
