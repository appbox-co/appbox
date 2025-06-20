"use client"

import { useEffect, useRef, useState } from "react"
import * as React from "react"
import Image from "next/image"
import { useInView } from "react-intersection-observer"
import { Icons } from "@/components/icons"
import { App } from "@/lib/appbox/api/useApps"
import { AnimatedBeam } from "./magicui/animated-beam"

interface ClientAppConnectionsProps {
  apps: App[]
  title: string
  description: string
}

export function ClientAppConnections({
  apps = [],
  title,
  description
}: ClientAppConnectionsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const [appRefs, setAppRefs] = useState<
    React.RefObject<HTMLDivElement | null>[]
  >([])
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  })
  const [isClient, setIsClient] = useState(false)
  const [displayApps, setDisplayApps] = useState<App[]>([])
  const [showBeams, setShowBeams] = useState(false)

  // Helper function to get the correct icon URL
  function getIconUrl(iconImage: string): string {
    if (!iconImage) {
      return "https://api.appbox.co/assets/images/apps/placeholder.png"
    }

    try {
      if (iconImage.startsWith("http")) {
        return iconImage
      } else {
        return `https://api.appbox.co/assets/images/apps/icons/${iconImage}`
      }
    } catch (_e) {
      return "https://api.appbox.co/assets/images/apps/placeholder.png"
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

  // Mark when we're in the client and initialize
  useEffect(() => {
    setIsClient(true)

    // Shuffle the apps only on the client side
    setDisplayApps(shuffleArray([...apps]))

    // Initialize refs for these apps
    setAppRefs(apps.map(() => React.createRef<HTMLDivElement>()))
  }, [apps])

  // Handle beam creation with delay when component comes into view
  useEffect(() => {
    if (inView && isClient) {
      // Delay showing beams until icons are stable
      const timer = setTimeout(() => {
        setShowBeams(true)
      }, 600)

      return () => clearTimeout(timer)
    } else {
      setShowBeams(false)
    }
  }, [inView, isClient])

  // Calculate static positions for icons with the radius accessed directly from DOM
  function getStaticPosition(index: number, total: number) {
    const angleStep = (2 * Math.PI) / total
    const angle = index * angleStep

    return {
      // Calculate the percentage from center, plus the angle-based offset
      left: `50%`,
      top: `50%`,
      transform: `translate(-50%, -50%) translate(calc(var(--radius) * ${Math.cos(angle)}), calc(var(--radius) * ${Math.sin(angle)}))`
    }
  }

  // Choose which apps to display based on client state
  const appsToDisplay = isClient ? displayApps : apps

  return (
    <section className="pt-12" ref={inViewRef} id="app-connections-section">
      <div className="container">
        <div className="ax-w-[58rem] mx-auto text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-4xl">
            {title}
          </h2>
          <p className="text-muted-foreground mt-3 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            {description}
          </p>
        </div>

        <div ref={containerRef} className="app-connections-container">
          {/* Static SVG lines for non-JS environments */}
          {!isClient && (
            <svg
              className="absolute inset-0 size-full"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              {apps.map((_, i) => {
                // Calculate positions as percentages for SVG
                const radius = 35 // Percentage-based radius for viewBox 100x100
                const angleStep = (2 * Math.PI) / apps.length
                const angle = i * angleStep

                // Calculate positions as percentages (50% = 50 in viewBox 0-100)
                const x2 = 50 + radius * Math.cos(angle)
                const y2 = 50 + radius * Math.sin(angle)

                return (
                  <line
                    key={`static-line-${i}`}
                    x1="50"
                    y1="50"
                    x2={x2}
                    y2={y2}
                    stroke="rgba(var(--color-primary), 0.2)"
                    strokeWidth="0.5"
                  />
                )
              })}
            </svg>
          )}

          {/* Central Appbox emblem */}
          <div
            ref={centerRef}
            className="app-connections-center"
            style={{
              opacity: inView ? 1 : 0,
              transition: "opacity 0.5s ease-in-out"
            }}
          >
            <Icons.emblem className="size-[calc(var(--size)*0.7)]" />
          </div>

          {/* App icons */}
          {appsToDisplay.map((app, index) => {
            const pos = getStaticPosition(index, appsToDisplay.length)

            return (
              <div
                key={app.display_name}
                ref={isClient ? appRefs[index] : undefined}
                className="app-connections-icon"
                style={{
                  left: pos.left,
                  top: pos.top,
                  transform: pos.transform,
                  opacity: inView ? 1 : 0,
                  transition: `opacity 0.4s ease-in-out ${index * 0.05}s`
                }}
              >
                {/* Image stays proportional to the container */}
                <div className="relative size-[calc(var(--size)*0.7)]">
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

          {/* Animated beams connecting apps to center - only when JS is enabled and positions are stable */}
          {isClient &&
            showBeams &&
            inView &&
            containerRef.current &&
            centerRef.current &&
            appRefs.length > 0 &&
            appRefs.every((ref) => ref.current) && (
              <div
                className="beam-container"
                style={{
                  opacity: 0,
                  animation: "fadeIn 1s ease-in-out forwards",
                  position: "absolute",
                  inset: 0,
                  zIndex: 5
                }}
              >
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
              </div>
            )}
        </div>
      </div>
    </section>
  )
}
