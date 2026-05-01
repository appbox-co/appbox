"use client"

import { useEffect, useState, type CSSProperties } from "react"
import Image from "next/image"
import { useInView } from "react-intersection-observer"
import { App } from "@/api/appbox/hooks/use-apps"
import { Icons } from "@/components/shared/icons"

interface ClientAppConnectionsProps {
  apps: App[]
  headline1: string
  headline2: string
  description: string
  visualTitle: string
  visualDescription: string
  highlights: {
    title: string
    description: string
  }[]
}

export function ClientAppConnections({
  apps = [],
  headline1,
  headline2,
  description,
  visualTitle,
  visualDescription,
  highlights
}: ClientAppConnectionsProps) {
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
    queueMicrotask(() => {
      setIsClient(true)
      setDisplayApps(shuffleArray([...apps]))
    })
  }, [apps])

  // Handle beam creation with delay when component comes into view
  useEffect(() => {
    if (inView && isClient) {
      // Delay showing beams until icons are stable
      const timer = setTimeout(() => {
        setShowBeams(true)
      }, 150)

      return () => clearTimeout(timer)
    } else {
      queueMicrotask(() => setShowBeams(false))
    }
  }, [inView, isClient])

  function getNodePosition(index: number, total: number) {
    if (total === 0) {
      return {
        x: 50,
        y: 50
      }
    }

    const angleStep = (2 * Math.PI) / total
    const angle = -Math.PI / 2 + index * angleStep
    const radiusX = 36
    const radiusY = 34

    return {
      x: 50 + radiusX * Math.cos(angle),
      y: 50 + radiusY * Math.sin(angle)
    }
  }

  // Choose which apps to display based on client state
  const appsToDisplay = (isClient ? displayApps : apps).slice(0, 8)
  const graphStyle = {
    "--node-count": appsToDisplay.length
  } as CSSProperties
  const graphContentVisible = !isClient || inView
  const connectionNodes = appsToDisplay.map((app, index) => ({
    app,
    ...getNodePosition(index, appsToDisplay.length)
  }))
  const getConnectionGeometry = (node: { x: number; y: number }) => {
    const dx = node.x - 50
    const dy = node.y - 50
    const distance = Math.hypot(dx, dy)
    const unitX = distance === 0 ? 0 : dx / distance
    const unitY = distance === 0 ? 0 : dy / distance
    const startOffset = 9
    const endOffset = 5.4

    return {
      x1: 50 + unitX * startOffset,
      y1: 50 + unitY * startOffset,
      x2: node.x - unitX * endOffset,
      y2: node.y - unitY * endOffset
    }
  }

  const getBeamTiming = (appName: string) => {
    const hash = Array.from(appName).reduce(
      (value, char) => (value * 31 + char.charCodeAt(0)) % 10000,
      17
    )
    const seed = hash / 10000
    const durationValue = 4.4 + seed * 1.6

    return {
      duration: `${durationValue.toFixed(2)}s`,
      begin: `-${(seed * durationValue).toFixed(2)}s`
    }
  }

  return (
    <section
      className="py-20 sm:py-28"
      ref={inViewRef}
      id="app-connections-section"
    >
      <div>
        <div className="mx-auto max-w-[980px] text-center">
          <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {headline1}
            <br />
            <span className="bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {headline2}
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-2xl shadow-blue-100/70 dark:border-white/10 dark:bg-[#05060d] dark:shadow-indigo-950/20 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(99,102,241,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(239,246,255,0.45)_48%,rgba(255,255,255,0.72))] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.22),transparent_32%),radial-gradient(circle_at_82%_24%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_42%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-size-[48px_48px] opacity-70 dark:bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] dark:opacity-30" />

            <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="flex flex-col justify-between gap-8">
                <div>
                  <div className="inline-flex items-center rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-medium uppercase tracking-widest text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-indigo-200">
                    Appbox Mesh
                  </div>
                  <h3 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                    {visualTitle}
                  </h3>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-white/60 sm:text-base">
                    {visualDescription}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {highlights.map((highlight) => (
                    <div
                      key={highlight.title}
                      className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm shadow-blue-100/50 backdrop-blur dark:border-white/10 dark:bg-white/4 dark:shadow-none"
                    >
                      <h4 className="text-sm font-semibold text-slate-950 dark:text-white">
                        {highlight.title}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/55">
                        {highlight.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="relative min-h-[420px] overflow-hidden rounded-[1.5rem] border border-blue-100/80 bg-blue-50/50 shadow-inner shadow-blue-100/70 dark:border-white/10 dark:bg-black/30 dark:shadow-none sm:min-h-[520px]"
                style={graphStyle}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.76),transparent_60%)] dark:bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_55%)]" />

                {connectionNodes.length > 0 && (
                  <svg
                    className="absolute inset-0 z-10 size-full overflow-visible"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      {connectionNodes.map((node, index) => {
                        const geometry = getConnectionGeometry(node)
                        const { begin, duration } = getBeamTiming(
                          node.app.display_name
                        )
                        const xValues = `${geometry.x1};${geometry.x1};${geometry.x2};${geometry.x2};0`
                        const yValues = `${geometry.y1};${geometry.y1};${geometry.y2};${geometry.y2};0`

                        return (
                          <radialGradient
                            key={`beam-gradient-${node.app.display_name}`}
                            id={`beam-gradient-${index}`}
                            cx={geometry.x1}
                            cy={geometry.y1}
                            gradientUnits="userSpaceOnUse"
                            r="0"
                          >
                            <stop offset="0" stopColor="#60a5fa" />
                            <stop offset="0.4" stopColor="#0f3ea8" />
                            <stop
                              offset="1"
                              stopColor="#071f6b"
                              stopOpacity="0"
                            />
                            <animate
                              attributeName="cx"
                              begin={begin}
                              dur={duration}
                              keyTimes="0;0.06;0.22;0.3;1"
                              repeatCount="indefinite"
                              values={xValues}
                            />
                            <animate
                              attributeName="cy"
                              begin={begin}
                              dur={duration}
                              keyTimes="0;0.06;0.22;0.3;1"
                              repeatCount="indefinite"
                              values={yValues}
                            />
                            <animate
                              attributeName="r"
                              begin={begin}
                              dur={duration}
                              keyTimes="0;0.06;0.22;0.3;1"
                              repeatCount="indefinite"
                              values="0;7;7;0;0"
                            />
                          </radialGradient>
                        )
                      })}
                      <filter
                        id="beam-glow"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                      >
                        <feGaussianBlur stdDeviation="1.6" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <g
                      className="text-slate-400/80 dark:text-slate-400"
                      opacity="0.3"
                    >
                      {[26, 38, 50, 62, 74, 86].map((y) => (
                        <path
                          key={`grid-row-${y}`}
                          d={`M 6 ${y} Q 50 ${y + 5} 94 ${y}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.18"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                      {[12, 24, 36, 50, 64, 76, 88].map((x) => (
                        <path
                          key={`grid-column-${x}`}
                          d={`M 50 50 L ${x} 96`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.16"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                    </g>

                    {connectionNodes.map((node, index) => {
                      const geometry = getConnectionGeometry(node)
                      const { begin, duration } = getBeamTiming(
                        node.app.display_name
                      )

                      return (
                        <g key={`connection-${node.app.display_name}`}>
                          <line
                            x1={geometry.x1}
                            y1={geometry.y1}
                            x2={geometry.x2}
                            y2={geometry.y2}
                            className="text-slate-400/55 dark:text-slate-400/30"
                            stroke="currentColor"
                            strokeWidth="0.28"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                          <g opacity={showBeams ? 1 : 0}>
                            <path
                              d={`M ${geometry.x1} ${geometry.y1} L ${geometry.x2} ${geometry.y2}`}
                              fill="none"
                              stroke={`url(#beam-gradient-${index})`}
                              strokeLinecap="round"
                              strokeWidth="1.8"
                              vectorEffect="non-scaling-stroke"
                            >
                              <animate
                                attributeName="opacity"
                                begin={begin}
                                dur={duration}
                                keyTimes="0;0.06;0.22;0.3;1"
                                repeatCount="indefinite"
                                values="0;1;1;0;0"
                              />
                            </path>
                            <rect
                              x={node.x - 5.8}
                              y={node.y - 5.8}
                              width="11.6"
                              height="11.6"
                              rx="3"
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="1.2"
                              vectorEffect="non-scaling-stroke"
                            >
                              <animate
                                attributeName="opacity"
                                begin={begin}
                                dur={duration}
                                keyTimes="0;0.21;0.22;0.5;1"
                                calcMode="spline"
                                keySplines="0 0 1 1;0 0 1 1;0.16 1 0.3 1;0 0 1 1"
                                repeatCount="indefinite"
                                values="0;0;1;0;0"
                              />
                              <animate
                                attributeName="x"
                                begin={begin}
                                dur={duration}
                                keyTimes="0;0.21;0.22;0.5;1"
                                calcMode="spline"
                                keySplines="0 0 1 1;0 0 1 1;0.16 1 0.3 1;0 0 1 1"
                                repeatCount="indefinite"
                                values={`${node.x - 5.8};${node.x - 5.8};${node.x - 5.8};${node.x - 10};${node.x - 10}`}
                              />
                              <animate
                                attributeName="y"
                                begin={begin}
                                dur={duration}
                                keyTimes="0;0.21;0.22;0.5;1"
                                calcMode="spline"
                                keySplines="0 0 1 1;0 0 1 1;0.16 1 0.3 1;0 0 1 1"
                                repeatCount="indefinite"
                                values={`${node.y - 5.8};${node.y - 5.8};${node.y - 5.8};${node.y - 10};${node.y - 10}`}
                              />
                              <animate
                                attributeName="width"
                                begin={begin}
                                dur={duration}
                                keyTimes="0;0.21;0.22;0.5;1"
                                calcMode="spline"
                                keySplines="0 0 1 1;0 0 1 1;0.16 1 0.3 1;0 0 1 1"
                                repeatCount="indefinite"
                                values="11.6;11.6;11.6;20;20"
                              />
                              <animate
                                attributeName="height"
                                begin={begin}
                                dur={duration}
                                keyTimes="0;0.21;0.22;0.5;1"
                                calcMode="spline"
                                keySplines="0 0 1 1;0 0 1 1;0.16 1 0.3 1;0 0 1 1"
                                repeatCount="indefinite"
                                values="11.6;11.6;11.6;20;20"
                              />
                              <animate
                                attributeName="rx"
                                begin={begin}
                                dur={duration}
                                keyTimes="0;0.21;0.22;0.5;1"
                                calcMode="spline"
                                keySplines="0 0 1 1;0 0 1 1;0.16 1 0.3 1;0 0 1 1"
                                repeatCount="indefinite"
                                values="3;3;3;5.5;5.5"
                              />
                            </rect>
                          </g>
                        </g>
                      )
                    })}
                  </svg>
                )}

                <div
                  className="absolute left-1/2 top-1/2 z-30 flex size-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl border border-blue-200/80 bg-white/80 text-blue-950 shadow-2xl shadow-blue-200/60 backdrop-blur-md dark:border-indigo-300/20 dark:bg-white/10 dark:text-white dark:shadow-indigo-500/20 sm:size-28"
                  style={{
                    opacity: graphContentVisible ? 1 : 0,
                    transition: "opacity 0.5s ease-in-out"
                  }}
                >
                  <Icons.emblem className="size-16 sm:size-20" />
                </div>

                {connectionNodes.map(({ app, x, y }, index) => {
                  return (
                    <div key={app.display_name}>
                      <div
                        className="absolute z-20 flex size-14 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-blue-200/60 ring-1 ring-white/80 dark:border-white/10 dark:bg-white dark:shadow-black/30 dark:ring-white/60 sm:size-16"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: "translate(-50%, -50%)",
                          opacity: graphContentVisible ? 1 : 0,
                          transition: `opacity 0.4s ease-in-out ${index * 0.05}s`
                        }}
                      >
                        <div className="relative size-full">
                          <Image
                            src={getIconUrl(app.icon_image)}
                            alt={app.display_name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
