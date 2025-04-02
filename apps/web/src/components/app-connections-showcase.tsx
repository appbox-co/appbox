'use client'

import { useRef, useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { AnimatedBeam } from './magicui/animated-beam'
import { App } from '@/lib/appbox/api/useApps'
import { cn } from '@/lib/utils'
import * as React from 'react'
import { Icons } from '@/components/icons'

interface AppConnectionsShowcaseProps {
  apps: App[]
  title: string
  description: string
}

export function AppConnectionsShowcase({
  apps = [],
  title,
  description,
}: AppConnectionsShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const [appRefs, setAppRefs] = useState<
    React.RefObject<HTMLDivElement | null>[]
  >([])
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })
  const [isClient, setIsClient] = useState(false)
  const [displayApps, setDisplayApps] = useState<App[]>([])

  // Helper function to get the correct icon URL
  function getIconUrl(iconImage: string): string {
    if (!iconImage) {
      return 'https://api.appbox.co/assets/images/apps/placeholder.png'
    }

    try {
      if (iconImage.startsWith('http')) {
        return iconImage
      } else {
        return `https://api.appbox.co/assets/images/apps/icons/${iconImage}`
      }
    } catch (e) {
      return 'https://api.appbox.co/assets/images/apps/placeholder.png'
    }
  }

  // Function to shuffle an array
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Mark when we're in the client
  useEffect(() => {
    setIsClient(true)

    // Shuffle the apps only on the client side
    setDisplayApps(shuffleArray([...apps]))

    // Initialize refs for these apps
    setAppRefs(apps.map(() => React.createRef<HTMLDivElement>()))
  }, [apps])

  // Calculate static positions for icons
  function getStaticPosition(index: number, total: number) {
    const angleStep = (2 * Math.PI) / total
    const angle = index * angleStep
    const radius = 220
    return {
      left: `calc(50% + ${radius * Math.cos(angle)}px)`,
      top: `calc(50% + ${radius * Math.sin(angle)}px)`,
    }
  }

  // Choose which apps to display based on client state
  const appsToDisplay = isClient ? displayApps : apps

  return (
    <section className="py-12" ref={inViewRef} id="app-connections-section">
      <div className="container">
        <div className="mx-auto ax-w-[58rem] text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            {description}
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative w-full max-w-4xl mx-auto overflow-hidden aspect-[4/3]"
        >
          {/* Static SVG lines for non-JS environments */}
          {!isClient && (
            <svg
              className="absolute inset-0 w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {apps.map((_, i) => {
                const pos = getStaticPosition(i, apps.length)
                // Extract numeric values from CSS calc
                const leftMatch = pos.left.match(/calc\(50% \+ ([-\d.]+)px\)/)
                const topMatch = pos.top.match(/calc\(50% \+ ([-\d.]+)px\)/)
                const x2 = leftMatch ? parseFloat(leftMatch[1]) + 'px' : '0'
                const y2 = topMatch ? parseFloat(topMatch[1]) + 'px' : '0'

                return (
                  <line
                    key={`static-line-${i}`}
                    x1="50%"
                    y1="50%"
                    x2={`calc(50% + ${x2})`}
                    y2={`calc(50% + ${y2})`}
                    stroke="rgba(var(--color-primary), 0.2)"
                    strokeWidth="1"
                  />
                )
              })}
            </svg>
          )}

          {/* Central Appbox emblem */}
          <div
            ref={centerRef}
            className={cn(
              'absolute z-10 flex size-28 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm transition-all transform-gpu',
              inView && isClient ? 'opacity-100 scale-100' : 'opacity-100' // Always visible for non-JS
            )}
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%) scale(1)',
              transition: isClient
                ? 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out'
                : 'none',
            }}
          >
            <Icons.emblem className="h-20 w-20" />
          </div>

          {/* App icons arranged in a circle */}
          {appsToDisplay.map((app, index) => {
            // Get position (dynamic or static)
            const pos = getStaticPosition(index, appsToDisplay.length)

            return (
              <div
                key={app.display_name}
                ref={isClient ? appRefs[index] : undefined}
                className={cn(
                  'absolute z-10 flex size-12 items-center justify-center rounded-full bg-white p-2 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] border-2 border-muted transform-gpu',
                  inView && isClient ? 'opacity-100' : 'opacity-100' // Always visible for non-JS
                )}
                style={{
                  left: pos.left,
                  top: pos.top,
                  transform: 'translate(-50%, -50%) scale(1)',
                  transition: isClient
                    ? `opacity 0.4s ease-in-out ${index * 0.1}s, transform 0.4s ease-in-out ${index * 0.1}s`
                    : 'none',
                }}
              >
                <div className="relative h-8 w-8">
                  <Image
                    src={getIconUrl(app.icon_image)}
                    alt={app.display_name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )
          })}

          {/* Animated beams connecting apps to center - only when JS is enabled */}
          {isClient &&
            inView &&
            containerRef.current &&
            centerRef.current &&
            appRefs.length > 0 &&
            appRefs.every((ref) => ref.current) && (
              <>
                {appRefs.map((appRef, i) => (
                  <AnimatedBeam
                    key={`beam-${i}`}
                    containerRef={containerRef}
                    fromRef={appRef}
                    toRef={centerRef}
                    curvature={Math.random() * 40 - 20}
                    reverse={i % 2 === 0}
                  />
                ))}
              </>
            )}
        </div>
      </div>
    </section>
  )
}
