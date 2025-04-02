"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  CSSProperties,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react"

interface Sparkle {
  id: string
  x: string
  y: string
  color: string
  delay: number
  scale: number
}

interface SparklesTextProps {
  /**
   * @default <div />
   * @type ReactElement
   * @description
   * The component to be rendered as the text
   * */
  as?: ReactElement

  /**
   * @default ""
   * @type string
   * @description
   * The className of the text
   */
  className?: string

  /**
   * @required
   * @type string
   * @description
   * The text to be displayed
   * */
  text: string

  /**
   * @default 10
   * @type number
   * @description
   * The count of sparkles
   * */
  sparklesCount?: number

  /**
   * @default "{first: '#9E7AFF', second: '#FE8BBB'}"
   * @type string
   * @description
   * The colors of the sparkles
   * */
  colors?: {
    first: string
    second: string
  }
}

function SparklesText({
  text,
  colors = { first: "#9E7AFF", second: "#FE8BBB" },
  className,
  sparklesCount = 10,
  ...props
}: SparklesTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([])

  // Memoize generateStar function with useCallback
  const generateStar = useCallback((): Sparkle => {
    const starX = `${Math.random() * 100}%`
    const starY = `${Math.random() * 100}%`
    const color = Math.random() > 0.5 ? colors.first : colors.second
    const delay = Math.random() * 2
    const scale = Math.random() * 1 + 0.3
    const id = `${starX}-${starY}-${Date.now()}`
    return { id, x: starX, y: starY, color, delay, scale }
  }, [colors.first, colors.second])

  // Now include generateStar in the dependency array
  useEffect(() => {
    const newSparkles = Array.from({ length: sparklesCount }, generateStar)
    setSparkles(newSparkles)
  }, [colors.first, colors.second, sparklesCount, generateStar])

  return (
    <div
      className={cn("text-6xl font-bold", className)}
      {...props}
      style={
        {
          "--sparkles-first-color": `${colors.first}`,
          "--sparkles-second-color": `${colors.second}`,
        } as CSSProperties
      }
    >
      <span className="relative inline-block">
        {sparkles.map((sparkle) => (
          <Sparkle
            key={sparkle.id}
            sparkle={sparkle}
            setSparkles={setSparkles}
            generateStar={generateStar}
          />
        ))}
        <strong>{text}</strong>
      </span>
    </div>
  )
}

interface SparkleProps {
  sparkle: Sparkle
  setSparkles: React.Dispatch<React.SetStateAction<Sparkle[]>>
  generateStar: () => Sparkle
}

// Each Sparkle animates once, then triggers its own replacement.
function Sparkle({ sparkle, setSparkles, generateStar }: SparkleProps) {
  const { id, x, y, color, delay, scale } = sparkle

  const handleAnimationComplete = () => {
    // Replace this star with a newly generated one
    setSparkles((current) =>
      current.map((s) => (s.id === id ? generateStar() : s))
    )
  }

  return (
    <motion.svg
      key={id}
      className="pointer-events-none absolute z-20"
      initial={{ opacity: 0, left: x, top: `calc(${y} - 0.5rem)` }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, scale, 0],
        rotate: [75, 120, 150],
      }}
      transition={{
        duration: 2, // Adjust as needed for desired speed
        delay,
      }}
      onAnimationComplete={handleAnimationComplete}
      width="21"
      height="21"
      viewBox="0 0 21 21"
    >
      <path
        d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
        fill={color}
      />
    </motion.svg>
  )
}

export { SparklesText }
