'use client'

import dynamic from 'next/dynamic'

// Import GradientTracing with ssr: false
const GradientTracing = dynamic(
  () => import('../../components/ui/gradient-tracing'),
  { ssr: false }
)

// Define props type based on GradientTracing props
interface GradientWrapperProps {
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

export function ClientGradientWrapper(props: GradientWrapperProps) {
  return <GradientTracing {...props} />
}
