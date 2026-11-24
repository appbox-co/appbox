"use client"

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject
} from "react"

/** Waits, then keeps waiting while the scene is off screen. */
export type Sleep = (ms: number) => Promise<void>

/**
 * Pauses an element's CSS and SVG animations while it is off screen, and
 * reports each change.
 */
function watchVisibility(
  element: HTMLElement,
  onChange: (visible: boolean) => void
) {
  const svgs = () => [...element.querySelectorAll("svg")]
  const observer = new IntersectionObserver(
    ([entry]) => {
      element.classList.toggle("ks-paused", !entry.isIntersecting)
      svgs().forEach((svg) =>
        entry.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations()
      )
      onChange(entry.isIntersecting)
    },
    { threshold: 0.15 }
  )
  observer.observe(element)
  return () => observer.disconnect()
}

const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches

/** For animations that run by themselves (CSS, SVG): stop them off screen. */
export function usePauseOffscreen(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (reducedMotion()) {
      element.querySelectorAll("svg").forEach((svg) => svg.pauseAnimations())
      return
    }
    return watchVisibility(element, () => {})
  }, [ref])
}

class SceneStopped extends Error {}

/**
 * Runs a scene's script once it first comes on screen. The script is one
 * long-lived async function with its own loop; `sleep` holds it while the
 * scene is off screen and ends it when the component unmounts. With reduced
 * motion the scene keeps its first frame and the script never runs.
 */
export function useSceneScript(
  ref: RefObject<HTMLElement | null>,
  script: (sleep: Sleep) => Promise<void>
) {
  // The script only calls state setters, which never change, so the first one is kept.
  const scriptRef = useRef(script)

  useEffect(() => {
    const element = ref.current
    if (!element || reducedMotion()) return

    let stopped = false
    let visible = false
    let started = false
    let wake = () => {}

    const sleep: Sleep = async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms))
      while (!visible && !stopped) {
        await new Promise<void>((resolve) => (wake = resolve))
      }
      if (stopped) throw new SceneStopped()
    }

    const unwatch = watchVisibility(element, (isVisible) => {
      visible = isVisible
      if (!isVisible) return
      wake()
      if (started) return
      started = true
      scriptRef.current(sleep).catch((error) => {
        if (!(error instanceof SceneStopped)) throw error
      })
    })

    return () => {
      stopped = true
      wake()
      unwatch()
    }
  }, [ref])
}

/**
 * A fixed-size illustration, drawn at `width` × `height` and scaled to the
 * width of its cell, never larger than the real thing. It is a picture of the
 * dashboard, so it is hidden from assistive technology and can't be focused
 * or clicked.
 */
export function Stage({
  width,
  height,
  sceneRef,
  children
}: {
  width: number
  height: number
  sceneRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const fit = () =>
      stage.style.setProperty(
        "--s",
        Math.min(1, stage.clientWidth / width).toFixed(4)
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
