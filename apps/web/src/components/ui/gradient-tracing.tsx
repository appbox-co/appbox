"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GradientTracingProps {
  width: number
  height: number
  baseColor?: string
  gradientColors?: [string, string, string]
  animationDuration?: number
  strokeWidth?: number
  path?: string
  className?: string
  opacity?: number
}

export default function GradientTracing(props: GradientTracingProps) {
  const {
    width,
    height,
    baseColor = "black",
    gradientColors = ["#2EB9DF", "#2EB9DF", "#9E00FF"],
    animationDuration = 5,
    strokeWidth = 1,
    className,
    opacity = 1
  } = props

  const gradientId = `pulse-${Math.random().toString(36).substring(2, 11)}`

  return (
    <div
      className={cn("relative", className)}
      style={{ width, height, opacity }}
    >
      <svg width={width} height={height} viewBox="0 0 161 170" fill="none">
        <g strokeWidth={strokeWidth} fill="none" fillRule="evenodd">
          {/* Base layer with low-opacity stroke */}
          <g stroke={baseColor} strokeOpacity="0">
            <path d="M80.480628,0.547265265 L160.427241,36.0900032 L160.499759,133.801211 L153.068633,137.112892 L81.0011238,169.229772 L81.0009996,71.351267 L1.22926171,35.8423953 L80.480628,0.547265265 Z M152.585375,50.4897451 L93.7986825,76.7021663 L93.7986825,155.85229 L152.585375,129.639869 L152.585375,99.7534172 L143.174456,94.4158258 L152.585375,80.685758 L152.585375,50.4897451 Z" />
            <path d="M30,88.9248734 L49,97.5258859 L49,87.7512656 L30,79.1502531 L30,88.9248734 Z M68,155 L49,146.398988 L49,117.075127 L30,108.474114 L30,137.797975 L11,129.196963 L11,51 L68,76.8030375 L68,155 Z" />
            <polygon points="135 108 115 116.426977 115 126 135 117.573023" />
            <polygon points="135 79 115 87.4269774 115 97 135 88.5730226" />
          </g>

          {/* Same shapes, but stroked with the animated gradient */}
          <g stroke={`url(#${gradientId})`} strokeLinecap="round">
            <path d="M80.480628,0.547265265 L160.427241,36.0900032 L160.499759,133.801211 L153.068633,137.112892 L81.0011238,169.229772 L81.0009996,71.351267 L1.22926171,35.8423953 L80.480628,0.547265265 Z M152.585375,50.4897451 L93.7986825,76.7021663 L93.7986825,155.85229 L152.585375,129.639869 L152.585375,99.7534172 L143.174456,94.4158258 L152.585375,80.685758 L152.585375,50.4897451 Z" />
            <path d="M30,88.9248734 L49,97.5258859 L49,87.7512656 L30,79.1502531 L30,88.9248734 Z M68,155 L49,146.398988 L49,117.075127 L30,108.474114 L30,137.797975 L11,129.196963 L11,51 L68,76.8030375 L68,155 Z" />
            <polygon points="135 108 115 116.426977 115 126 135 117.573023" />
            <polygon points="135 79 115 87.4269774 115 97 135 88.5730226" />
          </g>
        </g>
        <defs>
          <motion.linearGradient
            animate={{
              x1: [0, width * 2],
              x2: [0, width]
            }}
            transition={{
              duration: animationDuration,
              repeat: Infinity,
              repeatDelay: 5,
              ease: "linear"
            }}
            id={gradientId}
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={gradientColors[0]} stopOpacity="0" />
            <stop stopColor={gradientColors[1]} />
            <stop offset="1" stopColor={gradientColors[2]} stopOpacity="0" />
          </motion.linearGradient>
        </defs>
      </svg>
    </div>
  )
}
