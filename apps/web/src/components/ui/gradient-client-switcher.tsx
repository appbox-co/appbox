"use client"

import { useEffect, useState } from "react"
import { ClientGradientWrapper } from "@/components/ui/client-gradient-wrapper"

interface GradientSwitcherProps {
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

export function ClientGradientSwitcher(props: GradientSwitcherProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Only render the client gradient component after mounting
  useEffect(() => {
    // Hide the static server-rendered version
    const staticGradient = document.querySelector(".static-gradient-wrapper")
    if (staticGradient) {
      staticGradient.classList.add("opacity-0")
    }

    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return <ClientGradientWrapper {...props} />
}
