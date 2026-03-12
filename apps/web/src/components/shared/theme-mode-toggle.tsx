"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

interface ThemeModeToggleProps {
  messages: {
    dark: string
    light: string
    system: string
  }
}

const cycle = ["light", "system", "dark"] as const

const spring = {
  type: "spring" as const,
  stiffness: 350,
  damping: 26
}

const rays = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * 45 * Math.PI) / 180
  return {
    x1: 12 + 6.5 * Math.cos(angle),
    y1: 12 + 6.5 * Math.sin(angle),
    x2: 12 + 9.5 * Math.cos(angle),
    y2: 12 + 9.5 * Math.sin(angle)
  }
})

export function ThemeModeToggle({ messages }: ThemeModeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [displayTheme, setDisplayTheme] = useState<string>("system")
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const isHoveredRef = useRef(false)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  // Keep local icon state in sync with next-themes updates (including other tabs)
  useEffect(() => {
    if (!mounted) {
      return
    }
    queueMicrotask(() => setDisplayTheme(theme ?? "system"))
  }, [mounted, theme])

  const labelMap: Record<string, string> = {
    light: messages.light,
    system: messages.system,
    dark: messages.dark
  }

  const currentIndex = cycle.indexOf(displayTheme as (typeof cycle)[number])
  const nextTheme = cycle[(currentIndex + 1) % cycle.length]

  const handleClick = () => {
    setDisplayTheme(nextTheme)
    setTheme(nextTheme)
    if (isHoveredRef.current) {
      setTooltipOpen(true)
    }
  }

  const isLight = displayTheme === "light"
  const isDark = displayTheme === "dark"
  const isSystem = displayTheme === "system"

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <span className="size-[1.15rem]" />
      </Button>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            onMouseEnter={() => {
              isHoveredRef.current = true
              setTooltipOpen(true)
            }}
            onMouseLeave={() => {
              isHoveredRef.current = false
              setTooltipOpen(false)
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* ── Sun ── */}
              <motion.circle
                cx="12"
                cy="12"
                initial={{ r: 0, opacity: 0 }}
                animate={{
                  r: isLight ? 4.5 : 0,
                  opacity: isLight ? 1 : 0
                }}
                transition={spring}
              />
              <motion.g
                initial={{ opacity: 0, rotate: 45, scale: 0.4 }}
                animate={{
                  opacity: isLight ? 1 : 0,
                  rotate: isLight ? 0 : 45,
                  scale: isLight ? 1 : 0.4
                }}
                transition={spring}
                style={{ transformOrigin: "12px 12px" }}
              >
                {rays.map((ray, i) => (
                  <line
                    key={i}
                    x1={ray.x1}
                    y1={ray.y1}
                    x2={ray.x2}
                    y2={ray.y2}
                  />
                ))}
              </motion.g>

              {/* ── Moon (Lucide path — proper large crescent) ── */}
              <motion.path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                initial={{ opacity: 0, scale: 0.3, rotate: 30 }}
                animate={{
                  opacity: isDark ? 1 : 0,
                  scale: isDark ? 1 : 0.3,
                  rotate: isDark ? 0 : 30
                }}
                transition={spring}
                style={{ transformOrigin: "12px 12px" }}
              />

              {/* ── Monitor ── */}
              <motion.rect
                x="3"
                y="4"
                width="18"
                height="12"
                rx="2"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{
                  opacity: isSystem ? 1 : 0,
                  scale: isSystem ? 1 : 0.4
                }}
                transition={spring}
                style={{ transformOrigin: "12px 10px" }}
              />
              <motion.line
                x1="12"
                y1="16"
                x2="12"
                y2="20"
                initial={{ opacity: 0 }}
                animate={{ opacity: isSystem ? 1 : 0 }}
                transition={spring}
              />
              <motion.line
                x1="8"
                y1="20"
                x2="16"
                y2="20"
                initial={{ opacity: 0 }}
                animate={{ opacity: isSystem ? 1 : 0 }}
                transition={spring}
              />
            </svg>
            <span className="sr-only">{labelMap[displayTheme]}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {labelMap[displayTheme]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
