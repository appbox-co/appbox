"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GradientTracingProps {
  width: number
  height: number
  baseColor?: string
  beamColor?: string
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
    beamColor = "#2EB9DF",
    gradientColors = ["#2EB9DF", "#2EB9DF", "#9E00FF"],
    animationDuration = 3,
    strokeWidth = 1,
    className,
    opacity = 1
  } = props

  // Path lengths (approximate)
  const path1Length = 1000
  const path2Length = 500
  const path3Length = 200
  const path4Length = 200

  // Generate unique IDs for the gradients
  const baseGradientId = `base-gradient-${Math.random().toString(36).substring(2, 9)}`
  const glowGradientId = `glow-gradient-${Math.random().toString(36).substring(2, 9)}`

  // State for the random glitch effect (foreground)
  const [outlineVisibility, setOutlineVisibility] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // State for pulse effect (background glow)
  const [glowIntensity, setGlowIntensity] = useState(0.4)
  const [glowWidth, setGlowWidth] = useState(strokeWidth * 2.5)

  // Setup the random glitch effect for the foreground
  useEffect(() => {
    const triggerGlitch = () => {
      // Randomly decide when the next glitch happens (between 0.5 and 3 seconds)
      const nextGlitchDelay = Math.random() * 3000 + 1000

      timeoutRef.current = setTimeout(() => {
        // Glitch effect: briefly hide the outline
        setOutlineVisibility(false)

        // After a very brief moment, restore visibility
        setTimeout(
          () => {
            setOutlineVisibility(true)

            // 30% chance of a double-glitch
            if (Math.random() < 0.5) {
              setTimeout(() => {
                setOutlineVisibility(false)
                setTimeout(() => {
                  setOutlineVisibility(true)
                  triggerGlitch()
                }, 50)
              }, 100)
            } else {
              triggerGlitch()
            }
          },
          40 + Math.random() * 40
        )
      }, nextGlitchDelay)
    }

    // Start the glitch effect
    triggerGlitch()

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Setup the pulse effect for the background glow
  useEffect(() => {
    let increasing = true

    const pulseInterval = setInterval(() => {
      setGlowIntensity((prev) => {
        if (prev >= 0.6) increasing = false
        if (prev <= 0.2) increasing = true
        return increasing ? prev + 0.02 : prev - 0.02
      })

      setGlowWidth((prev) => {
        if (prev >= strokeWidth * 3.5) increasing = false
        if (prev <= strokeWidth * 2) increasing = true
        return increasing ? prev + 0.1 : prev - 0.1
      })
    }, 60)

    // Cleanup
    return () => clearInterval(pulseInterval)
  }, [strokeWidth])

  return (
    <div
      className={cn("relative", className)}
      style={{ width, height, opacity }}
    >
      <svg width={width} height={height} viewBox="0 0 161 170" fill="none">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradient for background glow */}
          <linearGradient
            id={glowGradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={gradientColors[0]}
              stopOpacity={glowIntensity * opacity}
            />
            <stop
              offset="50%"
              stopColor={gradientColors[1]}
              stopOpacity={glowIntensity * opacity}
            />
            <stop
              offset="100%"
              stopColor={gradientColors[2]}
              stopOpacity={glowIntensity * opacity}
            />
          </linearGradient>

          {/* Gradient for foreground outline */}
          <linearGradient
            id={baseGradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={gradientColors[0]}
              stopOpacity={opacity}
            />
            <stop
              offset="50%"
              stopColor={gradientColors[1]}
              stopOpacity={opacity}
            />
            <stop
              offset="100%"
              stopColor={gradientColors[2]}
              stopOpacity={opacity}
            />
          </linearGradient>
        </defs>
        <g fill="none" fillRule="evenodd">
          {/* Background layer with pulsing glow effect */}
          <g
            stroke={`url(#${glowGradientId})`}
            style={{
              strokeWidth: glowWidth,
              filter: "blur(3px)",
              transition: "stroke-width 0.2s ease-out"
            }}
          >
            <path d="M80.480628,0.547265265 L160.427241,36.0900032 L160.499759,133.801211 L153.068633,137.112892 L81.0011238,169.229772 L81.0009996,71.351267 L1.22926171,35.8423953 L80.480628,0.547265265 Z M152.585375,50.4897451 L93.7986825,76.7021663 L93.7986825,155.85229 L152.585375,129.639869 L152.585375,99.7534172 L143.174456,94.4158258 L152.585375,80.685758 L152.585375,50.4897451 Z" />
            <path d="M30,88.9248734 L49,97.5258859 L49,87.7512656 L30,79.1502531 L30,88.9248734 Z M68,155 L49,146.398988 L49,117.075127 L30,108.474114 L30,137.797975 L11,129.196963 L11,51 L68,76.8030375 L68,155 Z" />
            <polygon points="135 108 115 116.426977 115 126 135 117.573023" />
            <polygon points="135 79 115 87.4269774 115 97 135 88.5730226" />
          </g>

          {/* Foreground layer with glitch effect */}
          <g
            stroke={`url(#${baseGradientId})`}
            strokeWidth={strokeWidth}
            style={{
              opacity: outlineVisibility ? 1 : 0,
              transition: outlineVisibility ? "opacity 0.1s ease-in" : "none"
            }}
          >
            <path d="M80.480628,0.547265265 L160.427241,36.0900032 L160.499759,133.801211 L153.068633,137.112892 L81.0011238,169.229772 L81.0009996,71.351267 L1.22926171,35.8423953 L80.480628,0.547265265 Z M152.585375,50.4897451 L93.7986825,76.7021663 L93.7986825,155.85229 L152.585375,129.639869 L152.585375,99.7534172 L143.174456,94.4158258 L152.585375,80.685758 L152.585375,50.4897451 Z" />
            <path d="M30,88.9248734 L49,97.5258859 L49,87.7512656 L30,79.1502531 L30,88.9248734 Z M68,155 L49,146.398988 L49,117.075127 L30,108.474114 L30,137.797975 L11,129.196963 L11,51 L68,76.8030375 L68,155 Z" />
            <polygon points="135 108 115 116.426977 115 126 135 117.573023" />
            <polygon points="135 79 115 87.4269774 115 97 135 88.5730226" />
          </g>

          {/* Animated beam paths remain unchanged */}
          <motion.path
            d="M80.480628,0.547265265 L160.427241,36.0900032 L160.499759,133.801211 L153.068633,137.112892 L81.0011238,169.229772 L81.0009996,71.351267 L1.22926171,35.8423953 L80.480628,0.547265265 Z M152.585375,50.4897451 L93.7986825,76.7021663 L93.7986825,155.85229 L152.585375,129.639869 L152.585375,99.7534172 L143.174456,94.4158258 L152.585375,80.685758 L152.585375,50.4897451 Z"
            stroke={beamColor}
            strokeLinecap="round"
            strokeWidth={strokeWidth * 1.2}
            strokeDasharray={`80 ${path1Length - 80}`}
            animate={{
              strokeDashoffset: [0, -path1Length]
            }}
            transition={{
              duration: animationDuration,
              repeat: Infinity,
              ease: "linear"
            }}
            filter="url(#glow)"
          />

          <motion.path
            d="M30,88.9248734 L49,97.5258859 L49,87.7512656 L30,79.1502531 L30,88.9248734 Z M68,155 L49,146.398988 L49,117.075127 L30,108.474114 L30,137.797975 L11,129.196963 L11,51 L68,76.8030375 L68,155 Z"
            stroke={beamColor}
            strokeLinecap="round"
            strokeWidth={strokeWidth * 1.2}
            strokeDasharray={`60 ${path2Length - 60}`}
            animate={{
              strokeDashoffset: [300, -200]
            }}
            transition={{
              duration: animationDuration * 0.8,
              repeat: Infinity,
              ease: "linear"
            }}
            filter="url(#glow)"
          />

          <motion.polygon
            points="135 108 115 116.426977 115 126 135 117.573023"
            stroke={beamColor}
            strokeLinecap="round"
            strokeWidth={strokeWidth * 1.2}
            strokeDasharray={`30 ${path3Length - 30}`}
            animate={{
              strokeDashoffset: [100, -100]
            }}
            transition={{
              duration: animationDuration * 0.5,
              repeat: Infinity,
              ease: "linear"
            }}
            filter="url(#glow)"
          />

          <motion.polygon
            points="135 79 115 87.4269774 115 97 135 88.5730226"
            stroke={beamColor}
            strokeLinecap="round"
            strokeWidth={strokeWidth * 1.2}
            strokeDasharray={`30 ${path4Length - 30}`}
            animate={{
              strokeDashoffset: [-50, -250]
            }}
            transition={{
              duration: animationDuration * 0.5,
              repeat: Infinity,
              ease: "linear"
            }}
            filter="url(#glow)"
          />
        </g>
      </svg>
    </div>
  )
}
