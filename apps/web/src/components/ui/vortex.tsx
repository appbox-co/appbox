"use client"

import { useEffect, useRef } from "react"
import * as React from "react"
import { motion } from "framer-motion"
import { createNoise3D } from "simplex-noise"
import { cn } from "@/lib/utils"

interface VortexProps {
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

export default function Vortex(props: VortexProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef(null)
  const particleCount = props.particleCount || 700
  const particlePropCount = 9
  const particlePropsLength = particleCount * particlePropCount
  const rangeY = props.rangeY || 100
  const DEFAULT_BASE_TTL = 600
  const DEFAULT_RANGE_TTL = 300
  const baseTTL = props.snow
    ? (props.snowBaseTTL ?? DEFAULT_BASE_TTL * 2)
    : DEFAULT_BASE_TTL
  const rangeTTL = props.snow
    ? (props.snowRangeTTL ?? DEFAULT_RANGE_TTL * 2)
    : DEFAULT_RANGE_TTL
  const baseSpeed = props.baseSpeed || 0.0
  const rangeSpeed = props.rangeSpeed || 1.5
  const baseRadius = props.baseRadius || 1
  const rangeRadius = props.rangeRadius || 2
  const baseHue = props.baseHue || 220
  const rangeHue = 100
  const noiseSteps = 3
  const xOff = 0.00125
  const yOff = 0.00125
  const zOff = 0.0005
  const backgroundColor = props.backgroundColor || "#000000"
  let tick = 0
  const noise3D = createNoise3D()
  let particleProps = new Float32Array(particlePropsLength)
  const center: [number, number] = [0, 0]

  const TAU: number = 2 * Math.PI
  const rand = (n: number): number => n * Math.random()
  const randRange = (n: number): number => n - rand(2 * n)
  const fadeTimeFactor = props.fadeTimeFactor ?? 1

  /**
   * If fadeTimeFactor = 0.1, then 0.05 (5%) of lifetime is fade-in, 0.05 is fade-out.
   * The rest (90%) is fully visible.
   */
  const fadeInOut = (t: number, m: number): number => {
    // halfFade is the duration of the fade-in (and also the fade-out) period
    const halfFade = (m * fadeTimeFactor) / 2
    const startFadeOut = m - halfFade
    // 1) Fade-in from 0 to halfFade
    if (t < halfFade) {
      return t / halfFade
    }
    // 2) Fade-out from (m - halfFade) to m
    else if (t > startFadeOut) {
      return 1 - (t - startFadeOut) / halfFade
    }
    // 3) Fully visible in the middle
    else {
      return 1
    }
  }
  const lerp = (n1: number, n2: number, speed: number): number =>
    (1 - speed) * n1 + speed * n2

  const setup = () => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (canvas && container) {
      const ctx = canvas.getContext("2d")

      if (ctx) {
        resize(canvas)
        initParticles()
        draw(canvas, ctx)
      }
    }
  }

  const initParticles = () => {
    tick = 0
    // simplex = new SimplexNoise();
    particleProps = new Float32Array(particlePropsLength)

    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
      initParticle(i)
    }
  }

  const initParticle = (i: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    let x, y, vx, vy, life, ttl, speed, radius, hue

    if (props.snow) {
      // Spawn near the top, but inside the visible canvas
      x = rand(canvas.width)
      y = rand(rangeY) // e.g. somewhere in [0..rangeY]
      vx = randRange(0.5) // slight horizontal drift
      vy = 0
      life = 0
      ttl = baseTTL + rand(rangeTTL)
      speed = baseSpeed + rand(rangeSpeed)
      radius = baseRadius + rand(rangeRadius)
      hue = baseHue + rand(rangeHue)
    } else {
      // existing logic
      x = rand(canvas.width)
      y = center[1] + randRange(rangeY)
      vx = 0
      vy = 0
      life = 0
      ttl = baseTTL + rand(rangeTTL)
      speed = baseSpeed + rand(rangeSpeed)
      radius = baseRadius + rand(rangeRadius)
      hue = baseHue + rand(rangeHue)
    }

    particleProps.set([x, y, vx, vy, life, ttl, speed, radius, hue], i)
  }

  const draw = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    tick++

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    drawParticles(ctx)
    renderGlow(canvas, ctx)
    renderToScreen(canvas, ctx)

    window.requestAnimationFrame(() => draw(canvas, ctx))
  }

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
      updateParticle(i, ctx)
    }
  }

  const updateParticle = (i: number, ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const i2 = 1 + i,
      i3 = 2 + i,
      i4 = 3 + i,
      i5 = 4 + i,
      i6 = 5 + i,
      i7 = 6 + i,
      i8 = 7 + i,
      i9 = 8 + i

    const x = particleProps[i]
    const y = particleProps[i2]
    let vx = particleProps[i3]
    let vy = particleProps[i4]
    const life = particleProps[i5]
    const ttl = particleProps[i6]
    const speed = particleProps[i7]
    const radius = particleProps[i8]
    const hue = particleProps[i9]

    if (props.snow) {
      // Snow: gently drift downward
      const x2 = x! + vx! * 0.5 // reduce horizontal speed
      const y2 = y! + speed!

      drawParticle(x!, y!, x2, y2, life!, ttl!, radius!, hue!, ctx)

      // Get current life value
      let currentLife = life!

      // Increment life counter
      currentLife++

      particleProps[i] = x2
      particleProps[i2] = y2
      particleProps[i3] = vx!
      particleProps[i4] = vy!
      particleProps[i5] = currentLife // Store updated life
    } else {
      // existing logic
      const n = noise3D(x! * xOff, y! * yOff, tick * zOff) * noiseSteps * TAU
      vx = lerp(vx!, Math.cos(n), 0.5)
      vy = lerp(vy!, Math.sin(n), 0.5)

      const x2 = x! + vx * speed!
      const y2 = y! + vy * speed!

      drawParticle(x!, y!, x2, y2, life!, ttl!, radius!, hue!, ctx)

      // Get current life value
      let currentLife = life!

      // Increment life counter
      currentLife++

      particleProps[i] = x2
      particleProps[i2] = y2
      particleProps[i3] = vx!
      particleProps[i4] = vy!
      particleProps[i5] = currentLife // Store updated life
    }

    // Reinit if out of bounds or lifespan exceeded
    const outOfBounds = checkBounds(x!, y!, canvas) || life! > ttl!
    if (outOfBounds) {
      initParticle(i)
    }
  }

  const drawParticle = (
    x: number,
    y: number,
    x2: number,
    y2: number,
    life: number,
    ttl: number,
    radius: number,
    hue: number,
    ctx: CanvasRenderingContext2D
  ) => {
    ctx.save()
    ctx.lineCap = "round"
    ctx.lineWidth = radius
    const alpha = fadeInOut(life, ttl)
    if (props.snow) {
      // Fade white in and out
      ctx.strokeStyle = `hsla(0, 0%, 100%, ${alpha})`
    } else {
      // Original color logic
      ctx.strokeStyle = `hsla(${hue},100%,60%,${alpha})`
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
  }

  const checkBounds = (x: number, y: number, canvas: HTMLCanvasElement) => {
    if (props.snow) {
      return x > canvas.width || x < 0 || y > canvas.height
    } else {
      return x > canvas.width || x < 0 || y > canvas.height || y < 0
    }
  }

  const resize = (canvas: HTMLCanvasElement) => {
    const { innerWidth, innerHeight } = window

    canvas.width = innerWidth
    canvas.height = innerHeight

    center[0] = 0.5 * canvas.width
    center[1] = 0.5 * canvas.height
  }

  const renderGlow = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) => {
    ctx.save()
    ctx.filter = "blur(8px) brightness(200%)"
    ctx.globalCompositeOperation = "lighter"
    ctx.drawImage(canvas, 0, 0)
    ctx.restore()

    ctx.save()
    ctx.filter = "blur(4px) brightness(200%)"
    ctx.globalCompositeOperation = "lighter"
    ctx.drawImage(canvas, 0, 0)
    ctx.restore()
  }

  const renderToScreen = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) => {
    ctx.save()
    ctx.globalCompositeOperation = "lighter"
    ctx.drawImage(canvas, 0, 0)
    ctx.restore()
  }

  useEffect(() => {
    setup()
    window.addEventListener("resize", () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (canvas && ctx) {
        resize(canvas)
      }
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Firefox has some issues with this component and becomes very laggy
   * so we are disabling it for Firefox for now
   * */
  if (
    typeof window !== "undefined" &&
    window.navigator.userAgent.includes("Firefox")
  )
    return null

  return (
    <div className={cn("relative size-full", props.containerClassName)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        ref={containerRef}
        className="absolute inset-0 z-0 flex size-full items-center justify-center bg-transparent"
      >
        <canvas ref={canvasRef}></canvas>
      </motion.div>

      <div className={cn("relative z-10", props.className)}>
        {props.children}
      </div>
    </div>
  )
}
