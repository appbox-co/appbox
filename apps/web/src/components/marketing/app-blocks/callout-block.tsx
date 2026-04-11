"use client"

import { motion } from "framer-motion"
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
  Info,
  Key,
  Layers,
  Lightbulb,
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
  TriangleAlert,
  Upload,
  Users,
  Zap,
  type LucideIcon
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { CalloutBlock as CalloutBlockType } from "@/types/marketing-blocks"

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

interface CalloutBlockProps {
  block: CalloutBlockType
}

const variantConfig = {
  info: {
    icon: Info,
    className:
      "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30"
  },
  warning: {
    icon: TriangleAlert,
    className:
      "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30"
  },
  tip: {
    icon: Lightbulb,
    className:
      "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30"
  }
}

function resolveIcon(
  iconStr: string | undefined,
  fallback: LucideIcon
): { type: "lucide"; Icon: LucideIcon } | { type: "emoji"; text: string } {
  if (!iconStr) return { type: "lucide", Icon: fallback }
  const mapped = iconMap[iconStr]
  if (mapped) return { type: "lucide", Icon: mapped }
  return { type: "emoji", text: iconStr }
}

export function CalloutBlock({ block }: CalloutBlockProps) {
  const variant = block.variant || "info"
  const config = variantConfig[variant]
  const resolved = resolveIcon(block.icon, config.icon)

  return (
    <section className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
      >
        <Alert className={cn("mx-auto max-w-3xl", config.className)}>
          <div className="flex gap-4">
            {resolved.type === "lucide" ? (
              <resolved.Icon className="mt-0.5 size-5 shrink-0" />
            ) : (
              <span className="text-2xl">{resolved.text}</span>
            )}
            <div>
              <AlertTitle className="text-base font-semibold">
                {block.title}
              </AlertTitle>
              <AlertDescription className="text-muted-foreground mt-1 leading-relaxed">
                {block.body}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      </motion.div>
    </section>
  )
}
