"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BorderBeam } from "@/components/ui/border-beam"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import type { HeroBlock as HeroBlockType } from "@/types/marketing-blocks"

interface HeroBlockProps {
  block: HeroBlockType
  appName: string
  appId: number
  iconUrl?: string
}

interface CircuitTrace {
  d: string
  length: number
  color: string
  delay: number
  ex: number
  ey: number
}

function GlowingBeams({
  gradientFrom,
  gradientTo
}: {
  gradientFrom: string
  gradientTo: string
}) {
  const s = 700
  const cx = s / 2
  const cy = s / 2
  const c1 = gradientFrom
  const c2 = gradientTo

  const traces: CircuitTrace[] = [
    {
      d: `M${cx} ${cy} H${cx + 130} V${cy - 200}`,
      length: 330,
      color: c1,
      delay: 0,
      ex: cx + 130,
      ey: cy - 200
    },
    {
      d: `M${cx} ${cy} H${cx + 80} V${cy + 160}`,
      length: 240,
      color: c2,
      delay: 0.7,
      ex: cx + 80,
      ey: cy + 160
    },
    {
      d: `M${cx} ${cy} H${cx - 110} V${cy - 180}`,
      length: 290,
      color: c2,
      delay: 1.4,
      ex: cx - 110,
      ey: cy - 180
    },
    {
      d: `M${cx} ${cy} H${cx - 150} V${cy + 130}`,
      length: 280,
      color: c1,
      delay: 2.1,
      ex: cx - 150,
      ey: cy + 130
    },
    {
      d: `M${cx} ${cy} V${cy - 100} H${cx + 200}`,
      length: 300,
      color: c1,
      delay: 0.3,
      ex: cx + 200,
      ey: cy - 100
    },
    {
      d: `M${cx} ${cy} V${cy - 80} H${cx - 220}`,
      length: 300,
      color: c2,
      delay: 1.0,
      ex: cx - 220,
      ey: cy - 80
    },
    {
      d: `M${cx} ${cy} V${cy + 110} H${cx + 180}`,
      length: 290,
      color: c2,
      delay: 1.7,
      ex: cx + 180,
      ey: cy + 110
    },
    {
      d: `M${cx} ${cy} V${cy + 90} H${cx - 190}`,
      length: 280,
      color: c1,
      delay: 2.4,
      ex: cx - 190,
      ey: cy + 90
    },
    {
      d: `M${cx} ${cy} V${cy - 260}`,
      length: 260,
      color: c1,
      delay: 0.5,
      ex: cx,
      ey: cy - 260
    },
    {
      d: `M${cx} ${cy} V${cy + 240}`,
      length: 240,
      color: c2,
      delay: 1.6,
      ex: cx,
      ey: cy + 240
    },
    {
      d: `M${cx} ${cy} H${cx + 55} V${cy - 55} H${cx + 240}`,
      length: 295,
      color: c1,
      delay: 0.9,
      ex: cx + 240,
      ey: cy - 55
    },
    {
      d: `M${cx} ${cy} H${cx - 65} V${cy + 65} H${cx - 250}`,
      length: 315,
      color: c2,
      delay: 2.0,
      ex: cx - 250,
      ey: cy + 65
    },
    {
      d: `M${cx} ${cy} H${cx + 260}`,
      length: 260,
      color: c2,
      delay: 2.6,
      ex: cx + 260,
      ey: cy
    },
    {
      d: `M${cx} ${cy} H${cx - 270}`,
      length: 270,
      color: c1,
      delay: 1.3,
      ex: cx - 270,
      ey: cy
    },
    {
      d: `M${cx} ${cy} V${cy - 40} H${cx + 70} V${cy - 220}`,
      length: 290,
      color: c2,
      delay: 2.8,
      ex: cx + 70,
      ey: cy - 220
    },
    {
      d: `M${cx} ${cy} V${cy + 50} H${cx - 80} V${cy + 210}`,
      length: 290,
      color: c1,
      delay: 3.1,
      ex: cx - 80,
      ey: cy + 210
    }
  ]

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: s, height: s }}
    >
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        fill="none"
        className="absolute inset-0"
      >
        <defs>
          <filter id="circuit-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {traces.map((t, i) => (
          <g key={i}>
            <path
              d={t.d}
              stroke={t.color}
              strokeWidth="1"
              opacity="0.15"
              fill="none"
            />
            <path
              d={t.d}
              stroke={t.color}
              strokeWidth="3"
              opacity="0.05"
              fill="none"
              filter="url(#circuit-glow)"
            />
            <path
              d={t.d}
              stroke={t.color}
              strokeWidth="1.5"
              fill="none"
              filter="url(#circuit-glow)"
              strokeDasharray={`25 ${t.length}`}
              opacity="0.5"
            >
              <animate
                attributeName="stroke-dashoffset"
                values={`${t.length + 25};${-(t.length + 25)}`}
                dur="4s"
                repeatCount="indefinite"
                begin={`${t.delay}s`}
              />
            </path>
            <circle cx={t.ex} cy={t.ey} r="1.5" fill={t.color} opacity="0.2" />
          </g>
        ))}
      </svg>
    </div>
  )
}

export function HeroBlock({ block, appId, iconUrl }: HeroBlockProps) {
  const [deployOpen, setDeployOpen] = useState(false)
  const router = useRouter()
  const t = useTranslations("apps")
  const gradientFrom = block.gradient_from || "#6366f1"
  const gradientTo = block.gradient_to || "#8b5cf6"

  return (
    <section className="relative overflow-x-clip pt-8 md:pt-12">
      <div className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:pb-8">
        {iconUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 150 }}
            className="relative mb-6"
          >
            {/* Glow backdrop */}
            <div
              className="absolute -inset-8 rounded-full opacity-30 blur-2xl"
              style={{
                background: `radial-gradient(circle, ${gradientFrom}, ${gradientTo}, transparent 70%)`
              }}
            />
            {/* Beams extending beyond the icon */}
            <GlowingBeams gradientFrom={gradientFrom} gradientTo={gradientTo} />
            {/* Icon on top */}
            <div className="relative z-10 size-24 md:size-28">
              <div
                className="relative size-full overflow-hidden rounded-2xl p-[1.5px]"
                style={{
                  background: `linear-gradient(135deg, ${gradientFrom}66, ${gradientTo}44, ${gradientFrom}22)`
                }}
              >
                <div className="relative size-full overflow-hidden rounded-[calc(1rem-1.5px)] bg-white p-3 dark:bg-zinc-950">
                  <Image
                    src={iconUrl}
                    alt="App icon"
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <BorderBeam
                  duration={6}
                  colorFrom={gradientFrom}
                  colorTo={gradientTo}
                  borderWidth={1.5}
                />
              </div>
              <div
                className="absolute -inset-px -z-10 rounded-2xl opacity-40 blur-md"
                style={{
                  background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
                }}
              />
            </div>
          </motion.div>
        )}

        {block.badge && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <Badge
              variant="secondary"
              className="mb-4 px-4 py-1.5 text-sm font-medium"
            >
              {block.badge}
            </Badge>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10 text-center text-3xl font-bold leading-tight tracking-tighter dark:bg-linear-to-r dark:from-slate-50 dark:to-slate-200 dark:bg-clip-text dark:text-transparent md:text-6xl lg:text-7xl lg:leading-[1.1]"
        >
          {block.headline}
        </motion.h1>

        {block.subheadline && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-muted-foreground relative z-10 mx-auto mt-4 max-w-[750px] text-center text-lg sm:text-xl"
          >
            {block.subheadline}
          </motion.p>
        )}

        {(block.cta_text || block.website_url) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0 }}
            className="relative z-10 flex w-full flex-col items-center justify-center gap-3 py-4 sm:flex-row md:pb-10"
          >
            {block.cta_text && (
              <Button size="lg" onClick={() => setDeployOpen(true)}>
                {block.cta_text}
              </Button>
            )}
            {block.website_url && (
              <Button variant="outline" size="lg" asChild>
                <a
                  href={block.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit Website
                  <ExternalLink className="ml-2 size-4" />
                </a>
              </Button>
            )}
          </motion.div>
        )}
      </div>

      <div
        className="mt-4 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${gradientFrom}, ${gradientTo}, transparent)`
        }}
      />

      <Dialog open={deployOpen} onOpenChange={setDeployOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("detail.deploy_dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("detail.deploy_dialog.question")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                router.push("/#plans-section")
                setDeployOpen(false)
              }}
            >
              {t("detail.deploy_dialog.no")}
            </Button>
            <Button
              onClick={() => {
                window.location.href = `/appstore/app/${appId}`
                setDeployOpen(false)
              }}
            >
              {t("detail.deploy_dialog.yes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
