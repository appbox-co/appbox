'use client'

import dynamic from 'next/dynamic'

// Import Vortex with ssr: false
const Vortex = dynamic(() => import('./vortex'), { ssr: false })

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
  snow?: boolean
  snowBaseTTL?: number
  snowRangeTTL?: number
  fadeTimeFactor?: number
}

export function ClientVortexWrapper(props: VortexWrapperProps) {
  return <Vortex {...props} />
}
