"use client"

import dynamic from "next/dynamic"

// Import Vortex with ssr: false
const Vortex = dynamic(() => import("./vortex"), { ssr: false })

type VortexMode = "default" | "snow"

// Define props type based on Vortex props
interface VortexWrapperProps {
  children?: React.ReactNode
  className?: string
  containerClassName?: string
  particleCount?: number
  rangeY?: number
  baseHue?: number
  baseSpeed?: number
  rangeSpeed?: number
  baseRadius?: number
  rangeRadius?: number
  backgroundColor?: string
  mode?: VortexMode
}

export function ClientVortexWrapper(props: VortexWrapperProps) {
  return <Vortex {...props} />
}
