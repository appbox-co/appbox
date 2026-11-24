"use client"

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject
} from "react"
import Image from "next/image"
import { cn } from "@cloudflare/kumo"
import { APP_ICON_BASE_URL } from "../shared"
import type { AppIcons } from "./catalogue"

/** Waits, then keeps waiting while the scene is off screen. */
export type Sleep = (ms: number) => Promise<void>

/**
 * A catalogue app's icon at any size, falling back to its initial when the
 * catalogue couldn't be read (staging can't reach it).
 */
export function SceneIcon({
  icons,
  name,
  size,
  className
}: {
  icons: AppIcons
  name: string
  size: number
  className?: string
}) {
  const icon = icons[name]
  if (!icon) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-kumo-tint font-medium text-kumo-subtle",
          className
        )}
        style={{ width: size, height: size }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    )
  }
  return (
    <Image
      src={`${APP_ICON_BASE_URL}${icon}`}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={cn("shrink-0 object-cover", className)}
    />
  )
}

/**
 * A fixed-size illustration, drawn at `width` × `height` and scaled to the
 * width of its cell (up to 1.3×). It is a picture of the dashboard, so it is
 * hidden from assistive technology and can't be focused or clicked.
 */
export function Stage({
  width,
  height,
  sceneRef,
  children
}: {
  width: number
  height: number
  sceneRef?: RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const fit = () =>
      stage.style.setProperty(
        "--s",
        Math.min(1.3, stage.clientWidth / width).toFixed(4)
      )
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [width])

  return (
    <div
      ref={stageRef}
      className="ks-stage"
      style={{ "--w": width, "--ar": `${width} / ${height}` } as CSSProperties}
    >
      <div
        ref={sceneRef}
        className="ks-scene"
        style={{ width, height }}
        aria-hidden="true"
        inert
      >
        {children}
      </div>
    </div>
  )
}

class SceneStopped extends Error {}

/**
 * Runs `script` over and over while the scene is on screen, and pauses it
 * (its timers, CSS animations and SVG animations) while it is not. With
 * reduced motion the scene keeps its first frame and nothing runs.
 */
export function useSceneLoop(
  ref: RefObject<HTMLElement | null>,
  script: (sleep: Sleep) => Promise<void>
) {
  const scriptRef = useRef(script)
  useEffect(() => {
    scriptRef.current = script
  })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const svgs = () => [...element.querySelectorAll("svg")]

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      svgs().forEach((svg) => svg.pauseAnimations())
      return
    }

    let stopped = false
    let visible = false
    let started = false
    let wake: (() => void) | null = null

    const sleep: Sleep = async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms))
      while (!visible && !stopped) {
        await new Promise<void>((resolve) => (wake = resolve))
      }
      if (stopped) throw new SceneStopped()
    }

    const run = async () => {
      try {
        for (;;) await scriptRef.current(sleep)
      } catch (error) {
        if (!(error instanceof SceneStopped)) throw error
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        element.classList.toggle("ks-paused", !visible)
        svgs().forEach((svg) =>
          visible ? svg.unpauseAnimations() : svg.pauseAnimations()
        )
        if (!visible) return
        wake?.()
        if (!started) {
          started = true
          void run()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(element)

    return () => {
      stopped = true
      wake?.()
      observer.disconnect()
    }
  }, [ref])
}
