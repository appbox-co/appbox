"use client"

import type { CSSProperties } from "react"
import { useTranslations } from "next-intl"
import { ArrowUpCircle, Ban, Download, Trash2, Zap } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { CyloDetail } from "@/api/cylos/cylos"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { MigrationAlert } from "@/components/dashboard/migration-alert"
import type { JobProgressData } from "@/lib/websocket/types"

/* -------------------------------------------------------------------------- */
/*  State config — app-level transitional states                              */
/* -------------------------------------------------------------------------- */

interface StateConfig {
  label: string
  description: (app: InstalledApp) => string
  color: string
  icon: LucideIcon
  showProgress: boolean
}

const MIGRATION_PHASE_KEYS: Record<number, string> = {
  1: "migrationPhase1",
  2: "migrationPhase2",
  3: "migrationPhase3",
  4: "migrationPhase4",
  5: "migrationPhase5",
  6: "migrationPhase6",
  7: "migrationPhase7",
  8: "migrationPhase8"
}

function formatMigrationReason(reason?: string): string | null {
  const trimmed = reason?.trim()
  if (!trimmed) return null
  return trimmed
}

function formatJobStatus(status: string, app: InstalledApp) {
  return status.replace(/APP/g, app.display_name).replace(/SERVICE/g, "appbox")
}

function getTransitionalDescription(
  app: InstalledApp,
  job?: JobProgressData,
  showPayloadMessage = false,
  t?: (key: string, values?: Record<string, string>) => string
) {
  if (app.status !== "installing" && app.status !== "updating") return null

  const trimmedStatus = job?.status?.trim()

  if (!trimmedStatus) {
    if (showPayloadMessage) {
      return app.status === "installing"
        ? (t?.("sendingInstallPayload") ??
            "Sending install payload to your appbox...")
        : (t?.("sendingUpdatePayload") ??
            "Sending update payload to your appbox...")
    }
    return (
      t?.("configuringApp", { appName: app.display_name }) ??
      `Configuring ${app.display_name}...`
    )
  }

  return `${formatJobStatus(trimmedStatus, app)}...`
}

const STATE_CONFIG: Record<string, StateConfig> = {
  installing: {
    label: "Installing",
    description: (app) =>
      getTransitionalDescription(app) ??
      `${app.display_name} is being installed on your appbox. This usually takes a few minutes.`,
    color: "#3b82f6",
    icon: Download,
    showProgress: true
  },
  updating: {
    label: "Updating",
    description: (app) => {
      const message = getTransitionalDescription(app)
      if (message) return message
      const latest = app.available_versions?.[0]
      return `${app.display_name} is being updated to ${latest?.version ?? "latest"}. Please wait.`
    },
    color: "#6366f1",
    icon: ArrowUpCircle,
    showProgress: true
  },
  deleting: {
    label: "Removing",
    description: (app) =>
      `${app.display_name} is being removed from your appbox.`,
    color: "#ef4444",
    icon: Trash2,
    showProgress: true
  }
}

// --- Deterministic Pseudo-Random Number Generator ---
// Produces a consistent random float between 0 and 1 based on a seed.
const prng = (seed: number) => {
  const x = Math.sin(seed) * 1000
  return x - Math.floor(x)
}

/* -------------------------------------------------------------------------- */
/*  Light-mode scene (placeholder)                                            */
/* -------------------------------------------------------------------------- */

// --- Static Data Generation ---
const generateStaticElements = () => {
  const shimmers = []
  const lodgeShimmers = []
  const stars = []
  const star4s = []
  const particles = []
  const glowParticles = []
  const midgroundTrees = []
  const fgTrees = []
  const birds = []
  const mountainLayers: Array<{ path: string; color: string }> = []
  const cloudBankBack = []
  const cloudBankFront = []
  const meteors = []

  const midgroundPalette = ["#135644", "#22713e"]
  const fgPalette = ["#0c362d"]
  const birdPalette = ["#E9E2E2", "#F3EEEA", "#FFFAE3", "#DBF4FF"]

  // Stars with scattered placements
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: prng(i) * 2400,
      y: prng(i + 1000) * 100,
      r: prng(i + 2000) * 1.5 + 0.5,
      duration: prng(i + 3000) * 10 + 5,
      delay: prng(i + 4000) * -15
    })
  }
  for (let i = 0; i < 20; i++) {
    star4s.push({
      x: prng(i + 5000) * 2400,
      y: prng(i + 6000) * 80,
      scale: prng(i + 7000) * 0.5 + 0.3,
      duration: prng(i + 8000) * 10 + 5,
      delay: prng(i + 9000) * -15
    })
  }

  // Procedural Static Cloud Bank (Back Layer)
  let currXC = -100
  while (currXC < 2600) {
    const r = 40 + prng(currXC + 400) * 50
    const cy = 130 + prng(currXC + 401) * 20
    cloudBankBack.push({ cx: currXC + r / 2, cy, r })
    currXC += r * 0.5 // Dense overlap
  }

  // Procedural Static Cloud Bank (Front Layer)
  currXC = -100
  while (currXC < 2600) {
    const r = 35 + prng(currXC + 500) * 45
    const cy = 135 + prng(currXC + 501) * 15
    cloudBankFront.push({ cx: currXC + r / 2, cy, r })
    currXC += r * 0.5
  }

  // Procedural Distant Mountains (5 Layers for massive overlap, tighter valley)
  const mtnConfigs = [
    {
      color: "#9bc8fc",
      baseY: 105,
      maxAmp: 125,
      minAmp: 95,
      baseWidth: 180,
      varWidth: 140,
      seed: 30
    },
    {
      color: "#87b8f8",
      baseY: 108,
      maxAmp: 90,
      minAmp: 75,
      baseWidth: 150,
      varWidth: 120,
      seed: 40
    },
    {
      color: "#73a7f6",
      baseY: 111,
      maxAmp: 80,
      minAmp: 60,
      baseWidth: 120,
      varWidth: 90,
      seed: 100
    },
    {
      color: "#5c9df5",
      baseY: 115,
      maxAmp: 65,
      minAmp: 40,
      baseWidth: 90,
      varWidth: 60,
      seed: 200
    },
    {
      color: "#3787ed",
      baseY: 120,
      maxAmp: 45,
      minAmp: 20,
      baseWidth: 70,
      varWidth: 40,
      seed: 300
    }
  ]

  mtnConfigs.forEach((layer) => {
    let path = `M -100,400 L -100,${layer.baseY} `
    let currentX = -100

    while (currentX < 2600) {
      const width = layer.baseWidth + prng(currentX + layer.seed) * layer.varWidth
      const nextX = currentX + width
      const midX = currentX + width / 2

      // Even tighter Valley envelope to bring mountains very close to the center
      let env = 1
      if (midX > 900 && midX < 1130) {
        const t = (midX - 900) / 230
        env = 1 - t * t * (3 - 2 * t)
      } else if (midX >= 1130 && midX <= 1230) {
        env = 0
      } else if (midX > 1230 && midX < 1460) {
        const t = (midX - 1230) / 230
        env = t * t * (3 - 2 * t)
      }

      // Height with variance, multiplied by valley envelope
      const rawAmp =
        layer.minAmp +
        prng(currentX + layer.seed + 1) * (layer.maxAmp - layer.minAmp)
      const amp = rawAmp * env

      // Push the flat line down an extra 30px so it hides securely behind the green hills
      const peakY = layer.baseY - amp + (1 - env) * 30
      const endY =
        layer.baseY +
        (prng(currentX + layer.seed + 2) * 8 - 4) * env +
        (1 - env) * 30

      path += `Q ${midX},${peakY} ${nextX},${endY} `
      currentX = nextX
    }
    path += `L ${currentX},400 Z`
    mountainLayers.push({ path, color: layer.color })
  })

  // Lake Shimmers
  for (let i = 0; i < 60; i++) {
    shimmers.push({
      x: prng(i + 10000) * 2400,
      y: 128 + prng(i + 11000) * 15,
      w: prng(i + 12000) * 30 + 10,
      delay: prng(i + 13000) * -4
    })
  }

  // Lodge Shimmers
  const centerX = 1675
  const spread = 500

  const clustered = (seed: number) =>
    (prng(seed) + prng(seed + 1) + prng(seed + 2)) / 30 // 0..1, peaked near 0.5

  for (let i = 0; i < 10; i++) {
    const r = clustered(i + 10000) - 0.5 // -0.5..0.5, peaked near 0
    lodgeShimmers.push({
      x: centerX + r * spread,
      y: 128 + prng(i + 11000) * 10,
      w: prng(i + 12000) * 20 + 10,
      delay: prng(i + 13000) * -4
    })
  }

  // Atmospheric Particles
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: prng(i + 15000) * 2400,
      y: 90 + prng(i + 16000) * 60,
      r: prng(i + 17000) * 1.5 + 0.5,
      delay: prng(i + 18000) * -5,
      duration: 4 + prng(i + 19000) * 4
    })
  }

  // Atmospheric Glow Particles
  for (let i = 0; i < 150; i++) {
    glowParticles.push({
      x: prng(i + 21000) * 2400,
      y: 90 + prng(i + 22000) * 60,
      r: prng(i + 23000) * 1.5 + 0.5,
      delay: prng(i + 24000) * -5,
      duration: 4 + prng(i + 25000) * 4
    })
  }

  function sortBackToFrontByY<T extends { y: number }>(items: T[]) {
    // Back (smaller y) first, front (larger y) last
    items.sort((a, b) => a.y - b.y)
    return items
  }

  // Midground Hills Trees
  for (let i = 0; i < 170; i++) {
    const x = prng(i + 34000) * 2400
    const type = Math.floor(prng(i + 25000) * 5) + 1 // 1..5
    const color =
      midgroundPalette[Math.floor(prng(i + 25500) * midgroundPalette.length)]

    midgroundTrees.push({
      id: `mg-${i}`,
      x,
      y: 126 - prng(i + 26000) * 20,
      scale: prng(i + 27000) * 0.4 + 0.4,
      type,
      color
    })
  }
  sortBackToFrontByY(midgroundTrees)

  // Foreground Trees
  for (let i = 0; i < 100; i++) {
    const x = prng(i + 28000) * 2400
    if (x > 850 && x < 1350) continue
    if (x > 1400 && x < 1650) continue

    const type = Math.floor(prng(i + 29000) * 5) + 1 // 1..5
    const color = fgPalette[Math.floor(prng(i + 29500) * fgPalette.length)]

    fgTrees.push({
      id: `fg-${i}`,
      x,
      y: 155 + prng(i + 30000) * 30,
      scale: prng(i + 31000) * 1.2 + 0.7,
      type,
      color
    })
  }
  sortBackToFrontByY(fgTrees)

  // Flying Birds
  for (let i = 0; i < 8; i++) {
    birds.push({
      x: 1000 + prng(i + 32000) * 150,
      y: 30 + prng(i + 33000) * 20,
      scale: prng(i + 34000) * 0.3 + 0.4,
      duration: 35,
      delay: prng(i + 36000) * -50,
      dir: 1,
      flapSpeed: prng(i + 38000) * 0.3 + 0.3,
      swoopDuration: 8 + prng(i + 39000) * 4,
      swoopDelay: prng(i + 40000) * -10,
      type: 1,
      color: birdPalette[i % birdPalette.length]
    })
  }

  // Meteors
  for (let i = 0; i < 20; i++) {
    const cluster = Math.floor(prng(i + 32000) * 3)

    // Calculate a slight random variance for the X destination
    // Base 1200px + a random variance between -200px and +200px
    const endX = 1200 + (prng(i + 370) * 500 - 600)

    meteors.push({
      x: prng(i + 33000) * 2000 - 200,
      y: prng(i + 34000) * -100,
      endX: endX, // <-- Add this
      duration: cluster === 0 ? 2 : cluster === 1 ? 3 : 4,
      delay: prng(i + 35000) * -20,
      size: prng(i + 36000) * 1.5 + 0.8
    })
  }

  return {
    shimmers,
    particles,
    glowParticles,
    cloudBankBack,
    cloudBankFront,
    mountainLayers,
    midgroundTrees,
    fgTrees,
    birds,
    meteors,
    stars,
    star4s,
    lodgeShimmers
  }
}

const STATIC = generateStaticElements()

const TREE_BASE_OFFSETS: Record<number, number> = {
  1: 12, // Tree 1 shadow cy
  2: 2, // Tree 2 shadow cy
  3: 0, // Tree 3 shadow cy (this fixes the exact trees in your screenshot!)
  4: 0, // Tree 4 shadow cy
  5: 14 // Tree 5 shadow cy
}

export default function JobProgressSummer({
  job: _job,
  color
}: {
  job?: JobProgressData
  color?: string
}) {
  const themeColor = color || "#38BDF8"
  const baseOffsets = TREE_BASE_OFFSETS

  return (
    <>
      {/* Set fallback background to the horizon sky color */}
      <div className="absolute inset-0 bg-[#9fd0fd] overflow-hidden rounded-xl border border-border/20 shadow-inner">
        <svg
          viewBox="0 0 2400 185"
          preserveAspectRatio="xMidYMid slice"
          className="block w-full h-full"
          fill="none"
        >
          <defs>
            {/* Sky Gradient */}
            <linearGradient id="sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3f97fb" />
              <stop offset="100%" stopColor="#9fd0fd" />
            </linearGradient>

            {/* Background Static Cloud Banks Gradients */}
            <linearGradient
              id="cloud-bank-back"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="70"
              x2="0"
              y2="150"
            >
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#BFDBFE" />
            </linearGradient>
            <linearGradient
              id="cloud-bank-front"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="90"
              x2="0"
              y2="160"
            >
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E0F2FE" />
            </linearGradient>

            {/* Lake Gradient */}
            <linearGradient id="lake-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#89cffb" />
              <stop offset="100%" stopColor="#78c5fb" />
            </linearGradient>

            {/* Haze Gradient */}
            <linearGradient
              id="haze-grad"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="90"
              x2="0"
              y2="140"
            >
              <stop offset="0%" stopColor="#9fd0fd" stopOpacity="0" />
              <stop offset="100%" stopColor="#9fd0fd" stopOpacity="0.65" />
            </linearGradient>

            {/* Linear Gradient for individual sun rays fading out */}
            <linearGradient
              id="ray-linear-grad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#FDE047" stopOpacity="1" />
              <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
            </linearGradient>

            {/* Sun Bloom Filter */}
            <filter id="sun-bloom" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Grain Filter */}
            <filter id="grain" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.3"
                numOctaves="2"
                result="noise"
              />
              <feColorMatrix
                type="saturate"
                values="0"
                in="noise"
                result="desaturatedNoise"
              />
              <feComponentTransfer in="desaturatedNoise" result="theNoise">
                <feFuncA type="linear" slope="0.2" intercept="0" />
              </feComponentTransfer>
            </filter>

            <linearGradient id="cloud-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#DBEAFE" />
            </linearGradient>
            <linearGradient id="cloud-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F0F9FF" />
              <stop offset="100%" stopColor="#BFDBFE" />
            </linearGradient>

            <linearGradient id="beam-grad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={themeColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
            </linearGradient>

            <g id="cloud-base">
              <path d="M -20,0 a 20,20 0 0,1 40,-10 a 25,25 0 0,1 50,0 a 20,20 0 0,1 30,10 z" />
            </g>

            <g id="bird-base">
              <path
                d="M 0,10 Q 5,2 10,10 Q 15,2 20,10 Q 15,6 10,12 Q 5,6 0,10 Z"
                fill="currentColor"
              />
            </g>

            {/* ------------------------------------------------------------- */}
            {/* PROCEDURAL TREE VARIATIONS & STYLES (from provided SVG)     */}
            {/* ------------------------------------------------------------- */}
            <linearGradient
              id="linear-gradient-tree1"
              x1="163.85"
              y1="140.06"
              x2="63.11"
              y2="151.06"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(-140, -225)"
            >
              <stop offset="0" stopColor="#043936" />
              <stop offset="1" stopColor="#05262e" />
            </linearGradient>
            <linearGradient
              id="linear-gradient-tree5"
              x1="309.42"
              y1="584.58"
              x2="244.2"
              y2="670.9"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(-295, -691)"
            >
              <stop offset="0" stopColor="#035036" />
              <stop offset="1" stopColor="#033730" />
            </linearGradient>

            <g id="tree-shape-1">
              <ellipse
                cx="-6"
                cy="12"
                rx="80"
                ry="6"
                fill="url(#tree-shadow-grad)"
              />
              <g transform="scale(0.35) translate(-140, -200)">
                <g transform="translate(0,-3)" data-tree-trunk="1">
                  {/* Shortened Trunks */}
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 108)"
                    className="tree-st54"
                    d="M123.76,216.35c-2.41-1.09-1.16-1.88-3.16-2.02v10.45c0,.34.56.32.7.3s.22.27.18.42c-.15.24-.41-.08-.78.09l-.02,35c-3.14-.04-6.58,1.01-9.81.31-.16-.28-.34-.48-.43-.8.37-.83.49-1.73.61-2.76,1.61-13.33,2.94-26.6,3.63-39.88,1.47-1.94,3.34-3.48,5.27-5.43,1.89,2.61,2.71,2.83,3.82,4.33Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 108)"
                    className="tree-st18"
                    d="M123.76,216.35c1.21.55,2.26,1.54,3.27,2.31l.35,8.24c-1.97-.47-4.19-.32-5.91-1.4.04-.15-.04-.45-.18-.42s-.69.04-.69-.3v-10.45c1.99.14.75.92,3.16,2.02Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 108)"
                    className="tree-st5"
                    d="M121.47,225.5c1.72,1.09,3.94.93,5.91,1.4l1.8,21.79c.16,1.94.04,3.97,1.05,5.68-1.15-.14.37,5.6.06,6.36l-9.62-.13.02-35c.37-.17.63.16.78-.09Z"
                  />
                  <path
                    className="tree-st21"
                    d="M135.19,94.41c-.56,0-1.16-.2-1.93-.03-.28.06-.03.61,0,.75-3.8.24-10.56-.52-10.59-6.25,2.36,2.12,4.53,3.68,7.57,4.12-.72-.11,6.94,1.26,4.95,1.41Z"
                  />
                </g>

                <path
                  className="tree-st10"
                  d="M121.48,63.5l-.29,38.78,1.83,2.41c-.38.02-.68-.26-1.06-.04-.05-.22-.03-.38-.1-.53-.06-.11-.29-.24-.39-.18-.42.28-.3,18.53-.1,21.38.14,2.03,2.63,4.57,3.88,5.97-.38.23-.6.72-.75,1.12-1.26-.78-1.92-1.65-3.19-3.17.03,6.51-.58,12.54.1,18.92.41,3.87,4.31,6.8,7.4,8.45.03.36-.37.69-.14,1.05-1.28-.44-3.13.03-4.05-1.68-1.44-.27-1.37-1.7-3.24-2.49-.06,6.56-.65,12.94.1,19.27.31,2.63,3.21,4.85,4.79,6.67,1.78,2.04,3.79,3.22,6.26,4.18,4.65,1.81,3.46-9.12,3.2-11.42-.07-.6-.27-1.93.57-1.93,6.43,5.19,13.39,9.06,21.34,10.74,4.02.85,9.48,1.02,12.54-1.22.95,1.29,2.53,2.47,2.38,4.59-1.06,5.29-13.01,2.75-16.74,1.58l20.38,26.24c1.05,1.36,1.73,2.77,2.8,3.86v1.01c-.83.96-1.98,1.5-3.44,1.65-10.73,1.1-21.74-1.49-31.81-5.8.42,3.02,3.38,8.62,1.25,10.33-.47.38-1.32.66-2.1.52-5.52-1-10.71-3-15.87-5.1-1.01-.77-2.06-1.76-3.27-2.31-1.11-1.5-1.93-1.72-3.82-4.33-1.93,1.95-3.8,3.5-5.27,5.43-.05-.19,0-.46-.32-.26-6.35,3.92-13.26,6.66-20.63,7.09-.84.05-1.73-.31-2.06-.75s-.26-1.25.03-1.89l3.51-7.69c-9.22,4.84-19.46,6.51-29.69,5.08-.62-.09-1.08-.61-1.31-.85-.82-.86,3.25-5.78,4.37-7.26l17.43-22.9c-4.34.99-8.1,1.81-11.82.31-1.31-.53-2.45-1.61-2.73-2.85-.26-1.14.19-2.55.88-3.52l8.34-11.72c2.57-3.61,5.64-6.94,8.02-10.75.7-1.11,2.22-1.82,2.69-3.45-2.95.82-5.65,1.34-8.36,1.21-1-.04-2.2-.94-2.68-1.9-.34-.68-.09-1.53.22-1.95,1.14-1.54,2.46-2.9,3.92-4.52,4.59-5.13,9.12-9.89,13.39-15.45-2.77.63-7.95,2.57-9.37-.12-.33-.62-.1-1.58.55-2.38,5.62-6.95,11.25-13.54,16.58-20.94-2.17.4-7.8,2.23-8.44-.16-.15-.54.12-1.29.52-1.82l6.63-8.69c1.15-1.51,3.42-2.67,4.01-4.93-.86.32-3.04.41-3.39-.74l15.67-30.13c.32-.03.59-.68.82-.03Z"
                />
                <path
                  className="tree-st35"
                  d="M128.67,157.66c3.63,1.26,2.93-2.72,6.04-1.37,5.28,2.29,11.08,2.48,16.33.67l16.45,18.99c1.1,1.27,1.81,2.64,2.69,3.83-3.07,2.24-8.52,2.07-12.54,1.22-7.95-1.68-14.91-5.55-21.34-10.74-.84,0-.64,1.33-.57,1.93.26,2.31,1.45,13.24-3.2,11.42-2.47-.96-4.48-2.14-6.26-4.18-1.58-1.82-4.47-4.03-4.79-6.67-.75-6.33-.16-12.71-.1-19.27,1.87.78,1.81,2.21,3.24,2.49.92,1.71,2.77,1.24,4.05,1.68Z"
                />
                <path
                  className="tree-st24"
                  d="M124.5,132.42c.79.49,4.88,4.12,7.62,1.21,4.35,1.64,8.62,1.56,12.9,1.09l14.88,16.38c.87.96,1.9,2.26,1.78,3.45-.36,3.72-9.6,1.78-11.52.88-.23-.31-.51-.69-1.08-.71-.39-.02-.46,1.16-.78,1.27-6.66.37-12.78-2.61-17.69-7.13-.34,2.04,1.47,6.51-.17,7.67-.37.26-1.13.35-1.64.08-3.09-1.65-6.99-4.58-7.4-8.45-.68-6.38-.07-12.41-.1-18.92,1.27,1.52,1.93,2.39,3.19,3.17Z"
                />
                <path
                  className="tree-st36"
                  d="M121.96,104.65c1.75,4.6,7.1,8.88,12.48,7.31.9-.26,2.05.32,2.62-.37,4.94,6.56,10.11,12.92,15.59,19.35.61.71.73,1.67.53,2.15-1.06,2.59-6.71.85-8.74.62-.39-.09-.92-.57-1.64-.65-4.58-.51-8.76-2.05-12.65-4.38-.35,1.6.57,3.6-.75,4.07-1.02.37-3.43-.63-4.15-1.45-1.25-1.4-3.74-3.94-3.88-5.97-.2-2.85-.32-21.09.1-21.38.09-.06.33.06.39.18.07.14.05.31.1.53Z"
                />
                <path
                  className="tree-st16"
                  d="M124.13,67.77c-.33-.53,13.23,25.76,12.43,26.36-.47.36-.92.28-1.37.28,1.99-.14-5.67-1.51-4.95-1.41-3.04-.44-5.21-2-7.57-4.12.03,5.73,6.79,6.49,10.59,6.25l7.25,7.94c.05,1.41,4.82,5.18,3.97,7.01-.62,1.33-3.49,1.14-4.66,1.01.16-.2,0-.36-.07-.5-.14-.31-.43-.1-.76-.17-2.6-.53-4.63-1.95-6.71-3.41-.5.92.03,2.03-.49,2.78-1.22,1.77-6.94-2.67-8.78-5.09l-1.83-2.41.29-38.78,2.65,4.27Z"
                />
                <path
                  className="tree-st49"
                  d="M150.17,155.43c.29.45.52,1.12.87,1.52-5.25,1.81-11.05,1.62-16.33-.67-3.11-1.35-2.41,2.63-6.04,1.37-.22-.36.18-.69.14-1.05.51.27,1.27.19,1.64-.08,1.64-1.16-.18-5.63.17-7.67,4.91,4.52,11.03,7.51,17.69,7.13.32-.11.39-1.29.78-1.27.57.02.85.4,1.08.71Z"
                />
                <path
                  className="tree-st28"
                  d="M144.44,133.72c.22.3.35.74.59,1.01-4.29.47-8.55.55-12.9-1.09-2.74,2.91-6.83-.73-7.62-1.21.15-.4.37-.89.75-1.12.73.82,3.13,1.82,4.15,1.45,1.32-.47.4-2.47.75-4.07,3.89,2.34,8.07,3.87,12.65,4.38.71.08,1.24.56,1.64.65Z"
                />
                <path
                  className="tree-st13"
                  d="M123.02,104.69c1.84,2.42,7.56,6.87,8.78,5.09.52-.75-.02-1.86.49-2.78,2.08,1.46,4.12,2.89,6.71,3.41.33.07.62-.14.76.17.07.15.23.3.07.5-1.08-.12-2.09-.77-3.3-.61.2.43.36.9.53,1.12-.57.69-1.72.11-2.62.37-5.38,1.57-10.73-2.71-12.48-7.31.38-.23.68.05,1.06.04Z"
                />
              </g>
            </g>

            <g id="tree-shape-2">
              <ellipse
                cx="-7"
                cy="2"
                rx="74"
                ry="6.5"
                fill="url(#tree-shadow-grad)"
              />
              <g transform="scale(0.35) translate(-445, -221)">
                <g transform="translate(0,-3)" data-tree-trunk="2">
                  {/* Shortened Trunks */}
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 103)"
                    fill="#3b2415"
                    d="M426.41,206.33c1.32,0,2.64-.15,3.71.53-.09,1.36-.15,2.8-.05,4.17-1.08-.07-2.11-.28-3.41-.72l-.35,35.78c1.27.14,2.45-.38,3.14.32l-9.13.1c.22-.36-.44-.49-.42-.79l.76-5.4c1.59-11.2,1.77-22.58,2.28-33.86,1.15-.07,2.29-.14,3.48-.13Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 103)"
                    fill="#3b2415"
                    d="M430.07,211.03c.75,10.3.49,20.79,2.44,30.84.21,1.09-.46,2.66.64,4.19-1.65.55-2.53.33-3.69.34-.69-.69-1.87-.17-3.14-.32l.35-35.78c1.29.44,2.33.65,3.41.72Z"
                  />
                </g>
                <path
                  className="tree-st31"
                  d="M426.74,144.4l.1,4.62c.13,5.81-.3,11.66-.02,17.46-.45-.11-.93.2-1.3.66-2.79,3.4-6.14,6.15-10.29,7.63-.49.18-1.38.43-1.89.22-1.52-.61-.67-3.71-1.49-4.54-3.23,2-6.4,3.73-10.21,4.27-.54.08-.74.28-.9.56l-6.35.38c-.88.05-1.52-.35-1.79-.76-.36-.54-.2-1.35.11-1.9l12.22-21.31c-1.27-.29-1.97.2-3.19-.6l3.4-5.52c2.53-4.11,5.6-7.99,8.19-12.44-.82-.23-1.51.14-2.47-.48l3.78-8.44c2.02-4.52,3.63-9.26,5.6-13.75l6.18-14.08.32,48.03Z"
                />
                <path
                  className="tree-st15"
                  d="M447.79,151.58l.28,1.12c-2.06.37-4.15.22-6.49,0-4.79,4.6-11.31-.18-14.74-3.68l-.1-4.62c.39.18.35-.32.7-.7,3.3,3.21,6.8,6.7,11.88,7.66.76-1.24.46-2.13.34-3.51,2.35,2.11,5.39,2.48,8.13,3.73Z"
                />
                <path
                  className="tree-st46"
                  d="M427.86,96.44c2.89,8.54,6.72,16.81,10.07,25.19l3.56,8.91c.16.4.2,1.02-.05,1.33-.22.26-.72.12-1.6.54,3.46,5.83,6.99,11.51,10.85,17.28.53.79-.31,1.76-1.02,1.8-.74.04-1.42.14-1.89.1-2.75-1.25-5.79-1.62-8.13-3.73.13,1.38.42,2.27-.34,3.51-5.08-.97-8.57-4.45-11.88-7.66-.34.38-.31.88-.7.7l-.32-48.03c0-.25-.12-.5-.04-.75.29.08.38-.23.69-.45.22.8.39,1.05.79,1.27Z"
                />
                <path
                  className="tree-st9"
                  d="M433.25,132.2l.53-1.97c.49.67.43,1.66-.53,1.97Z"
                />
                <path
                  className="tree-st2"
                  d="M426.82,166.48c3.17,3.45,6.75,6.6,11.34,8.34.58.22,1.11.23,1.42.1,1.48-.6.41-3.4,1.11-5.14,3.46,2.94,7.57,4.03,11.71,5.19-.1.42,0,.96.24,1.36-3.5,1.18-7.47.59-10.92-.9-.67.88-1.31,1.79-2.43,1.9-4.32.4-8.4-.31-12.57-2.14l-.12,25.16c-.01,2.13.06,4.07-.2,5.97-1.19,0-2.32.06-3.48.13-1.71.1-3.51.82-5.32.35s-2.52-2.5-3.01-4.32c-1.19,1.59-7.11,6.03-8.26,4.09-.3-.5,0-1.1-.21-1.87-1.22,2.13-16.02,1.5-18.95,1.32-.8-.05-1.68-.58-1.92-1.05-.21-.42-.09-1.38.24-2.01l6.21-11.8,9.02-15.9c.16-.28.35-.48.9-.56,3.81-.54,6.98-2.27,10.21-4.27.82.84-.02,3.93,1.49,4.54.51.21,1.4-.04,1.89-.22,4.15-1.48,7.51-4.23,10.29-7.63.37-.46.85-.76,1.3-.66Z"
                />
                <path
                  className="tree-st6"
                  d="M452.64,176.34c2.75,4.44,12.37,22.14,14.89,27.46.28.59.09,1.45-.31,1.69-.27.16-.61.57-1.26.6-5.77.27-11.36.25-17.07,0-1.43-.06-2.62-.89-3.32-1.88.24.78.46,1.66-.08,2.38-1.56,2.09-7.98-2.61-9.05-4.7.26,1.94-.29,4.36-2.44,4.88-1.28.32-2.86-.26-3.88.08-1.07-.69-2.39-.53-3.71-.53.26-1.9.19-3.84.2-5.97l.12-25.16c4.17,1.82,8.25,2.54,12.57,2.14,1.11-.1,1.76-1.02,2.43-1.9,3.44,1.5,7.42,2.09,10.92.9Z"
                />
                <path
                  className="tree-st56"
                  d="M448.07,152.7c-.13-.51,12.99,20.67,11.96,22.11s-6.1.6-7.63.17c-4.13-1.16-8.25-2.25-11.71-5.19-.7,1.74.36,4.53-1.11,5.14-.31.13-.84.12-1.42-.1-4.59-1.74-8.17-4.89-11.34-8.34-.28-5.8.15-11.65.02-17.46,3.42,3.5,9.95,8.28,14.74,3.68,2.34.21,4.44.36,6.49,0Z"
                />
              </g>
            </g>

            <g id="tree-shape-3">
              <ellipse
                cx="-6"
                cy="0"
                rx="69"
                ry="5"
                fill="url(#tree-shadow-grad)"
              />
              <g transform="scale(0.35) translate(-140, -503)">
                <g transform="translate(0,-3)" data-tree-trunk="3">
                  {/* Shortened Trunks */}
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 238.5)"
                    className="tree-st48"
                    d="M127.95,477.01c.38,2.51.02,5.12.24,7.63-3.73.75-2.24.13-6.35-.19l.02,43.3c-3.38.59-6.85.03-10.25.35.97-3.6,1.03-7.38,1.48-11.05,1.64-13.26,2.18-26.65,3-39.96.22-.4.73-.58,1.28-.64l4.82-.46c1.88-.18,4.24-.05,5.76,1.01Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 238.5)"
                    className="tree-st38"
                    d="M128.19,484.64c.96,10.87,1.08,21.86,2.73,32.43.55,3.53.01,7.47.88,11.07-.57-.12-1.28.13-1.89-.04-1.76-3.59-2.53-7.59-2.92-11.64l-.27-2.82c-.12-1.31-.29-2.43-.45-3.86-.51,1.34-.21,2.74-.05,4.17.51,4.81,1.29,9.48,2.87,13.93-2.2.92-5.07-.5-7.23-.13l-.02-43.3c4.11.32,2.62.94,6.35.19Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 238.5)"
                    className="tree-st12"
                    d="M129.91,528.1c-.27-.08-.65.07-.82-.22-1.58-4.45-2.36-9.13-2.87-13.93-.15-1.43-.46-2.83.05-4.17.16,1.43.32,2.55.45,3.86l.27,2.82c.39,4.05,1.16,8.05,2.92,11.64Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 238.5)"
                    className="tree-st43"
                    d="M125.48,502.23c-.33-2.11-.32-4.22-.01-6.55.33,2.11.32,4.22.01,6.55Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 238.5)"
                    className="tree-st11"
                    d="M125.87,508.71c-.34-1.35-.32-2.71-.02-4.27.34,1.35.32,2.71.02,4.27Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 238.5)"
                    className="tree-st14"
                    d="M129.09,527.88c.17.29.55.15.82.22.6.17,1.32-.08,1.89.04,4.29.88,8.71.58,13.23,2.32-4.3.94-8.24.78-12.54.93l-37.27,1.23-10.26.4c-1.4.06-10.87,2.73-10.3.91,9.77-3.67,26.36-4.8,36.95-5.82,3.4-.33,6.87.23,10.25-.35,2.16-.38,5.03,1.05,7.23.13Z"
                  />
                </g>

                <path
                  className="tree-st17"
                  d="M122.64,326.62c-.18.63-.44,1.37-.42,2.3.35,14.24-.55,28.37.44,42.24-.8,1.71-.29,4.16-.31,6.16l-.12,17.44c0,1.15-.09,2.16.28,3.09-.93,1.59-.21,3.58-.21,5.31l-.09,21.7.35,1.55c-1.02,1.6-.31,3.53-.31,5.29l-.05,44.32-4.82.46c-.55.05-1.05.23-1.28.64-3.48-1.01-5.74,1.71-8.78-3.97-1.68,1.34-8.37,6.54-9.92,5.28-1.4-1.15.99-5.87,1.27-7.87-8.28,5.68-17.4,8.56-27.07,4.96-1.94-.72-3.28-1.87-4.61-3.08-.29-1.66.27-3.22,1.34-4.6,1.88-2.42,3.22-5.07,4.74-7.55l12.6-20.58c1.55-2.53,3.63-4.88,4.8-7.73-2.36,1.35-16.34,5.76-14.65.2,2.72-2.29,4.71-5.57,7.25-8.04,2.85-2.78,5.01-6.29,7.47-9.36,1.82-2.27,4.04-4.63,5.31-7.3,2.82-2.22-7.57,1.73-7.89-1.69,5.22-8.46,11.56-16.22,16.26-25.62-1.28.25-8.48,1.84-6.78-1.44,8.05-15.49,15.19-31.14,22.17-47.12.91-2.08,1.61-3.76,2.77-5.72.23-.16.37.56.29.76Z"
                />
                <path
                  className="tree-st25"
                  d="M145.09,373c.71,1.46,3.47,5.64,2.56,6.53-1.39,1.37-5.94.33-6.63-.3-.98-.9-2.17-1.93-3.93-2.3-.12,1.1-.56,2.78-1.89,2.72-3.58-.14-6.3-2.42-8.74-4.61.51.46-4.17-5.01-3.79-3.9-.99-13.87-.09-28-.44-42.24-.02-.93.24-1.67.42-2.3l22.45,46.38Z"
                />
                <path
                  className="tree-st26"
                  d="M155.42,433.98c2.44,3.16,4.4,6.64,6.74,10.34l15.59,24.68c.49.78.91,2.17.58,2.75-1.37,2.41-4.05,3.71-6.91,4.33-8.94,1.94-18.1-.58-25.56-5.83.68,1.99,3.52,6.92,1.69,8.38-1.92,1.54-9.18-3.72-10.78-4.65-1.58-2.67-.65,3.24-6.53,3.38-.58-.44-1.67-.27-2.28-.35-1.52-1.06-3.87-1.19-5.76-1.01l.05-44.32c4.47,4.63,12.62,6.39,19.43,5.22,4.75-.82,9.26-1.89,13.74-2.92Z"
                />
                <path
                  className="tree-st4"
                  d="M134.05,407.78c.39-.05.78-.03,1.16-.13,1.11,1.27,3.18,1.02,4.92.87l8.39-.71c5.81,8.28,12.36,16.06,19.04,23.84.64.74.98,1.64.56,2.27-1.83,2.73-10.89-.17-13.39-1.43-3.19,2.21-7.59-1.4-10-3.42-.45,1.57.21,2.91-.89,3.7-1.97,1.4-9.58-3.44-11.63-4.44-1.18,1.55.66,4.66-1.01,5.14-1.95.56-7.49-5.62-8.64-7.07l-.35-1.55.09-21.7c.14.11.46-.27.7-.05,2.87,2.63,8.05,7.1,11.05,4.68Z"
                />
                <path
                  className="tree-st0"
                  d="M127.54,381.04c4.08,2.4,9.52,2.39,13.84.43l7.14,10c3.04,4.25,5.83,8.74,9.17,13.14,2.92,3.84-7.41,2.78-9.59,1.64-3.43-1.8-7.31-2.61-11.05-4.91-.72,2,.35,5.14-1.83,6.32-.38.1-.78.09-1.16.13-6.5-2.92-7.34-4.69-11.54-9.93-.37-.92-.29-1.93-.28-3.09l.12-17.44c1.61,1.42,3,3.43,5.19,3.72Z"
                />
                <path
                  className="tree-st30"
                  d="M154.73,432.48c.38.38.4,1.12.69,1.5-4.48,1.03-9,2.1-13.74,2.92-6.81,1.17-14.96-.59-19.43-5.22,0-1.76-.71-3.69.31-5.29,1.15,1.45,6.69,7.64,8.64,7.07,1.66-.48-.17-3.59,1.01-5.14,2.06.99,9.67,5.84,11.63,4.44,1.11-.79.44-2.13.89-3.7,2.41,2.02,6.81,5.63,10,3.42Z"
                />
                <path
                  className="tree-st53"
                  d="M134.05,407.78c-3,2.43-8.19-2.05-11.05-4.68-.24-.22-.56.16-.7.05,0-1.73-.71-3.71.21-5.31,4.2,5.24,5.05,7.02,11.54,9.93Z"
                />
                <path
                  className="tree-st20"
                  d="M126.45,375.06c-.97-.37,1.79,4.38,1.09,5.98-2.18-.29-3.58-2.3-5.19-3.72.01-1.99-.5-4.45.31-6.16-.38-1.11,4.31,4.36,3.79,3.9Z"
                />
                <path
                  className="tree-st29"
                  d="M141.02,379.23c-1.14.28.86,1.78.36,2.23-4.32,1.96-9.76,1.98-13.84-.43.71-1.6-2.06-6.36-1.09-5.98,2.44,2.19,5.17,4.47,8.74,4.61,1.33.05,1.77-1.63,1.89-2.72,1.76.37,2.95,1.4,3.93,2.3Z"
                />
                <path
                  className="tree-st32"
                  d="M148.1,406.24c-.23.07-.38.25-.34.42.11.53,1.01.75.77,1.13l-8.39.71c-1.75.15-3.81.4-4.92-.87,2.18-1.18,1.11-4.32,1.83-6.32,3.74,2.3,7.61,3.12,11.05,4.91Z"
                />
              </g>
            </g>

            <g id="tree-shape-4">
              <ellipse
                cx="-6"
                cy="0"
                rx="67"
                ry="6"
                fill="url(#tree-shadow-grad)"
              />
              <g transform="scale(0.35) translate(-450, -448)">
                <g transform="translate(0,-3)" data-tree-trunk="4">
                  {/* Shortened Trunks */}
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 212)"
                    className="tree-st44"
                    d="M433.59,424.63l-.36,47.59,6.22.03c-1.29,1.45-3.57.72-5.41,1.06-.56-1.49-7.48.24-7.22-1.02.59-2.35.18-4.93.46-7.22,1.81-14.49,1.86-29.42,2.53-44.17,1.12-.92,2.15-2.04,3.43-2.77l.35,6.49Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 212)"
                    className="tree-st33"
                    d="M437.09,425.05l1.84,39.68c.11,2.44-.11,5.06.51,7.52l-6.22-.03.36-47.59,3.5.42Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 212)"
                    className="tree-st45"
                    d="M437.15,420.76c.2,1.42-.13,2.87-.06,4.29l-3.5-.42-.35-6.49c0-.13.04-.23.14-.32,1.62.31,2.73,2.13,3.78,2.95Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 212)"
                    className="tree-st41"
                    d="M434.03,473.31c-6.45,1.18-13.01,1.77-19.8,1.89-4.68.09-8.98,1.07-13.97.6,7.87-2.39,18.6-2.08,26.55-3.52-.26,1.26,6.66-.47,7.22,1.02Z"
                  />
                </g>
                <path
                  className="tree-st7"
                  d="M433.99,297.84c-.26.79-.45,1.56-.45,2.65l-.1,42.59c0,1.61.35,3.13,1.31,4.25-.16.26-.38.52-.61.71-.2-.69-.49-.12-.63.38l-.04,23.24c0,.76.62,1.31.57,1.89-.24,0-.29.34-.46.42-.28.15-.61-.34-.88-.12.06-.05-4.09,6.24-7.08,6.49-1.05,0-1.21-2.13-1.41-3.1-1.62.61-4.42,3.8-5.99,2.43-1.08-.94-.42-3.2-1-4.24-2.84,2.12-5.86,3.97-9.48,4.29-.76.07-1.52-.14-1.87.32-.39-.16-7.94,1.44-6.26-1.21,3.57-5.63,6.43-11.36,9.23-17.11,1.95-4.01,4.28-7.85,6.15-12.27-1.81.27-3.5,1.01-5.03-.28l6.79-14.33,2.81-6.6c3.41-8.03,7.18-16,10.74-24.33l2.96-6.92c.43-.16.48-.05.56.09.12.22.32.6.17.75Z"
                />
                <path
                  className="tree-st52"
                  d="M434.13,348.05c1.78,4.1,7.69,5.35,11.62,4.36,3.29-.83,3.17.08,6.97-.57l9.45,17.52,5.01,9.23c-.42-.14-.37.23-.45.74-5.77.53-11.51-2.05-15.91-6.01-.14,1.87.86,3.41.28,5.2-.18.56-1.26.73-1.86.64-4.45-.61-8.34-2.73-11.65-5.91-.71.99-.09,2.28-.65,3.45l-2.9-3.14c.04-.58-.57-1.13-.57-1.89l.04-23.24c.13-.5.43-1.07.63-.38Z"
                />
                <path
                  className="tree-st39"
                  d="M451.57,337.03c1.09,2.43,1.81,5.03,3.45,7.2.93,1.23,1.1,3.4,1.95,4.86-1.52.74-3.29,1.02-4.58.4-1.9-.93-3.9-1.63-5.97-2.79.11,3.72-5.58-.9-6.59-1.99-.62.59.07,5.3-1.34,4.99s-2.85-1.31-3.74-2.36c-.95-1.12-1.31-2.64-1.31-4.25l.1-42.59c0-1.09.19-1.86.45-2.65l17.58,39.19Z"
                />
                <path
                  className="tree-st42"
                  d="M452.38,349.49c-1.82-2.26,1.26,4.07.33,2.35-3.8.65-3.68-.26-6.97.57-3.93.99-9.84-.26-11.62-4.36.24-.19.46-.45.61-.71.89,1.05,2.4,2.06,3.74,2.36s.72-4.4,1.34-4.99c1.01,1.09,6.7,5.72,6.59,1.99,2.07,1.16,4.07,1.87,5.97,2.79Z"
                />
                <path
                  className="tree-st40"
                  d="M433.58,373.99l-.2,43.83c-.1.09-.15.19-.14.32-1.28.74-2.31,1.85-3.43,2.77-1.41,1.16-7.11,5.89-8.93,4.98s-1.82-4.45-2.06-6.67c-3.66,1.77-7.24,3.33-11.33,3.55-.28-1.43.43-2.28.7-3.71-5.63,2.13-17.97,1.83-24.32,1.62-.47-.02-1.1-.38-1.04-.77.05-.31.04-1.02.26-1.35,8.21-12.29,16.03-25.26,22.79-38.5.35-.46,1.11-.25,1.87-.32,3.62-.32,6.64-2.17,9.48-4.29.58,1.04-.09,3.3,1,4.24,1.58,1.37,4.37-1.81,5.99-2.43.2.97.36,3.11,1.41,3.1,2.99-.26,7.15-6.55,7.08-6.49.26-.22.6.27.88.12Z"
                />
                <path
                  className="tree-st8"
                  d="M467.18,378.59c.1.19,0,.66-.02.91,0,.03-1.95.66-1.69.63,1.9-.25-4.33-.54-4.77-.48l7.18,12.57c-.15.44.18.84.38,1.18,2.98,5.12,5.82,10.32,9.16,15.2-1.52,2.48-2.86,5.13-4.74,7.55-1.07,1.38-1.64,2.95-1.34,4.6-5.06.03-10.17-.19-15.02-2.13.12,1.03,3.23,6.88.56,6.54-3.23-.41-5.96-1.93-8.53-3.72-.22,1.22-.14,3.31-1.41,3.52-3.25.53-8.11-4.12-9.79-4.21-1.05-.82-2.16-2.64-3.78-2.95l.2-43.83c.16-.09.22-.43.46-.42l2.9,3.14c.56-1.17-.06-2.46.65-3.45,3.31,3.18,7.2,5.3,11.65,5.91.6.08,1.67-.08,1.86-.64.59-1.79-.42-3.33-.28-5.2,4.4,3.96,10.14,6.55,15.91,6.01.07-.51.02-.88.45-.74Z"
                />
                <path
                  className="tree-st22"
                  d="M458.19,401.56c.85,1.98-.64,3.94-2.89,4.54-8.64,2.28-17.49-3.06-20.39-11.13,4.04,3.24,7.36,5.89,11.89,7.3,2.63.82,8.5,2.28,11.39-.7Z"
                />
              </g>
            </g>

            <g id="tree-shape-5">
              <ellipse
                cx="-3"
                cy="14"
                rx="74"
                ry="7"
                fill="url(#tree-shadow-grad)"
              />
              <g transform="scale(0.35) translate(-295, -666)">
                <g transform="translate(0,-3)" data-tree-trunk="5">
                  {/* Shortened Trunks */}
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 342)"
                    className="tree-st23"
                    d="M286.51,683.95c.21,1.05,4.71-1.05,5.31-.8l.31,8.71-5.82.65-.12,42.49-8.94-.24.5-5.51c1.39-15.45,2.59-30.94,3.41-46.44,1.48.47,2.95,1.02,4.63,1.41l.71-.27Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 342)"
                    className="tree-st27"
                    d="M292.14,691.86l3.33,40.51c.07.89.11,1.78.29,2.83-.3.19-.53.27-.44.45l-9.13-.64.12-42.49,5.82-.65Z"
                  />
                </g>

                <path
                  className="tree-st34"
                  d="M311.66,609.22c-.37-.02-.91.59-.64,1.16,7.83-1.22,15.18,3.16,18.4,10.37,2.34,5.24,2.48,11.23-.17,16.18-1.31-1.29-3.36-2.23-5.34-3.24-5.18-2.64-13.69-2.45-17.48,3.1-.42.62-3.57,3.5-3.47,2.72-.02.15-.08.34-.06.55-1.23.29-2.45.78-3.82.95-.52-1.46,2.28-7.2,1.17-9.1-2.06,4.79-4.41,8.85-7.16,12.83-.99.36-1.34,1.58-2.23,2.27l-3.87,2.97c1,4.38-.29,6.11-.02,10.33-.04.02-.34,0-.34-.12l-.09-58.56.14-41.14c10.02.1,17.79,8.19,19.58,17.5,4.62,2.3,8.64,6.24,9.78,11.87,1.29,6.36-.18,12.95-3.9,18.24-.27.38-.66.77-.46,1.1Z"
                />
                <path
                  className="tree-st50"
                  d="M329.25,636.92c6.07,5.97,8.1,14.86,4.21,22.66-2.35,4.7-5.97,8.86-11.12,10.88-.69,1.13-.54,2.62-1.03,3.86-2.17,5.51-6.65,9.99-11.67,11.7-6.46,2.2-13.26,1.04-17.82-2.86-.6-.24-5.1,1.86-5.31.8-.15-2.86.02-5.75.1-8.81.11-3.97-.49-7.87.23-11.69.17-.91,1.19-1.85.91-2.79,2.03-2.4,2.14-6.12,3.74-8.84,1.07-1.83,2.96-3.45,3.88-5.64,1.86-4.43,6.33-2.47,11.06-6.02.81-.61,1.04-1.81,1.36-2.73-1.09,1.81-3.02,2.2-4.9,2.65-.02-.21.05-.4.06-.55-.1.78,3.05-2.11,3.47-2.72,3.8-5.55,12.3-5.74,17.48-3.1,1.98,1.01,4.03,1.95,5.34,3.24Z"
                />
                <path
                  className="tree-st55"
                  d="M291.49,651.82c-1.6,2.73-1.7,6.45-3.74,8.84l-.79-.34c-.27-4.22,1.02-5.95.02-10.33l3.87-2.97c.9-.69,1.25-1.91,2.23-2.27,1.05.53-4.78,5.57-2.53,6.63l.94.44Z"
                />
                <path
                  className="tree-st1"
                  d="M286.66,560.51l-.14,41.14.09,58.56c0,.11.3.13.34.12l.79.34c.28.94-.74,1.88-.91,2.79-.72,3.82-.12,7.72-.23,11.69-.08,3.06-.25,5.95-.1,8.81l-.71.27c-1.68-.39-3.16-.95-4.63-1.41-1.27-.4-5.48,4.68-15.58,4.88-11.84.22-16.7-8.27-20.79-16.84-2.46-5.15-9.06-8.62-7.28-16.43,1.23-5.36,4.34-11.45,10.82-13.45-7.84-9.02-10.33-23.56-2.6-32.86,3.91-4.7,8.92-6.96,15.32-6.23-3.82-6.51.05-11.99,1.5-17.41,2.07-7.74,4.03-15.01,11.15-19.77,3.93-2.63,8.31-4.25,12.95-4.2Z"
                />
                <path
                  className="tree-st57"
                  d="M263.75,660.31l3.76,1.13c1.75.53,2.83,1.68,4.18,2.67,5.63,4.1,2.87,5.2,2.76,5.13-2.08-1.23-3.79-2.75-5.57-4.24-2.97-2.48-6.47-3.54-9.87-5.31,1.85-.52,3.18.78,4.74.62Z"
                />
                <path
                  className="tree-st19"
                  d="M267.51,661.44l-3.76-1.13c1.59-1.82-1.11-5.88.23-8.2.92,1.8,1.51,3.37,2.25,5.17.58,1.4,2.55,3.09,1.28,4.16Z"
                />
                <path
                  className="tree-st37"
                  d="M302.89,640.07c1.88-.45,3.82-.83,4.9-2.65-.33.93-.55,2.13-1.36,2.73-4.73,3.55-9.2,1.6-11.06,6.02-.92,2.19-2.81,3.82-3.88,5.64l-.94-.44c-2.25-1.06,3.58-6.09,2.53-6.63,2.75-3.98,5.1-8.04,7.16-12.83,1.1,1.9-1.69,7.64-1.17,9.1,1.37-.17,2.59-.66,3.82-.95Z"
                />
              </g>
            </g>

            {/* True Soft Ground Shadow Gradient */}
            <radialGradient id="tree-shadow-grad">
              <stop offset="0%" stopColor="#0c362d" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#0c362d" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0c362d" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sky */}
          <rect width="2400" height="185" fill="url(#sky-grad)" />

          {/* FANCY SUN: Bloom, Alternating Rays, Shrink Pulse, and Rotation */}
          <g transform="translate(1300, 45)">
            <circle
              cx="0"
              cy="0"
              r="17"
              fill="#FDE047"
              filter="url(#sun-bloom)"
              opacity="0.4"
              className="jp-sun-glow"
            />
            <circle cx="0" cy="0" r="15" fill="#FDE047" />
            <g className="jp-sun-spin">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
                (deg, i) => {
                  const isLong = i % 2 === 0
                  return (
                    <g
                      key={`ray-${deg}`}
                      transform={`rotate(${deg}) translate(${isLong ? 26 : 24}, 0)`}
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2={isLong ? "22" : "12"}
                        y2="0"
                        stroke="url(#ray-linear-grad)"
                        strokeWidth={isLong ? "3.5" : "2"}
                        strokeLinecap="round"
                        className="jp-sun-ray"
                        style={{
                          animationDelay: `${i * 0.15}s`,
                          transformOrigin: "0px 0px"
                        }}
                      />
                    </g>
                  )
                }
              )}
            </g>
          </g>

          {/* Flying Birds */}
          <g>
            {STATIC.birds.map((b, i) => (
              <g
                key={`bird-wrapper-${i}`}
                className="jp-bird-fly-ltr"
                style={{
                  animationDuration: `${b.duration}s`,
                  animationDelay: `${b.delay}s`
                }}
              >
                <g
                  className="jp-bird-swoop"
                  style={{
                    animationDuration: `${b.swoopDuration}s`,
                    animationDelay: `${b.swoopDelay}s`
                  }}
                >
                  <g
                    transform={`translate(${b.x}, ${b.y}) scale(${b.scale})`}
                    style={{ color: b.color }}
                  >
                    <use
                      href="#bird-base"
                      className="jp-bird-flap"
                      style={{ animationDuration: `${b.flapSpeed}s` }}
                    />
                  </g>
                  <g
                    transform={`translate(${b.x - 2400}, ${b.y}) scale(${b.scale})`}
                    style={{ color: b.color }}
                  >
                    <use
                      href="#bird-base"
                      className="jp-bird-flap"
                      style={{ animationDuration: `${b.flapSpeed}s` }}
                    />
                  </g>
                </g>
              </g>
            ))}
          </g>

          {/* Static Background Cloud Layers (Spans full width, visible in valley) */}
          <g fill="url(#cloud-bank-back)" opacity="0.85">
            {STATIC.cloudBankBack.map((c, i) => (
              <circle key={`cb-back-${i}`} cx={c.cx} cy={c.cy} r={c.r} />
            ))}
            <rect x="-100" y="120" width="2600" height="60" />
          </g>
          <g fill="url(#cloud-bank-front)" opacity="0.95">
            {STATIC.cloudBankFront.map((c, i) => (
              <circle key={`cb-front-${i}`} cx={c.cx} cy={c.cy} r={c.r} />
            ))}
            <rect x="-100" y="135" width="2600" height="45" />
          </g>

          {/* Render Procedural Mountain Layers */}
          {STATIC.mountainLayers.map((layer, idx) => (
            <path key={`mtn-layer-${idx}`} d={layer.path} fill={layer.color} />
          ))}

          {/* Middle Mountain (Green Hill) */}
          <path
            d="M -100,400 L -100,120 Q 200,40 500,110 Q 800,60 1100,120 Q 1400,50 1700,110 Q 2100,50 2500,120 L 2500,400 Z"
            fill="#448c35"
          />

          {/* Midground Hills */}
          <path
            d="M -100,400 L -100,130 Q 150,90 400,130 T 900,125 T 1500,120 T 2100,130 L 2500,130 L 2500,400 Z"
            fill="#5ca43e"
          />
          <path
            d="M -100,400 L -100,140 Q 200,110 500,135 T 1100,130 T 1700,135 T 2300,140 L 2500,140 L 2500,400 Z"
            fill="#74c14d"
          />

          <g>
            {[...STATIC.midgroundTrees]
              .sort((a, b) => a.y - b.y)
              .map((t) => {
                const baseY = baseOffsets?.[t.type] ?? 0

                return (
                  <g key={t.id} transform={`translate(${t.x}, ${t.y})`}>
                    <use
                      href={`#tree-shape-${t.type}`}
                      transform={`scale(${t.scale}) translate(0, ${-baseY})`}
                    />
                  </g>
                )
              })}
          </g>

          {/* Atmospheric Haze Layer spanning across background/midground elements */}
          <rect
            x="0"
            y="90"
            width="2400"
            height="50"
            fill="url(#haze-grad)"
            style={{ pointerEvents: "none" }}
          />

          {/* Lake */}
          <rect
            x="0"
            y="128"
            width="2400"
            height="60"
            fill="url(#lake-grad)"
            opacity="0.9"
          />

          <g opacity="0.5">
            {STATIC.shimmers.map((s, i) => (
              <rect
                key={`shimmer-${i}`}
                x={s.x}
                y={s.y}
                width={s.w}
                height="2"
                rx="1"
                fill="#FFFFFF"
                style={{
                  animation: `jp-fade-pulse 3s infinite ease-in-out ${s.delay}s`
                }}
              />
            ))}
          </g>

          {/* Lodge */}
          <g transform="translate(1455, 124) scale(0.5) translate(-300, -435)">
            <path
              className="lodge-st15"
              d="M313.97,399.73c-3.44,5.65-11.16,14.68-14.79,19.63-.4.54-1.03,1.96-1.91,2.08-8.38,1.13-17.02.01-25.7.74-1.1.09-1.48.36-2.36.19-4.49-.89-9.39-.24-14.21-.22-.62,0-1.52.79-1.52-.15,3.36-4.09,10.19-11.88,13.96-15.76,5.62-1.12,9.87-.86,15.11-1.29l6.38-.53.53,5.19,1.84-.27c1.56-1.28,4.97-6.48,6.09-8.2l16.58-1.4Z"
            />
            <path
              className="lodge-st31"
              d="M300.21,420.4c-.92,1.06-.98,2.83-2.95,2.71-.62-.04-1.73.87-4.35.43-.22-.04-.48.41-.3.65-.01,0-3.68.75-2.76-.17-.33.32-.99.1-.96.58-.37,0-.76-.05-1.13.04-.94-1.22-2.38.26-3.5.08s-2.11.29-2.98.35c-1.98.07-4.15-.87-6.22-.09-.61.23-.3,1.25-.09,1.61.75,1.3,4.2-.45,6.34.77.21.13-.03.31,0,.42-1.95.05-4.01-.38-6.19-.11-.59.07-.59,2.38-.06,2.45l1.85.22c.68.23.45.34-.33.25l-1.53.18c-.46.05-.46.81-.35,1.32.29,1.29,5.32.36,6.54.23.02.5.07,1,.06,1.51-1.34.8-3,.03-4.61.17-2.36.2-4.38.16-6.49-.19l.02-2.63v-4.65c0-.41.02-.81-.06-1.44-1.34-.33-2.61-.07-3.78.33-.33-.6-1.16-.72-1.76-.65l-2.36.29c-1.81.22-3.92.07-5.75-.36.06-1.48-3.71-.35-3.83-1.65-.05-.54.56-.78.78-1.05,0,.94.9.15,1.52.15,4.82-.02,9.71-.67,14.21.22.88.17,1.26-.1,2.36-.19,8.68-.73,17.32.39,25.7-.74.88-.12,1.51-1.53,1.91-2.08.25.09.5-.03.71.2s.42.49.33.84Z"
            />
            <path
              className="lodge-st26"
              d="M321.19,406.79l12.64,15.24c.37.45.52.79.18,1.16-.18.2-.54.46-.88.37-1.1-.99-2.26-1.95-3.35-3.23l-15.05-17.76c-.87.64-1.15,1.74-1.81,2.32-2.56,2.22-4,5.49-6.18,7.99l-6.53,7.52c.1-.35-.12-.62-.33-.84s-.46-.11-.71-.2c3.64-4.95,11.35-13.98,14.79-19.63.09-.15.11-.45.48-.27.38.11,1.17.55,1.49,1.14,1.4,2.59,3.62,4.21,5.25,6.18Z"
            />
            <path
              className="lodge-st21"
              d="M295.44,439.92c.39.58.44,2.26.26,2.92-1.43.58-3.31.23-4.87.34-3.33.24-6.73.22-9.95.34-.57.02-1.32.03-1.9.04l-11.81.11c-3.55.03-9.92.09-10.72-.81-.15-.71-.31-1.52,0-2.2,2.56-.21,5.16.42,7.84-.31l30.16-.1c.29-.37.67-.34.98-.34Z"
            />
            <path
              className="lodge-st11"
              d="M295.4,439.52c-3.75.09-7.53-.17-11.33.12-.43.03-.98.2-1.42.2l-26.18.06c-.23-.74-.11-1.5.03-2.24l38.45-.05c.37,0,.57-.12.51-.36.89.44.42,1.65-.07,2.27Z"
            />
            <path
              className="lodge-st7"
              d="M297.4,401.13c-1.12,1.72-4.53,6.92-6.09,8.2l.23-9.62c1.7-.07,3.45-.24,5.44-.06.55.05.34,1.21.43,1.48Z"
            />
            <path
              className="lodge-st13"
              d="M295.4,439.52c.13.12.15.25.04.39-.3,0-.69-.02-.98.34l-30.16.1c-2.69.73-5.28.1-7.84.31.11-.23.08-.53.01-.76l26.18-.06c.44,0,.98-.17,1.42-.2,3.8-.29,7.58-.03,11.33-.12Z"
            />
            <path
              className="lodge-st27"
              d="M291.53,399.71l-.23,9.62-1.84.27-.53-5.19c.58-1.23.37-2.64.55-4.2.1-.86,1.5-.48,2.05-.5Z"
            />
            <path
              className="lodge-st38"
              d="M262.27,425.06l.07,1.96c0,.17.19.24-.04.35l-4.66-.06c-.32,0-.42.24-.36.39-1.2.1-.57-1.92-.75-2.69-.03-.1,0-.22,0-.33,1.83.43,3.94.58,5.75.36Z"
            />
            <path
              className="lodge-st6"
              d="M333.13,423.56c-.73-.19-1.22.31-1.54.77-3.02-.12-2.75-3.33-5.23-3.35.25-2.04-1.64-2.81-3.53-2.77-.08-.58.51-.33,1.07-.65.49.01-4.24-5.59-4.2-4.71-.45-1.2-1.41-2.94-2.67-3.17l-1.14-.21c-.41-.07.32-.64.29-.9-.58-1.59-2.08-2.62-3.26-3.68.66-.57.94-1.67,1.81-2.32l15.05,17.76c1.08,1.28,2.25,2.23,3.35,3.23Z"
            />
            <path
              className="lodge-st28"
              d="M331.23,426.5c.05.24.03.49-.03.73-.55-.23-1.25.16-1.76.32-.76.24-.77,1.22-.74,2.32-1.1.36-2.15.23-3.12.41.49-1.96-.15-3.99.16-5.99-.08-.99,2.93-.69,3.11-.55.62.46,0,2.05.96,2.54.36.19.94.07,1.43.22Z"
            />
            <path
              className="lodge-st5"
              d="M292.62,424.2c.67.3,2.08-.39,2.65-.05.99.59.03,2.28.03,2.88-1.7-.18-3.44-.23-5.15-.13l-.44-1.09c-.12-.3.02-.61-.06-.92-.07-.27-.39-.19-.74-.27-.03-.48.63-.26.96-.58-.93.91,2.74.16,2.76.17Z"
            />
            <path
              className="lodge-st8"
              d="M270.24,431.19l-.02,2.63c-1.06-.17-2.74,1.17-4.13.21-.15-.86-.09-1.77-.06-3.02,1.51-.09,3.07-.64,4.22.18Z"
            />
            <path
              className="lodge-st19"
              d="M270.24,426.53c-.59.34-4.14,1.32-4.31-.09-.04-.33.29-.59.47-1.02,1.17-.4,2.44-.66,3.78-.33.08.63.06,1.03.06,1.44Z"
            />
            <g>
              <path
                className="lodge-st23"
                d="M287.78,424.65c-.66.15-1.49-.2-2.33.19-.49.23-.64,1.6-.26,1.9.57.46,1.45-.12,2.21.34-.35.74-1.33.04-1.86.38-.65.41-.74,2.12-.19,2.65.74.72,2.05-.39,4.25.25-.06-1.4.98-2.37.54-3.47,1.71-.09,3.45-.04,5.15.13.6.87.18,2.14.36,3.37l-5.68.09c1.93,1.62,7.13-.71,5.77,1.9.16,1.48-.12,3.2-.31,4.45l-38.02.05c-.26.41-.61.26-.9.32-.31-1.85-.19-3.8-.04-5.67.14-.73,7.62-.02,6.18-1.1.56-.01,1.51.08,2.33-.25.61-.25.72-2.21-.06-2.61-.68-.35-1.98.08-2.36.44-.19.88-.07,1.81.08,2.41-2.04.04-4.18-.35-6.12.23-.65-.68.2-1.62-.04-2.5-.25-.94-.86-2.4.03-3.13.19.77-.44,2.79.75,2.69,1.67-.14,3.48.39,5.03-.34.23-.11.05-.18.04-.35.83.3,1.94.39,3-.07.17-1.11-.71-1.43-.7-2.19.6-.07,1.43.05,1.76.65-.18.44-.51.69-.47,1.02.18,1.4,3.72.42,4.31.09v4.65c-1.14-.82-2.71-.27-4.22-.18-.02,1.25-.09,2.16.06,3.02,1.39.96,3.07-.38,4.13-.21,2.12.34,4.14.38,6.49.19,1.61-.13,3.27.63,4.61-.17.51.66,1.96.48,2.69.33.84-.71.51-2.31.33-3.23-.85-.13-1.47-.1-2.38-.06-.67.03-.71.97-.69,1.44-1.22.14-6.25,1.06-6.54-.23-.11-.51-.12-1.26.35-1.32l1.53-.18c.77.09,1.01-.02.33-.25l-1.85-.22c-.54-.06-.54-2.38.06-2.45,2.18-.27,4.24.17,6.19.11.12.56-.31,1.79.27,2.29.49.42,2.21.42,2.6-.09s.3-2.01-.14-2.33c-.79-.58-2.04.1-2.73-.29-2.14-1.22-5.59.54-6.34-.77-.21-.36-.53-1.38.09-1.61,2.07-.79,4.24.16,6.22.09l.19,1.77c.8,0,2.18.39,2.72-.35.4-.56-.15-1.38.07-1.77,1.12.18,2.56-1.3,3.5-.08Z"
              />
              <g>
                <path
                  className="lodge-st30"
                  d="M295.43,436.83c0,.12.21.29.04.43.06.24-.14.36-.51.36l-38.45.05c.03-.14.02-.33,0-.47.29-.06.64.1.9-.32l38.02-.05Z"
                />
                <path
                  className="lodge-st0"
                  d="M262.65,430.43c1.44,1.08-6.04.37-6.18,1.1.02-.29-.07-.58.06-.87,1.94-.59,4.09-.19,6.12-.23Z"
                />
                <path
                  className="lodge-st25"
                  d="M287.78,424.65c.36-.08.76-.04,1.13-.04.35.08.67,0,.74.27.08.31-.07.62.06.92l.44,1.09c.44,1.09-.61,2.07-.54,3.47-2.2-.63-3.51.48-4.25-.25-.55-.53-.46-2.24.19-2.65.53-.34,1.51.36,1.86-.38-.75-.46-1.63.12-2.21-.34-.37-.3-.23-1.67.26-1.9.84-.39,1.67-.04,2.33-.19Z"
                />
                <path
                  className="lodge-st35"
                  d="M289.74,434.29c-1.49.31-2.91.3-4.52.04-.26-1.1-.06-1.99-.17-3.36,1.66-.36,3.19-.49,4.7-.02-.11,1.3-.1,2.08,0,3.34Z"
                />
                <path
                  className="lodge-st36"
                  d="M281.32,433.84c.01-.51-.04-1-.06-1.51-.02-.48.02-1.42.69-1.44.91-.04,1.53-.08,2.38.06.18.93.51,2.52-.33,3.23-.73.15-2.18.32-2.69-.33Z"
                />
                <path
                  className="lodge-st29"
                  d="M265.21,433.87c-.27.65-2.2.71-2.66.18s-.58-2.51.04-2.89c.8-.48,1.89-.03,2.75,0,.27.77.21,1.91-.13,2.71Z"
                />
                <path
                  className="lodge-st16"
                  d="M269.5,430.37c-1.14.11-1.89-.25-3.26.1-.41-.92-.64-2,.06-3.22,1.42.55,2.31.49,3.64.48-.43.96-.64,1.63-.45,2.64Z"
                />
                <path
                  className="lodge-st20"
                  d="M281.33,427.8c-.02-.12.22-.3,0-.42.69.39,1.94-.28,2.73.29.44.32.51,1.83.14,2.33s-2.11.51-2.6.09c-.58-.5-.16-1.73-.27-2.29Z"
                />
                <path
                  className="lodge-st14"
                  d="M262.65,430.43c-.15-.61-.27-1.54-.08-2.41.37-.37,1.67-.79,2.36-.44.78.39.66,2.36.06,2.61-.82.34-1.77.24-2.33.25Z"
                />
                <path
                  className="lodge-st1"
                  d="M284.28,424.73c-.22.4.33,1.22-.07,1.77-.54.75-1.92.34-2.72.35l-.19-1.77c.88-.07,1.89-.53,2.98-.35Z"
                />
                <path
                  className="lodge-st18"
                  d="M262.34,427.03l-.07-1.96,2.36-.29c0,.76.88,1.08.7,2.19-1.06.46-2.17.37-3,.07Z"
                />
                <path
                  className="lodge-st37"
                  d="M262.3,427.38c-1.54.73-3.35.2-5.03.34-.06-.16.04-.4.36-.39l4.66.06Z"
                />
              </g>
            </g>
            <path
              className="lodge-st22"
              d="M319.71,412.84l-12.96.04c2.17-2.5,3.62-5.77,6.18-7.99,1.19,1.06,2.68,2.08,3.26,3.68.04.26-.69.82-.29.9l1.14.21c1.26.23,2.22,1.97,2.67,3.17Z"
            />
            <path
              className="lodge-st4"
              d="M325.73,424.29c-.31,1.99.33,4.02-.16,5.99-.06.26-.08.42.26,1.11-1.49.45-3.05.31-4.72.27-.28-.65-.22-1.16-.21-1.69l.04-2.25c0-.36.06-.73,0-1.09,1.26-.21,2.53.21,3.8-.25-1.31-.41-2.46-.11-3.56-.15-.05-.15-.16-.27-.28-.37.27-.32.07-.84.05-1.18,0-.14-.03-.67.11-.69,1.59-.2,3.41-.54,4.67.31Z"
            />
            <g>
              <path
                className="lodge-st10"
                d="M319.71,412.84c-.04-.88,4.69,4.72,4.2,4.71-.56.33-1.16.08-1.07.65,1.88-.05,3.78.72,3.53,2.77,2.48.03,2.21,3.23,5.23,3.35.25.78.53,1.8-.35,2.18-.49-.15-1.06-.04-1.43-.22-.96-.49-.35-2.07-.96-2.54-.18-.14-3.19-.44-3.11.55-1.26-.86-3.08-.51-4.67-.31-.14.02-.11.56-.11.69-.57.09-.34-.26-.37-1.06-1.52.64-2.96-.08-4.83.27-.38.93-.06,1.95-.06,3.21,1.33.26,3.16.43,4.53-.07.32-.12-.03-1.49.67-1.17.12.11.22.23.28.37-.37-.04-.28.13-.24.4.06.36,0,.72,0,1.09-.89.55-3.64.23-5.34.41-.04.63-.26,1.87.21,2.12,2.68-.04,3.44.44,5.09-.27,0,.53-.07,1.04.21,1.69,1.67.04,3.23.17,4.72-.27-.34-.69-.32-.85-.26-1.11.97-.18,2.02-.05,3.12-.41-.03-1.1-.02-2.07.74-2.32.51-.16,1.22-.55,1.76-.32,1.98,1.18-.73,5.35,1,5.64,2.6.45,5.03.05,7.31.05.09.01.21.52.42.46.64-.2.53-.93.97-1.15.62.28,1.58,1.48,1.39,2.14-.38,1.33-.14,2.61-.13,4.02v3.22c-.45-.01-.95-.05-1.4,0,.15-.57.53-2.3-.03-2.89-.73.3-.45.69-.85,1.39.48-.52-4.86-.41-4.86-.24.36-2.01.59-3.7.71-5.83-1.33-.13-2.45-.09-3.75.11,1.28.71-.5,5.79-.12,7.57l-19.68.55c-2.83.08-5.5.3-8.14.43l-5.65.28c-1.02.05-2.02.3-2.71-.15.17-.67.12-2.35-.26-2.92.12-.14.1-.27-.04-.39.49-.63.95-1.83.07-2.27.17-.14-.03-.31-.04-.43.18-1.24.46-2.96.31-4.45,1.36-2.6-3.84-.28-5.77-1.9l5.68-.09c-.18-1.23.24-2.5-.36-3.37,0-.6.96-2.29-.03-2.88-.57-.34-1.98.35-2.65.05-.18-.24.08-.69.3-.65,2.62.44,3.73-.47,4.35-.43,1.97.11,2.02-1.65,2.95-2.71l6.53-7.52,12.96-.04Z"
              />
              <g>
                <path
                  className="lodge-st17"
                  d="M340.91,432.23c-.43.22-.32.96-.97,1.15-.21.06-.34-.44-.42-.46-.26-.35.3-.69.57-.63.18.04.64-.15.82-.07Z"
                />
                <path
                  className="lodge-st3"
                  d="M306.87,436.54c.16.13.34.04.69-.16v-6.29c-.34-.19-.53-.26-.7-.15l.26-5.61,7.75.15.04,7.4.35,5.56c.03.45.46-.36.54-.18.19.42.23.81.12.97-.15.22-.55.06-.66.19-.26.3-.07,1.09-.47,1.15-2.58.17-5.05.12-7.73-.01-.41-1.09-.19-2.07-.19-3.03Z"
                />
                <path
                  className="lodge-st12"
                  d="M306.34,431.65c-.21-.24.29,8.37-.65,2.51-2.61-.25-5.01-.33-7.73-.44-.79-.03-1.11-1.69-.56-2.22l8.94.15Z"
                />
                <path
                  className="lodge-st9"
                  d="M320.96,424.67c.02.34.21.86-.05,1.18-.7-.32-.36,1.05-.67,1.17-1.37.5-3.2.33-4.53.07,0-1.26-.32-2.28.06-3.21,1.86-.35,3.31.36,4.83-.27.04.8-.2,1.15.37,1.06Z"
                />
                <path
                  className="lodge-st24"
                  d="M320.9,429.97c-1.65.71-2.41.23-5.09.27-.47-.24-.25-1.49-.21-2.12,1.7-.17,4.45.14,5.34-.41l-.04,2.25Z"
                />
                <path
                  className="lodge-st34"
                  d="M306.87,436.54v-6.59c.15-.12.34-.05.69.15v6.29c-.34.2-.53.29-.69.16Z"
                />
              </g>
            </g>
            <path
              className="lodge-st32"
              d="M320.94,426.63c-.04-.27-.13-.44.24-.4,1.1.04,2.24-.26,3.56.15-1.27.46-2.54.04-3.8.25Z"
            />
            <g>
              <path
                className="lodge-st33"
                d="M340.77,441.62c-2.94.41-5.95.03-8.89.11-.37-1.78,1.4-6.86.12-7.57,1.29-.2,2.42-.24,3.75-.11-.13,2.13-.35,3.82-.71,5.83,0-.17,5.34-.29,4.86.24.39-.7.12-1.09.85-1.39.56.59.18,2.32.03,2.89Z"
              />
              <path
                className="lodge-st2"
                d="M333.75,439.51c-.68.15-1.38-.02-.75-.4.34-1.24-.57-3.64.27-4.05,1.68-.82.31,2.76.48,4.45Z"
              />
            </g>
          </g>

          {/* Fluffy White Clouds */}
          <g opacity="0.95">
            <g className="jp-cloud-1" fill="url(#cloud-grad-1)">
              <use
                href="#cloud-base"
                transform="translate(300, 70) scale(0.6)"
              />
              <use
                href="#cloud-base"
                transform="translate(2700, 70) scale(0.6)"
              />
            </g>
            <g className="jp-cloud-2" fill="url(#cloud-grad-2)">
              <use
                href="#cloud-base"
                transform="translate(900, 90) scale(0.4)"
              />
              <use
                href="#cloud-base"
                transform="translate(3300, 90) scale(0.4)"
              />
            </g>
            <g className="jp-cloud-3" fill="url(#cloud-grad-1)">
              <use
                href="#cloud-base"
                transform="translate(1600, 65) scale(0.7)"
              />
              <use
                href="#cloud-base"
                transform="translate(4000, 65) scale(0.7)"
              />
            </g>
            <g className="jp-cloud-4" fill="url(#cloud-grad-2)">
              <use
                href="#cloud-base"
                transform="translate(2100, 80) scale(0.5)"
              />
              <use
                href="#cloud-base"
                transform="translate(4500, 80) scale(0.5)"
              />
            </g>
          </g>

          {/* Atmospheric Glow Particles */}
          <g fill="#FFEE00" opacity="0.7">
            {STATIC.glowParticles.map((p, i) => (
              <circle
                key={`glow-particle-${i}`}
                cx={p.x}
                cy={p.y}
                r={p.r}
                className="jp-particle"
                style={{
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`
                }}
              />
            ))}
          </g>

          {/* Foreground Ground */}
          <path
            d="M -100,400 L -100,150 Q 200,145 500,150 Q 800,140 1000,150 Q 1060,153 1130,135 Q 1170,135 1200,143 Q 1250,153 1300,150 Q 1600,140 1900,150 Q 2200,145 2500,150 L 2500,400 Z"
            fill="#99c126"
          />
          <path
            d="M -100,400 L -100,165 Q 200,160 500,165 Q 800,155 1000,165 Q 1060,168 1130,150 Q 1170,150 1200,158 Q 1250,168 1300,165 Q 1600,155 1900,165 Q 2200,160 2500,165 L 2500,400 Z"
            fill="#b0ce2a"
          />

          <g>
            {[...STATIC.fgTrees]
              .sort((a, b) => a.y - b.y) // higher y behind? (smaller y first = behind)
              .map((t) => {
                const baseY = baseOffsets?.[t.type] ?? 0

                return (
                  <use
                    key={t.id}
                    href={`#tree-shape-${t.type}`}
                    transform={`translate(${t.x}, ${t.y}) scale(${t.scale}) translate(0, ${-baseY})`}
                  />
                )
              })}
          </g>

          {/* Expanded Organic Foreground Bushes */}
          <g>
            {/* Far Left Cluster */}
            <ellipse cx="-20" cy="180" rx="160" ry="50" fill="#0c362d" />
            <ellipse cx="50" cy="185" rx="140" ry="40" fill="#0c362d" />
            <ellipse cx="70" cy="190" rx="120" ry="30" fill="#135644" />
            <ellipse cx="100" cy="200" rx="60" ry="30" fill="#017E58" />
            <ellipse cx="180" cy="195" rx="90" ry="35" fill="#135644" />
            <ellipse cx="250" cy="190" rx="120" ry="30" fill="#135644" />
            <ellipse cx="350" cy="195" rx="100" ry="25" fill="#0c362d" />
            <ellipse cx="450" cy="200" rx="80" ry="20" fill="#135644" />

            {/* Far Right Cluster */}
            <ellipse cx="2450" cy="180" rx="180" ry="50" fill="#0c362d" />
            <ellipse cx="2350" cy="185" rx="160" ry="45" fill="#0c362d" />
            <ellipse cx="2250" cy="195" rx="110" ry="35" fill="#135644" />
            <ellipse cx="2150" cy="200" rx="80" ry="25" fill="#017E58" />
            <ellipse cx="2100" cy="190" rx="130" ry="35" fill="#135644" />
            <ellipse cx="1950" cy="195" rx="100" ry="30" fill="#135644" />
            <ellipse cx="1800" cy="195" rx="100" ry="25" fill="#0c362d" />
            <ellipse cx="1650" cy="198" rx="70" ry="20" fill="#135644" />
          </g>

          {/* Atmospheric Particles */}
          <g fill="#FFFFFF" opacity="0.4">
            {STATIC.particles.map((p, i) => (
              <circle
                key={`particle-${i}`}
                cx={p.x}
                cy={p.y}
                r={p.r}
                className="jp-particle"
                style={{
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`
                }}
              />
            ))}
          </g>

          {/* --- CENTER ACTION --- */}
          <g transform="translate(1150, 110)">
            {/* Character Shadow on Grass */}
            <ellipse
              cx="1"
              cy="27"
              rx="10"
              ry="4"
              fill="#0c362d"
              opacity="0.2"
            />

            {/* Cardboard Box */}
            <g transform="translate(45, 35)">
              <g transform="scale(0.25) translate(-294, -440)">
                <path
                  className="box-st2"
                  d="M339.59,404.17c-.03.94-1.24.32-1.89.41l-4.41.6c-1.46.2-2.73.31-4.09.43l-3.61.31-4.4.44-4,.32-6,.5c-1.08.09-3.14-.43-3.62.98-1.32,3.94-.64,8.33-.64,12.88l-.03,46.12-67.94-4.95-.21-9.1.26-28.26c.91.36,1.9.41,2.91.53l17.31,2.04,28.14,2.66c4.03.38,7.81.79,11.81.67,2.81-.09,4.87-9.75,5.68-12.21.55-1.68.94-3.25.89-5.18-.03-1.17,1.06-5.01.25-4.84.21-.38.26-.83.4-1.24.25.02.42.21.62.2.37-.02.5-.47.88-.52,5.08-.64,10.71-1.01,15.78-1.42l3.97-.32,4.17-.38,3.36-.44c1.16-.15,3.33.07,4.4-.22Z"
                />
                <path
                  className="box-st6"
                  d="M239.01,424.84c.02-2.06-.18-4.14.03-6.2l58.5,4.92,8.47-15.05c.81-.18-.28,3.67-.25,4.84.05,1.94-.34,3.5-.89,5.18-.81,2.47-2.87,12.13-5.68,12.21-4,.12-7.78-.29-11.81-.67l-28.14-2.66-17.31-2.04c-1.01-.12-2-.17-2.91-.53Z"
                />
                <path
                  className="box-st9"
                  d="M296.08,397.31c-.17.41.07.8.07,1.23l-.05,7.8-52.59-4.56c-.33-.03-.75-.39-1.06-.27,1.75-.58,3.62-.31,5.76-.47l47.87-3.73Z"
                />
                <path
                  className="box-st5"
                  d="M341.42,403.94c1.56,1.15,5.02-.24,7.31-.06.61,1.84,1.55,3.61,2.53,5.45l5.24,9.85c-2.76.08-5,1.19-7.29,1.4l-6.32.57-25.83,3.33c-.49.06-1.78-.27-1.9-.91-.13-.72-2.37-4.99-2.64-5.59l-1.94-4.39c.18-.2.64-.5.27-.59-1.22-.31-2.56-3.79-3.28-4.84.47-1.41,2.54-.89,3.62-.98l6-.5,4-.32,4.4-.44,3.61-.31c1.37-.12,2.63-.23,4.09-.43l4.41-.6c.65-.09,1.86.54,1.89-.41.45-.12,1.35-.58,1.84-.22Z"
                />
                <path
                  className="box-st4"
                  d="M343,404.78c-.5-.49-1.44.14-1.91.31-1.12.4-3.37.09-4.58.3l-3.49.61-4.34.52-4.13.44c-5.29.57-11.15,1.08-16.43,1.97-.39.07-.52.69-.91.72-.21.01-.38-.24-.65-.27l-10.74-1.28.05-10.79,36.47,4.96,12.37,1.98c-.62.86-1.26.12-1.7.52Z"
                />
                <g>
                  <path
                    className="box-st12"
                    d="M349.22,420.58l.33,14.59-.11,22.95-22.04,4.75-20.5,4.28.03-46.12c0-4.54-.68-8.94.64-12.88.72,1.05,2.06,4.53,3.28,4.84.37.09-.09.4-.27.59l1.94,4.39c.26.6,2.5,4.87,2.64,5.59.12.64,1.41.97,1.9.91l25.83-3.33,6.32-.57Z"
                  />
                  <g>
                    <path
                      className="box-st0"
                      d="M339.21,448.04l-.03,8.42c0,.51-.77.63-.74,1.1l-7.62,1.55c-.34.07-.66-.17-.76.16-.05.15.02.38,0,.58-.45.31-1.94.05-1.93-.42.58.28.86-.15.46-.35-.17-.08-.16-.62.2-.84s1.03-.05,1.31-.17c.95-.42-1.18-.34.19-4.46.1-.29-.47-.69-.21-1.19.14-.27.43-.55.84-1.15-.96-.29-1.86-.11-2.74-.19,0-.32-.15-.91.17-1.15.24-.18.65-.32.98-.37-.15.27.2.35.33.58.18.33.35.04.77-.06l5.34-1.29c.33-.08.65.15.76-.17.05-.15-.01-.37,0-.58.93-.29,1.91.16,2.67,0Z"
                    />
                    <g>
                      <path
                        className="box-st1"
                        d="M328.13,459.43l.04-2.41c.71.22,1.45.32,1.44.1-.34-4.08.35-2.73-.47-5.19-.94-2.84-.31,5.98-.76,5.12-.49-2.16-.23-4.05-.19-5.98.88.08,1.78-.1,2.74.19-.41.6-.7.89-.84,1.15-.26.5.31.9.21,1.19-1.37,4.12.76,4.03-.19,4.46-.28.12-.95-.05-1.31.17s-.37.76-.2.84c.4.19.12.63-.46.35Z"
                      />
                      <path
                        className="box-st7"
                        d="M329.34,449.56c2.4-.61,4.87-.79,7.2-1.52-.02.21.05.43,0,.58-.1.32-.43.09-.76.17l-5.34,1.29c-.42.1-.59.38-.77.06-.13-.23-.48-.31-.33-.58Z"
                      />
                      <path
                        className="box-st3"
                        d="M338.45,457.56c-.45,1.14-7.92,1.98-8.38,2.29.02-.19-.05-.42,0-.58.11-.33.43-.09.76-.16l7.62-1.55Z"
                      />
                      <path
                        className="box-st3"
                        d="M338.45,457.56c-.04-.47.73-.59.74-1.1l.03-8.42c.94,2.98.03,6.22.46,9.46-.65.13-.89.04-1.22.06Z"
                      />
                      <path
                        className="box-st10"
                        d="M334.86,456.35l.3-4.98c.91,1.37-.14,2.76.46,3.8.17.29.86.55,1.02.35.29-.36.21-4.2.05-4.71-.08-.26-.22-.47-.23-.67-.03-.37.31-.61.6-.51,1.19.38-.09,3.51.48,6.16-.48.69-1.9.53-2.68.56Z"
                      />
                      <path
                        className="box-st8"
                        d="M335.23,451.36c-.54-.51-.5-1.29-.01-1.68.35.23.51.36.54.55.05.33.16.68-.53,1.13Z"
                      />
                    </g>
                  </g>
                </g>
                <path
                  className="box-st11"
                  d="M242.45,401.51c.31-.12.73.24,1.06.27l52.59,4.56,10.32.92c-.14.4-.19.86-.4,1.24l-8.47,15.05-58.5-4.92-8.34-1.2,9.18-15.39c.53-.89,1.9-.31,2.56-.54Z"
                />
              </g>

              {/* Interface App Icons floating above */}
              <g fill={themeColor} opacity="1">
                <rect
                  x="-10"
                  y="-22"
                  width="4"
                  height="4"
                  rx="1"
                  className="jp-hover-app"
                  style={{ animationDelay: "0s" }}
                />
                <circle
                  cx="-1"
                  cy="-24"
                  r="2"
                  className="jp-hover-app"
                  style={{ animationDelay: "1.5s" }}
                />
                <polygon
                  points="4,-18 7,-13 1,-13"
                  className="jp-hover-app"
                  style={{ animationDelay: "0.8s" }}
                />
              </g>
            </g>

            {/* Sitting Boy (From Provided SVG) */}
            <g transform="translate(0, 27) scale(0.35) translate(-297, -495)">
              <path
                fill="#f7b220"
                d="M315.18,436.69l.11,3.33c.03.89.18,2.06-.59,2.33-2.46.53-5.23.75-7.68.9,1.8-2.48,3.18-5.2,4.37-8.02.61-1.45,1.17-2.94,1.88-4.34,1.19,1.53,1.84,3.76,1.91,5.81h0Z"
              />
              <g>
                <path
                  fill="#3c1f4e"
                  d="M315.83,351c4,3.21,5.02,8.58,1.56,12.64-.72.84-1.55,1.55-2.31,2.23-1.7-.37-1.51,1.55-3.56,4.45-1.37,1.94-2.16,3.97-3.36,6.35l-1.68-2.96c-.89-1.57-2.96-1.85-4.47-.73-1.78,1.32-2.45,3.54-2,5.77.37,1.85,1.54,3.48,4.02,4.14-2.6,3.19-6.2,5.36-10.29,5.48l-4.47.13c-8.76-3.41-14.86-11.25-15.53-20.86-.18-2.58-.03-5.38.87-7.81.79-2.15,2.77-3.89,4.87-4.86-.42-.64-.79-1.68-.6-2.56.12-.58.59-1.45,1.56-1.67.64-.15,1.01.62,1.34.9,5.19-6.13,15.04-6.16,22.23-4.71,1.37.28,2.66.29,3.52-.52.83-.04,1.94-.72,2.87-.56s1.01,1.24.97,1.9c-.03.53-.5,1.12-.78,1.62,1.65.75,3.91.58,5.24,1.64Z"
                />
                <path
                  fill="#1e2c7f"
                  d="M313.61,445.45c.73,6.08.77,12.32.58,18.71-.04,1.23-1.95,1.27-2.78,1.72l-1,12.35c-3.15.35-6.3.13-9.46.02-.94-3.83-.14-8.12-.73-12.16-3.79.64-2.11-4.94-3.82-8.11-.89,2.39-.75,7.86-2.78,8.54l-1.94,11.51c-.04.26-.8.08-.61.52-2.82-.07-5.68-.16-8.45-.7-.84-3.89.44-7.99.23-12.18-.57-.17-2.67-.2-2.62-1.18.32-6.11.52-12.08,1.29-17.91,10.38,1.16,21.79,1.57,32.09-1.14Z"
                />
                <path
                  fill="#feb817"
                  d="M314.41,402.79c1.43,3.04,2.79,6.12,4.02,9.19.62,1.55,1.2,3.5,1.57,5.28.23,1.09-1.58,1.33-2.24,1.51l-5.58,1.54c-1.23.34-2.07.41-2.84.78-.5-.06-1.16-.73-1.78-.3-.15-3.48-.35-6.93-.93-10.37-.4-2.35-.71-4.87-1.86-7,1.31-1.25,5.24-5.78,7.36-3.33.74.85,1.81,1.71,2.27,2.69Z"
                />
                <path
                  fill="#fea319"
                  d="M315.03,437.12c.29,2.13-.09,4.48-.09,6.83,0,.74-.87,1.38-1.33,1.5-10.3,2.71-21.71,2.3-32.09,1.14-2.55-.28-3.06-2.6-4.36-3.82,6.25.57,12.52,1.15,18.81.8,5.49-.31,9.58-1.04,12.52-5.98l3.9-6.56c.51,2.04,2.36,3.95,2.65,6.1Z"
                />
                <path
                  fill="#20318a"
                  d="M293.46,494.67c-1.77.72-3.73.95-5.82.92l-6.22-.1c-.26-.09-.1-.22-.1-.4.01-.43.24-6.5,1.38-5.85,1.63-.42,5.77,1.19,6.93-.69,1.65,1.72,4.21,2.66,3.82,6.12Z"
                />
                <path
                  fill="#21318b"
                  d="M316.93,495.03c-5.12.98-10.37.54-15.57.66-.15-.42-.5-.58-.45-1.03.17-1.8.09-3.76.86-5.35,2.95-.13,6.36,1.44,7.96-1.18,2.05,1.26,9.11,3.25,7.2,6.89Z"
                />
                <path
                  fill="#fefdfe"
                  d="M309.4,486.27l.33,1.86c-1.6,2.62-5.01,1.05-7.96,1.18-.56-.88.08-2.24-.04-3.11,2.55.15,5.12.2,7.67.07Z"
                />
                <path
                  fill="#cce3f8"
                  d="M281.43,495.49l6.22.1c2.09.03,4.05-.2,5.82-.92-.05.44.24.72-.12.97-2.36,1.67-11.42,1.65-11.85.72-.13-.29-.01-.57-.07-.88Z"
                />
                <g>
                  <path
                    fill="#ffa89c"
                    d="M315.03,437.12c-.29-2.15-2.14-4.06-2.65-6.1-.37-1.46-.74-2.88-1.52-4.21-.63-1.07-.45-2.76-.74-3.92,1.13-1.09,6.32-.6,7.21-2.96l4.29,19.03c.45,2.01,1.33,3.67,1.01,5.78-.27,1.73-1.41,3.81-3.33,3.76-1.26-.03-1.18-1.74-1.21-2.76-3.52-.85.59-3.97-3.05-8.61Z"
                  />
                  <path
                    fill="#ff9e95"
                    d="M310.42,478.23l-.36,3.75c-.14,1.45-.24,2.88-.66,4.29-2.56.14-5.12.08-7.67-.07l-.68-4.82c-.14-.96.15-2.15-.09-3.12,3.16.11,6.32.33,9.46-.02Z"
                  />
                  <path
                    fill="#fe8882"
                    d="M317.76,418.78c.02.28-.08.39-.22.41-.54.09-.29.5-.22.74-.89,2.37-6.08,1.88-7.21,2.96-.38-.45-.93-1.03-.78-1.79.77-.38,1.61-.44,2.84-.78l5.58-1.54Z"
                  />
                  <path
                    fill="#ff9e95"
                    d="M291.07,478.56c.38.88-.24,1.92.32,2.75-1.36,0-.67,4.92-1.76,4.91-2.43.19-4.87.1-7.3-.04.02-1.74.1-3.42-.09-5.14-.1-.93.2-2.32.38-3.18,2.77.54,5.63.63,8.45.7Z"
                  />
                  <path
                    fill="#fdfdfd"
                    d="M289.63,486.22c.25.61.39,1.7,0,2.33-1.16,1.88-5.3.26-6.93.69-.81-.83-.39-2-.38-3.05,2.43.14,4.87.23,7.3.04Z"
                  />
                  <path
                    fill="#feb51e"
                    d="M291.89,395.05c3.16.99,6.48.3,9.76.33.54,0,1.02.24,1.54.35l-3.94,3.31c-3.73-1.22-7.18-.87-11.01-1.23-.24-1.12.81-2.15,1.69-2.66.51,0,1.46-.25,1.95-.09Z"
                  />
                  <g>
                    <path
                      fill="#ffa499"
                      d="M315.08,365.88c.21,1.12.04,2.27,0,3.41-.03.77.43,2.18-.07,2.96-1.07,1.66-.68,2.54.26,4.05.61.97.53,2.64.75,3.7.2.96-.67,2.03-.25,3-.63.2-.22,1.03-.32,1.52-.8,1.07-2.12,1.96-2.01,3.32-.33-.4-.7.18-1.06.47-3.01,2.43-6.61,3.33-10.48,3.64-.34,1.24-.26,2.36-.25,3.42-3.28-.03-6.6.66-9.76-.33-.12-1.23.83-2.65.28-4.12-.38-1.01-2.18-1.71-2.9-2.44l4.47-.13c4.08-.12,7.69-2.29,10.29-5.48-2.47-.65-3.65-2.29-4.02-4.14-.45-2.23.22-4.45,2-5.77,1.5-1.11,3.58-.84,4.47.73l1.68,2.96c1.2-2.38,1.99-4.41,3.36-6.35,2.05-2.9,1.85-4.82,3.56-4.45Z"
                    />
                    <path
                      fill="#ff8480"
                      d="M304.96,377.71c-.13-.91-.82-1.15-1.8-1.67.55-.59,1.09-.29,1.45.09s.94.76.35,1.57Z"
                    />
                    <path
                      fill="#374d6b"
                      d="M315.45,384.52c.1-.49-.31-1.32.32-1.52.3.69,0,1.11-.32,1.52Z"
                    />
                  </g>
                </g>
                <g>
                  <path
                    fill="#1870e6"
                    d="M274.8,406.62l1.39-3.8c.18-.48.95-.76,1.12-1.18.53-.45.92.65,1.37.65,1.36,0,2.8-.85,4.03-.94,2.18-.14,4.5-.24,6.69.11l2.86.45c4.84.76,7.05,4.56,7.03,9.12-.02,3.26.04,4.89-.17,8.13l-.51,8.05c-.17,2.72-.45,5.35-1.2,7.92-.56,1.93-2.4,3.12-4.46,3.34-4.57.5-9.15.09-13.67-.47-6.25-.76-5.47-6.95-5.24-13.01.03-.75.55-1.73.54-2.38-.03-1.62-.75-3.24.21-4.85,1.52.65,3.13.83,4.86.64-.25.03,17.59,1.38,17.46-.55-.27-.64-.97.15-1.23.15h-17.61c1.14,0-2.26-.31-3.11-.92-.16-.11-.53-3.03-.02-3.71.39-.52,2.96-1.43,4.6-.69.21.09.57-.46.88-.42.34.05.53.38.9.41,2.77.21,5.35-.2,7.94.19,2.31.34,4.56.44,7,.06l-3.99-.6-7.65-.14c-2.98-.06-6.14-.02-9.25-.21-1.04-1.31.63-5.34-.75-5.34Z"
                  />
                  <path
                    fill="#1764de"
                    d="M289.94,395.14c-.88.51-1.93,1.54-1.69,2.66,3.83.36,7.28.01,11.01,1.23l3.94-3.31c2.6-.52,5.29.07,7.36,1.93-1.91.61-8.32,4.32-5.77,5.78,1.15,2.13,1.46,4.65,1.86,7-.18-.08-.48.12-.79-.15-.21-.18-.31.3-.62.53-1.57.24-2.72.22-4.38.73l-.31,2.76c-1.08.95-.51-3.94-.82-5.28-1.34-5.72-3.32-6.89-8.81-7.93-2.62-.5-5.38.03-8.14-.22-.1.23-.12.46-.06.48-1.23.08-2.67.93-4.03.94-.45,0-.83-1.1-1.37-.65.85-2.06,3.69-2.07,5.2-3.54s2.42-2.99,4.82-3.41c.9-.16,2.07-.52,2.6.46Z"
                  />
                  <path
                    fill="#1456d2"
                    d="M300.53,414.3c.32-2.85.08,10.68,1.03,7.99l.03,10.91c0,2.8-.71,5.45-1.78,8.01-1.34,3.19-4.25.44-3.84,2.37-6.29.35-12.56-.23-18.81-.8-2.22-2.1-4.52-3.12-4.65-6.8s-.46-7.83.06-11.82c.3-2.31-.06-4.5.22-6.55l1.05-7.58c.18-1.34.6-2.4.96-3.4,1.38,0-.28,4.03.75,5.34,3.11.2,6.27.16,9.25.21l7.65.14,3.99.6c-2.44.38-4.69.29-7-.06-2.59-.38-5.17.02-7.94-.19-.37-.03-.56-.36-.9-.41-.31-.04-.67.51-.88.42-1.64-.74-4.21.17-4.6.69-.51.68-.13,3.59.02,3.71.85.61,4.25.91,3.11.91h17.61c.26,0,.96-.78,1.23-.14.13,1.93-17.71.58-17.46.55-1.72.19-3.34,0-4.86-.64-.96,1.62-.24,3.24-.21,4.85.01.64-.51,1.62-.54,2.38-.22,6.06-1.01,12.24,5.24,13.01,4.53.55,9.1.97,13.67.47,2.07-.23,3.9-1.41,4.46-3.34.74-2.57,1.03-5.2,1.2-7.92l.51-8.05c.2-3.24.15-4.87.17-8.13.03-4.56-2.19-8.36-7.03-9.12l-2.86-.45c-2.19-.34-4.52-.25-6.69-.11-.06-.02-.04-.25.06-.48,2.76.25,5.52-.28,8.14.22,5.49,1.04,7.47,2.21,8.81,7.93.31,1.34-.26,6.24.82,5.28Z"
                  />
                  <path
                    fill="#1450c9"
                    d="M306.64,410.43c.58,3.44.78,6.89.93,10.37.11,2.5.28,5.03.52,7.53-.39-.02-.21.38-.26.58-.09.37.09.57.39.57.06.4-.35.86.18,1.54.86-1.41,1.79-2.72,2.47-4.2.78,1.33,1.15,2.75,1.52,4.21l-3.9,6.56c-2.94,4.94-7.02,5.68-12.52,5.98-.41-1.93,2.49.82,3.84-2.37,1.07-2.55,1.79-5.21,1.78-8.01l-.03-10.91c-.94,2.69-.7-10.84-1.03-7.99l.31-2.76c1.66-.5,2.81-.48,4.38-.73.31-.23.41-.71.62-.53.32.27.61.07.79.15Z"
                  />
                  <path
                    fill="#feb117"
                    d="M309.35,421.1c-.15.76.4,1.34.78,1.79.29,1.16.12,2.85.74,3.92-.68,1.48-1.61,2.8-2.47,4.2-.53-.68-.12-1.13-.18-1.54-.03-.38.12-.81-.13-1.14-.24-2.49-.42-5.02-.52-7.53.62-.43,1.27.24,1.78.3Z"
                  />
                  <path
                    fill="#a95c7e"
                    d="M308.22,429.48c-.29,0-.48-.2-.39-.57.05-.2-.13-.6.26-.58.24.33.1.76.13,1.14Z"
                  />
                </g>
              </g>
            </g>
          </g>

          {/* Grain Overlay */}
          <rect
            x="0"
            y="0"
            width="2400"
            height="400"
            filter="url(#grain)"
            opacity="1"
            style={{ mixBlendMode: "overlay", pointerEvents: "none" }}
          />
        </svg>

        <style>{`
          /* Tree SVG Styles mapped from user snippet */
          .tree-st0 { fill: #035d7c; }
          .tree-st1 { fill: url(#linear-gradient-tree5); }
          .tree-st2 { fill: #015a37; }
          .tree-st4 { fill: #035373; }
          .tree-st5 { fill: #a33822; }
          .tree-st6 { fill: #078241; }
          .tree-st7 { fill: #04362e; }
          .tree-st8 { fill: #004533; }
          .tree-st9 { fill: #0c6e3e; }
          .tree-st10 { fill: url(#linear-gradient-tree1); }
          .tree-st11 { fill: #5b1617; }
          .tree-st12 { fill: #49181c; }
          .tree-st13 { fill: #04323a; }
          .tree-st14 { fill: #388d42; }
          .tree-st15 { fill: #0a773d; }
          .tree-st16 { fill: #006e4c; }
          .tree-st17 { fill: #0b2344; }
          .tree-st18 { fill: #64161f; }
          .tree-st19 { fill: #043b32; }
          .tree-st20 { fill: #094369; }
          .tree-st21 { fill: #04323b; }
          .tree-st22 { fill: #04312e; }
          .tree-st23 { fill: #3b131e; }
          .tree-st24 { fill: #055f48; }
          .tree-st25 { fill: #066181; }
          .tree-st26 { fill: #035271; }
          .tree-st27 { fill: #7f2322; }
          .tree-st28 { fill: #04353d; }
          .tree-st29 { fill: #172f58; }
          .tree-st30 { fill: #133358; }
          .tree-st31 { fill: #046238; }
          .tree-st32 { fill: #172f56; }
          .tree-st33 { fill: #a33723; }
          .tree-st34 { fill: #128944; }
          .tree-st35 { fill: #045545; }
          .tree-st36 { fill: #00674b; }
          .tree-st37 { fill: #25152b; }
          .tree-st38 { fill: #7f2321; }
          .tree-st39 { fill: #02643d; }
          .tree-st40 { fill: #022926; }
          .tree-st41 { fill: #30763a; }
          .tree-st42 { fill: #043932; }
          .tree-st43 { fill: #6a1619; }
          .tree-st44 { fill: #44121d; }
          .tree-st45 { fill: #71181e; }
          .tree-st46 { fill: #34b44a; }
          .tree-st48 { fill: #3f121d; }
          .tree-st49 { fill: #023339; }
          .tree-st50 { fill: #006b3f; }
          .tree-st52 { fill: #01693f; }
          .tree-st53 { fill: #123a61; }
          .tree-st54 { fill: #45121d; }
          .tree-st55 { fill: #063534; }
          .tree-st56 { fill: #25a84a; }
          .tree-st57 { fill: #211629; }
          .box-st0 { fill: #996765; }
          .box-st1 { fill: #5e455b; }
          .box-st2 { fill: #e8b388; }
          .box-st3 { fill: #6d4b57; }
          .box-st4 { fill: #c6856c; }
          .box-st5 { fill: #cc9075; }
          .box-st6 { fill: #c78065; }
          .box-st7 { fill: #644459; }
          .box-st8 { fill: #3d3251; }
          .box-st9 { fill: #a15a50; }
          .box-st10 { fill: #4b3b58; }
          .box-st11 { fill: #f6cfa1; }
          .box-st12 { fill: #ae6e62; }

          /* Lodge SVG Styles */
          .lodge-st0 { fill: #a0747e; }
          .lodge-st1 { fill: #fce454; }
          .lodge-st2 { fill: #7d7a8d; }
          .lodge-st3 { fill: #5d4b7a; }
          .lodge-st4 { fill: #ecb958; }
          .lodge-st5 { fill: #bc7f81; }
          .lodge-st6 { fill: #6b4d78; }
          .lodge-st7 { fill: #845e7b; }
          .lodge-st8 { fill: #f9e15f; }
          .lodge-st9 { fill: #90667f; }
          .lodge-st10 { fill: #7c5d7e; }
          .lodge-st11 { fill: #cc8780; }
          .lodge-st12 { fill: #946981; }
          .lodge-st13 { fill: #af747a; }
          .lodge-st14 { fill: #f7dd5a; }
          .lodge-st15 { fill: #e09982; }
          .lodge-st16 { fill: #fadc60; }
          .lodge-st17 { fill: #996e7f; }
          .lodge-st18 { fill: #f1cb60; }
          .lodge-st19 { fill: #f3cf62; }
          .lodge-st20 { fill: #fde05d; }
          .lodge-st21 { fill: #ce8a80; }
          .lodge-st22 { fill: #875f7c; }
          .lodge-st23 { fill: #c98780; }
          .lodge-st24 { fill: #91677e; }
          .lodge-st25 { fill: #fbdb59; }
          .lodge-st26 { fill: #a66d7a; }
          .lodge-st27 { fill: #b97c7d; }
          .lodge-st28 { fill: #89617e; }
          .lodge-st29 { fill: #f8d85d; }
          .lodge-st30 { fill: #af747b; }
          .lodge-st31 { fill: #93657e; }
          .lodge-st32 { fill: #cb926c; }
          .lodge-st33 { fill: #476b96; }
          .lodge-st34 { fill: #453e73; }
          .lodge-st35 { fill: #fde157; }
          .lodge-st36 { fill: #fde457; }
          .lodge-st37 { fill: #946675; }
          .lodge-st38 { fill: #cb8584; }

          @keyframes jp-fade-pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }

          /* New animated Sun Rays (Shrinks away, fades out) */
          @keyframes jp-sun-ray-shrink {
              0% { transform: scaleX(1); opacity: 0.8; }
              50% { transform: scaleX(0.3); opacity: 0.2; }
              100% { transform: scaleX(1); opacity: 0.8; }
          }
          .jp-sun-ray {
               animation: jp-sun-ray-shrink 3s infinite ease-in-out;
          }

          /* New pulsating Bloom for the Sun */
          @keyframes jp-sun-glow-pulse {
              0%, 100% { transform: scale(1.05); opacity: 0.1; }
              50% { transform: scale(1.01); opacity: 0.7; }
          }
          .jp-sun-glow {
              animation: jp-sun-glow-pulse 4s infinite ease-in-out;
              transform-origin: 0px 0px;
          }

          /* Smooth endless rotation for the rays container */
          @keyframes jp-sun-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
          }
          .jp-sun-spin {
              animation: jp-sun-spin 45s linear infinite;
              transform-origin: 0px 0px;
          }

          .jp-bird-fly-ltr {
            animation-name: jp-flight-pan-ltr;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }

          @keyframes jp-flight-pan-ltr {
            from { transform: translateX(0); }
            to { transform: translateX(2400px); }
          }

          .jp-bird-swoop {
            animation: jp-bird-swoop-anim ease-in-out infinite;
          }
          @keyframes jp-bird-swoop-anim {
            0%   { transform: translateY(0px); }
            25%  { transform: translateY(-15px); }
            50%  { transform: translateY(5px); }
            75%  { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }

          .jp-bird-flap {
            animation: jp-bird-flap-anim ease-in-out infinite alternate;
            transform-origin: 10px 7px;
          }
          @keyframes jp-bird-flap-anim {
            0% { transform: scaleY(1); }
            100% { transform: scaleY(0.3); }
          }

          .jp-cloud-1 { animation: jp-cloud-drift 140s linear infinite; }
          .jp-cloud-2 { animation: jp-cloud-drift 180s linear infinite; }
          .jp-cloud-3 { animation: jp-cloud-drift 160s linear infinite; }
          .jp-cloud-4 { animation: jp-cloud-drift 200s linear infinite; }

          @keyframes jp-cloud-drift {
            from { transform: translateX(0); }
            to { transform: translateX(-2400px); }
          }

          .jp-particle {
            animation-name: jp-float-particle;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
            animation-direction: alternate;
          }

          @keyframes jp-float-particle {
            0% { transform: translateY(0px) translateX(0px); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: translateY(-15px) translateX(10px); opacity: 0; }
          }

          .jp-beam-pulse {
            animation: jp-beam 2s infinite alternate ease-in-out;
          }

          @keyframes jp-beam {
            0% { opacity: 0.4; }
            100% { opacity: 1; }
          }

          .jp-hover-app {
            animation: jp-hover 3s infinite alternate ease-in-out;
            transform-box: fill-box;
            transform-origin: center;
          }

          @keyframes jp-hover {
            0% { transform: translateY(0px); opacity: 0.6; }
            100% { transform: translateY(-4px); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Dark-mode scene - Meteor Shower                                            */
/* -------------------------------------------------------------------------- */

function JobProgressDark({
  job: _job,
  color
}: {
  job?: JobProgressData
  color?: string
}) {
  const themeColor = color || "#38BDF8"
  const baseOffsets = TREE_BASE_OFFSETS

  return (
    <>
      <div className="absolute inset-0 bg-[#0B132B] overflow-hidden rounded-xl border border-border/20 shadow-inner">
        <svg
          viewBox="0 0 2400 185"
          preserveAspectRatio="xMidYMid slice"
          className="block w-full h-full dark-scene"
          fill="none"
        >
          <defs>
            {/* Deep Night Gradients */}
            <linearGradient
              id="sky-grad-dark"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#0B132B" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>

            <linearGradient
              id="beam-grad-dark"
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor={themeColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
            </linearGradient>

            <linearGradient
              id="cloud-grad-dark-1"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            <linearGradient
              id="cloud-grad-dark-2"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            {/* Missing Tree Foliage Gradients (Tinted for Dark Mode) */}
            <linearGradient
              id="linear-gradient-tree1-dark"
              x1="163.85"
              y1="140.06"
              x2="63.11"
              y2="151.06"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(-140, -225)"
            >
              <stop offset="0" stopColor="#0B1B3D" />
              <stop offset="1" stopColor="#020617" />
            </linearGradient>
            <linearGradient
              id="linear-gradient-tree5-dark"
              x1="309.42"
              y1="584.58"
              x2="244.2"
              y2="670.9"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(-295, -691)"
            >
              <stop offset="0" stopColor="#050F24" />
              <stop offset="1" stopColor="#020617" />
            </linearGradient>

            <g id="cloud-base">
              <path d="M -20,0 a 20,20 0 0,1 40,-10 a 25,25 0 0,1 50,0 a 20,20 0 0,1 30,10 z" />
            </g>

            <filter id="grain-dark" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.3"
                numOctaves="2"
                result="noise"
              />
              <feColorMatrix
                type="saturate"
                values="0"
                in="noise"
                result="desaturatedNoise"
              />
              <feComponentTransfer in="desaturatedNoise" result="theNoise">
                <feFuncA type="linear" slope="0.3" intercept="0" />
              </feComponentTransfer>
            </filter>

            {/* Haze Gradient */}
            <linearGradient
              id="haze-grad-dark"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="90"
              x2="0"
              y2="140"
            >
              <stop offset="0%" stopColor="#263039" stopOpacity="0" />
              <stop offset="100%" stopColor="#0A2D4E" stopOpacity="0.65" />
            </linearGradient>

            {/* Detailed Trees (Prefixed with dark- to safely apply nighttime CSS) */}
            <g id="dark-tree-shape-1">
              <g transform="scale(0.35) translate(-140, -200)">
                <g transform="translate(0,-3)" data-tree-trunk="1">
                  {/* Shortened Trunks */}
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 108)"
                    className="dark-tree-st54"
                    d="M123.76,216.35c-2.41-1.09-1.16-1.88-3.16-2.02v10.45c0,.34.56.32.7.3s.22.27.18.42c-.15.24-.41-.08-.78.09l-.02,35c-3.14-.04-6.58,1.01-9.81.31-.16-.28-.34-.48-.43-.8.37-.83.49-1.73.61-2.76,1.61-13.33,2.94-26.6,3.63-39.88,1.47-1.94,3.34-3.48,5.27-5.43,1.89,2.61,2.71,2.83,3.82,4.33Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 108)"
                    className="dark-tree-st18"
                    d="M123.76,216.35c1.21.55,2.26,1.54,3.27,2.31l.35,8.24c-1.97-.47-4.19-.32-5.91-1.4.04-.15-.04-.45-.18-.42s-.69.04-.69-.3v-10.45c1.99.14.75.92,3.16,2.02Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 108)"
                    className="dark-tree-st5"
                    d="M121.47,225.5c1.72,1.09,3.94.93,5.91,1.4l1.8,21.79c.16,1.94.04,3.97,1.05,5.68-1.15-.14.37,5.6.06,6.36l-9.62-.13.02-35c.37-.17.63.16.78-.09Z"
                  />
                  <path
                    className="dark-tree-st21"
                    d="M135.19,94.41c-.56,0-1.16-.2-1.93-.03-.28.06-.03.61,0,.75-3.8.24-10.56-.52-10.59-6.25,2.36,2.12,4.53,3.68,7.57,4.12-.72-.11,6.94,1.26,4.95,1.41Z"
                  />
                </g>

                <path
                  className="dark-tree-st10"
                  d="M121.48,63.5l-.29,38.78,1.83,2.41c-.38.02-.68-.26-1.06-.04-.05-.22-.03-.38-.1-.53-.06-.11-.29-.24-.39-.18-.42.28-.3,18.53-.1,21.38.14,2.03,2.63,4.57,3.88,5.97-.38.23-.6.72-.75,1.12-1.26-.78-1.92-1.65-3.19-3.17.03,6.51-.58,12.54.1,18.92.41,3.87,4.31,6.8,7.4,8.45.03.36-.37.69-.14,1.05-1.28-.44-3.13.03-4.05-1.68-1.44-.27-1.37-1.7-3.24-2.49-.06,6.56-.65,12.94.1,19.27.31,2.63,3.21,4.85,4.79,6.67,1.78,2.04,3.79,3.22,6.26,4.18,4.65,1.81,3.46-9.12,3.2-11.42-.07-.6-.27-1.93.57-1.93,6.43,5.19,13.39,9.06,21.34,10.74,4.02.85,9.48,1.02,12.54-1.22.95,1.29,2.53,2.47,2.38,4.59-1.06,5.29-13.01,2.75-16.74,1.58l20.38,26.24c1.05,1.36,1.73,2.77,2.8,3.86v1.01c-.83.96-1.98,1.5-3.44,1.65-10.73,1.1-21.74-1.49-31.81-5.8.42,3.02,3.38,8.62,1.25,10.33-.47.38-1.32.66-2.1.52-5.52-1-10.71-3-15.87-5.1-1.01-.77-2.06-1.76-3.27-2.31-1.11-1.5-1.93-1.72-3.82-4.33-1.93,1.95-3.8,3.5-5.27,5.43-.05-.19,0-.46-.32-.26-6.35,3.92-13.26,6.66-20.63,7.09-.84.05-1.73-.31-2.06-.75s-.26-1.25.03-1.89l3.51-7.69c-9.22,4.84-19.46,6.51-29.69,5.08-.62-.09-1.08-.61-1.31-.85-.82-.86,3.25-5.78,4.37-7.26l17.43-22.9c-4.34.99-8.1,1.81-11.82.31-1.31-.53-2.45-1.61-2.73-2.85-.26-1.14.19-2.55.88-3.52l8.34-11.72c2.57-3.61,5.64-6.94,8.02-10.75.7-1.11,2.22-1.82,2.69-3.45-2.95.82-5.65,1.34-8.36,1.21-1-.04-2.2-.94-2.68-1.9-.34-.68-.09-1.53.22-1.95,1.14-1.54,2.46-2.9,3.92-4.52,4.59-5.13,9.12-9.89,13.39-15.45-2.77.63-7.95,2.57-9.37-.12-.33-.62-.1-1.58.55-2.38,5.62-6.95,11.25-13.54,16.58-20.94-2.17.4-7.8,2.23-8.44-.16-.15-.54.12-1.29.52-1.82l6.63-8.69c1.15-1.51,3.42-2.67,4.01-4.93-.86.32-3.04.41-3.39-.74l15.67-30.13c.32-.03.59-.68.82-.03Z"
                />
                <path
                  className="dark-tree-st35"
                  d="M128.67,157.66c3.63,1.26,2.93-2.72,6.04-1.37,5.28,2.29,11.08,2.48,16.33.67l16.45,18.99c1.1,1.27,1.81,2.64,2.69,3.83-3.07,2.24-8.52,2.07-12.54,1.22-7.95-1.68-14.91-5.55-21.34-10.74-.84,0-.64,1.33-.57,1.93.26,2.31,1.45,13.24-3.2,11.42-2.47-.96-4.48-2.14-6.26-4.18-1.58-1.82-4.47-4.03-4.79-6.67-.75-6.33-.16-12.71-.1-19.27,1.87.78,1.81,2.21,3.24,2.49.92,1.71,2.77,1.24,4.05,1.68Z"
                />
                <path
                  className="dark-tree-st24"
                  d="M124.5,132.42c.79.49,4.88,4.12,7.62,1.21,4.35,1.64,8.62,1.56,12.9,1.09l14.88,16.38c.87.96,1.9,2.26,1.78,3.45-.36,3.72-9.6,1.78-11.52.88-.23-.31-.51-.69-1.08-.71-.39-.02-.46,1.16-.78,1.27-6.66.37-12.78-2.61-17.69-7.13-.34,2.04,1.47,6.51-.17,7.67-.37.26-1.13.35-1.64.08-3.09-1.65-6.99-4.58-7.4-8.45-.68-6.38-.07-12.41-.1-18.92,1.27,1.52,1.93,2.39,3.19,3.17Z"
                />
                <path
                  className="dark-tree-st36"
                  d="M121.96,104.65c1.75,4.6,7.1,8.88,12.48,7.31.9-.26,2.05.32,2.62-.37,4.94,6.56,10.11,12.92,15.59,19.35.61.71.73,1.67.53,2.15-1.06,2.59-6.71.85-8.74.62-.39-.09-.92-.57-1.64-.65-4.58-.51-8.76-2.05-12.65-4.38-.35,1.6.57,3.6-.75,4.07-1.02.37-3.43-.63-4.15-1.45-1.25-1.4-3.74-3.94-3.88-5.97-.2-2.85-.32-21.09.1-21.38.09-.06.33.06.39.18.07.14.05.31.1.53Z"
                />
                <path
                  className="dark-tree-st16"
                  d="M124.13,67.77c-.33-.53,13.23,25.76,12.43,26.36-.47.36-.92.28-1.37.28,1.99-.14-5.67-1.51-4.95-1.41-3.04-.44-5.21-2-7.57-4.12.03,5.73,6.79,6.49,10.59,6.25l7.25,7.94c.05,1.41,4.82,5.18,3.97,7.01-.62,1.33-3.49,1.14-4.66,1.01.16-.2,0-.36-.07-.5-.14-.31-.43-.1-.76-.17-2.6-.53-4.63-1.95-6.71-3.41-.5.92.03,2.03-.49,2.78-1.22,1.77-6.94-2.67-8.78-5.09l-1.83-2.41.29-38.78,2.65,4.27Z"
                />
                <path
                  className="dark-tree-st49"
                  d="M150.17,155.43c.29.45.52,1.12.87,1.52-5.25,1.81-11.05,1.62-16.33-.67-3.11-1.35-2.41,2.63-6.04,1.37-.22-.36.18-.69.14-1.05.51.27,1.27.19,1.64-.08,1.64-1.16-.18-5.63.17-7.67,4.91,4.52,11.03,7.51,17.69,7.13.32-.11.39-1.29.78-1.27.57.02.85.4,1.08.71Z"
                />
                <path
                  className="dark-tree-st28"
                  d="M144.44,133.72c.22.3.35.74.59,1.01-4.29.47-8.55.55-12.9-1.09-2.74,2.91-6.83-.73-7.62-1.21.15-.4.37-.89.75-1.12.73.82,3.13,1.82,4.15,1.45,1.32-.47.4-2.47.75-4.07,3.89,2.34,8.07,3.87,12.65,4.38.71.08,1.24.56,1.64.65Z"
                />
                <path
                  className="dark-tree-st13"
                  d="M123.02,104.69c1.84,2.42,7.56,6.87,8.78,5.09.52-.75-.02-1.86.49-2.78,2.08,1.46,4.12,2.89,6.71,3.41.33.07.62-.14.76.17.07.15.23.3.07.5-1.08-.12-2.09-.77-3.3-.61.2.43.36.9.53,1.12-.57.69-1.72.11-2.62.37-5.38,1.57-10.73-2.71-12.48-7.31.38-.23.68.05,1.06.04Z"
                />
              </g>
            </g>

            <g id="dark-tree-shape-2">
              <g transform="scale(0.35) translate(-445, -221)">
                <g transform="translate(0,-3)" data-tree-trunk="2">
                  {/* Shortened Trunks */}
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 103)"
                    fill="#090603"
                    d="M426.41,206.33c1.32,0,2.64-.15,3.71.53-.09,1.36-.15,2.8-.05,4.17-1.08-.07-2.11-.28-3.41-.72l-.35,35.78c1.27.14,2.45-.38,3.14.32l-9.13.1c.22-.36-.44-.49-.42-.79l.76-5.4c1.59-11.2,1.77-22.58,2.28-33.86,1.15-.07,2.29-.14,3.48-.13Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 103)"
                    fill="#090603"
                    d="M430.07,211.03c.75,10.3.49,20.79,2.44,30.84.21,1.09-.46,2.66.64,4.19-1.65.55-2.53.33-3.69.34-.69-.69-1.87-.17-3.14-.32l.35-35.78c1.29.44,2.33.65,3.41.72Z"
                  />
                </g>
                <path
                  className="dark-tree-st31"
                  d="M426.74,144.4l.1,4.62c.13,5.81-.3,11.66-.02,17.46-.45-.11-.93.2-1.3.66-2.79,3.4-6.14,6.15-10.29,7.63-.49.18-1.38.43-1.89.22-1.52-.61-.67-3.71-1.49-4.54-3.23,2-6.4,3.73-10.21,4.27-.54.08-.74.28-.9.56l-6.35.38c-.88.05-1.52-.35-1.79-.76-.36-.54-.2-1.35.11-1.9l12.22-21.31c-1.27-.29-1.97.2-3.19-.6l3.4-5.52c2.53-4.11,5.6-7.99,8.19-12.44-.82-.23-1.51.14-2.47-.48l3.78-8.44c2.02-4.52,3.63-9.26,5.6-13.75l6.18-14.08.32,48.03Z"
                />
                <path
                  className="dark-tree-st15"
                  d="M447.79,151.58l.28,1.12c-2.06.37-4.15.22-6.49,0-4.79,4.6-11.31-.18-14.74-3.68l-.1-4.62c.39.18.35-.32.7-.7,3.3,3.21,6.8,6.7,11.88,7.66.76-1.24.46-2.13.34-3.51,2.35,2.11,5.39,2.48,8.13,3.73Z"
                />
                <path
                  className="dark-tree-st46"
                  d="M427.86,96.44c2.89,8.54,6.72,16.81,10.07,25.19l3.56,8.91c.16.4.2,1.02-.05,1.33-.22.26-.72.12-1.6.54,3.46,5.83,6.99,11.51,10.85,17.28.53.79-.31,1.76-1.02,1.8-.74.04-1.42.14-1.89.1-2.75-1.25-5.79-1.62-8.13-3.73.13,1.38.42,2.27-.34,3.51-5.08-.97-8.57-4.45-11.88-7.66-.34.38-.31.88-.7.7l-.32-48.03c0-.25-.12-.5-.04-.75.29.08.38-.23.69-.45.22.8.39,1.05.79,1.27Z"
                />
                <path
                  className="dark-tree-st9"
                  d="M433.25,132.2l.53-1.97c.49.67.43,1.66-.53,1.97Z"
                />
                <path
                  className="dark-tree-st2"
                  d="M426.82,166.48c3.17,3.45,6.75,6.6,11.34,8.34.58.22,1.11.23,1.42.1,1.48-.6.41-3.4,1.11-5.14,3.46,2.94,7.57,4.03,11.71,5.19-.1.42,0,.96.24,1.36-3.5,1.18-7.47.59-10.92-.9-.67.88-1.31,1.79-2.43,1.9-4.32.4-8.4-.31-12.57-2.14l-.12,25.16c-.01,2.13.06,4.07-.2,5.97-1.19,0-2.32.06-3.48.13-1.71.1-3.51.82-5.32.35s-2.52-2.5-3.01-4.32c-1.19,1.59-7.11,6.03-8.26,4.09-.3-.5,0-1.1-.21-1.87-1.22,2.13-16.02,1.5-18.95,1.32-.8-.05-1.68-.58-1.92-1.05-.21-.42-.09-1.38.24-2.01l6.21-11.8,9.02-15.9c.16-.28.35-.48.9-.56,3.81-.54,6.98-2.27,10.21-4.27.82.84-.02,3.93,1.49,4.54.51.21,1.4-.04,1.89-.22,4.15-1.48,7.51-4.23,10.29-7.63.37-.46.85-.76,1.3-.66Z"
                />
                <path
                  className="dark-tree-st6"
                  d="M452.64,176.34c2.75,4.44,12.37,22.14,14.89,27.46.28.59.09,1.45-.31,1.69-.27.16-.61.57-1.26.6-5.77.27-11.36.25-17.07,0-1.43-.06-2.62-.89-3.32-1.88.24.78.46,1.66-.08,2.38-1.56,2.09-7.98-2.61-9.05-4.7.26,1.94-.29,4.36-2.44,4.88-1.28.32-2.86-.26-3.88.08-1.07-.69-2.39-.53-3.71-.53.26-1.9.19-3.84.2-5.97l.12-25.16c4.17,1.82,8.25,2.54,12.57,2.14,1.11-.1,1.76-1.02,2.43-1.9,3.44,1.5,7.42,2.09,10.92.9Z"
                />
                <path
                  className="dark-tree-st56"
                  d="M448.07,152.7c-.13-.51,12.99,20.67,11.96,22.11s-6.1.6-7.63.17c-4.13-1.16-8.25-2.25-11.71-5.19-.7,1.74.36,4.53-1.11,5.14-.31.13-.84.12-1.42-.1-4.59-1.74-8.17-4.89-11.34-8.34-.28-5.8.15-11.65.02-17.46,3.42,3.5,9.95,8.28,14.74,3.68,2.34.21,4.44.36,6.49,0Z"
                />
              </g>
            </g>

            <g id="dark-tree-shape-3">
              <g transform="scale(0.35) translate(-140, -503)">
                <g transform="translate(0,-3)" data-tree-trunk="3">
                  {/* Shortened Trunks */}
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 238.5)"
                    className="dark-tree-st48"
                    d="M127.95,477.01c.38,2.51.02,5.12.24,7.63-3.73.75-2.24.13-6.35-.19l.02,43.3c-3.38.59-6.85.03-10.25.35.97-3.6,1.03-7.38,1.48-11.05,1.64-13.26,2.18-26.65,3-39.96.22-.4.73-.58,1.28-.64l4.82-.46c1.88-.18,4.24-.05,5.76,1.01Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 238.5)"
                    className="dark-tree-st38"
                    d="M128.19,484.64c.96,10.87,1.08,21.86,2.73,32.43.55,3.53.01,7.47.88,11.07-.57-.12-1.28.13-1.89-.04-1.76-3.59-2.53-7.59-2.92-11.64l-.27-2.82c-.12-1.31-.29-2.43-.45-3.86-.51,1.34-.21,2.74-.05,4.17.51,4.81,1.29,9.48,2.87,13.93-2.2.92-5.07-.5-7.23-.13l-.02-43.3c4.11.32,2.62.94,6.35.19Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 238.5)"
                    className="dark-tree-st12"
                    d="M129.91,528.1c-.27-.08-.65.07-.82-.22-1.58-4.45-2.36-9.13-2.87-13.93-.15-1.43-.46-2.83.05-4.17.16,1.43.32,2.55.45,3.86l.27,2.82c.39,4.05,1.16,8.05,2.92,11.64Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 238.5)"
                    className="dark-tree-st43"
                    d="M125.48,502.23c-.33-2.11-.32-4.22-.01-6.55.33,2.11.32,4.22.01,6.55Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 238.5)"
                    className="dark-tree-st11"
                    d="M125.87,508.71c-.34-1.35-.32-2.71-.02-4.27.34,1.35.32,2.71.02,4.27Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 238.5)"
                    className="dark-tree-st14"
                    d="M129.09,527.88c.17.29.55.15.82.22.6.17,1.32-.08,1.89.04,4.29.88,8.71.58,13.23,2.32-4.3.94-8.24.78-12.54.93l-37.27,1.23-10.26.4c-1.4.06-10.87,2.73-10.3.91,9.77-3.67,26.36-4.8,36.95-5.82,3.4-.33,6.87.23,10.25-.35,2.16-.38,5.03,1.05,7.23.13Z"
                  />
                </g>

                <path
                  className="dark-tree-st17"
                  d="M122.64,326.62c-.18.63-.44,1.37-.42,2.3.35,14.24-.55,28.37.44,42.24-.8,1.71-.29,4.16-.31,6.16l-.12,17.44c0,1.15-.09,2.16.28,3.09-.93,1.59-.21,3.58-.21,5.31l-.09,21.7.35,1.55c-1.02,1.6-.31,3.53-.31,5.29l-.05,44.32-4.82.46c-.55.05-1.05.23-1.28.64-3.48-1.01-5.74,1.71-8.78-3.97-1.68,1.34-8.37,6.54-9.92,5.28-1.4-1.15.99-5.87,1.27-7.87-8.28,5.68-17.4,8.56-27.07,4.96-1.94-.72-3.28-1.87-4.61-3.08-.29-1.66.27-3.22,1.34-4.6,1.88-2.42,3.22-5.07,4.74-7.55l12.6-20.58c1.55-2.53,3.63-4.88,4.8-7.73-2.36,1.35-16.34,5.76-14.65.2,2.72-2.29,4.71-5.57,7.25-8.04,2.85-2.78,5.01-6.29,7.47-9.36,1.82-2.27,4.04-4.63,5.31-7.3,2.82-2.22-7.57,1.73-7.89-1.69,5.22-8.46,11.56-16.22,16.26-25.62-1.28.25-8.48,1.84-6.78-1.44,8.05-15.49,15.19-31.14,22.17-47.12.91-2.08,1.61-3.76,2.77-5.72.23-.16.37.56.29.76Z"
                />
                <path
                  className="dark-tree-st25"
                  d="M145.09,373c.71,1.46,3.47,5.64,2.56,6.53-1.39,1.37-5.94.33-6.63-.3-.98-.9-2.17-1.93-3.93-2.3-.12,1.1-.56,2.78-1.89,2.72-3.58-.14-6.3-2.42-8.74-4.61.51.46-4.17-5.01-3.79-3.9-.99-13.87-.09-28-.44-42.24-.02-.93.24-1.67.42-2.3l22.45,46.38Z"
                />
                <path
                  className="dark-tree-st26"
                  d="M155.42,433.98c2.44,3.16,4.4,6.64,6.74,10.34l15.59,24.68c.49.78.91,2.17.58,2.75-1.37,2.41-4.05,3.71-6.91,4.33-8.94,1.94-18.1-.58-25.56-5.83.68,1.99,3.52,6.92,1.69,8.38-1.92,1.54-9.18-3.72-10.78-4.65-1.58-2.67-.65,3.24-6.53,3.38-.58-.44-1.67-.27-2.28-.35-1.52-1.06-3.87-1.19-5.76-1.01l.05-44.32c4.47,4.63,12.62,6.39,19.43,5.22,4.75-.82,9.26-1.89,13.74-2.92Z"
                />
                <path
                  className="dark-tree-st4"
                  d="M134.05,407.78c.39-.05.78-.03,1.16-.13,1.11,1.27,3.18,1.02,4.92.87l8.39-.71c5.81,8.28,12.36,16.06,19.04,23.84.64.74.98,1.64.56,2.27-1.83,2.73-10.89-.17-13.39-1.43-3.19,2.21-7.59-1.4-10-3.42-.45,1.57.21,2.91-.89,3.7-1.97,1.4-9.58-3.44-11.63-4.44-1.18,1.55.66,4.66-1.01,5.14-1.95.56-7.49-5.62-8.64-7.07l-.35-1.55.09-21.7c.14.11.46-.27.7-.05,2.87,2.63,8.05,7.1,11.05,4.68Z"
                />
                <path
                  className="dark-tree-st0"
                  d="M127.54,381.04c4.08,2.4,9.52,2.39,13.84.43l7.14,10c3.04,4.25,5.83,8.74,9.17,13.14,2.92,3.84-7.41,2.78-9.59,1.64-3.43-1.8-7.31-2.61-11.05-4.91-.72,2,.35,5.14-1.83,6.32-.38.1-.78.09-1.16.13-6.5-2.92-7.34-4.69-11.54-9.93-.37-.92-.29-1.93-.28-3.09l.12-17.44c1.61,1.42,3,3.43,5.19,3.72Z"
                />
                <path
                  className="dark-tree-st30"
                  d="M154.73,432.48c.38.38.4,1.12.69,1.5-4.48,1.03-9,2.1-13.74,2.92-6.81,1.17-14.96-.59-19.43-5.22,0-1.76-.71-3.69.31-5.29,1.15,1.45,6.69,7.64,8.64,7.07,1.66-.48-.17-3.59,1.01-5.14,2.06.99,9.67,5.84,11.63,4.44,1.11-.79.44-2.13.89-3.7,2.41,2.02,6.81,5.63,10,3.42Z"
                />
                <path
                  className="dark-tree-st53"
                  d="M134.05,407.78c-3,2.43-8.19-2.05-11.05-4.68-.24-.22-.56.16-.7.05,0-1.73-.71-3.71.21-5.31,4.2,5.24,5.05,7.02,11.54,9.93Z"
                />
                <path
                  className="dark-tree-st20"
                  d="M126.45,375.06c-.97-.37,1.79,4.38,1.09,5.98-2.18-.29-3.58-2.3-5.19-3.72.01-1.99-.5-4.45.31-6.16-.38-1.11,4.31,4.36,3.79,3.9Z"
                />
                <path
                  className="dark-tree-st29"
                  d="M141.02,379.23c-1.14.28.86,1.78.36,2.23-4.32,1.96-9.76,1.98-13.84-.43.71-1.6-2.06-6.36-1.09-5.98,2.44,2.19,5.17,4.47,8.74,4.61,1.33.05,1.77-1.63,1.89-2.72,1.76.37,2.95,1.4,3.93,2.3Z"
                />
                <path
                  className="dark-tree-st32"
                  d="M148.1,406.24c-.23.07-.38.25-.34.42.11.53,1.01.75.77,1.13l-8.39.71c-1.75.15-3.81.4-4.92-.87,2.18-1.18,1.11-4.32,1.83-6.32,3.74,2.3,7.61,3.12,11.05,4.91Z"
                />
              </g>
            </g>

            <g id="dark-tree-shape-4">
              <g transform="scale(0.35) translate(-450, -448)">
                <g transform="translate(0,-3)" data-tree-trunk="4">
                  {/* Shortened Trunks */}
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 212)"
                    className="dark-tree-st44"
                    d="M433.59,424.63l-.36,47.59,6.22.03c-1.29,1.45-3.57.72-5.41,1.06-.56-1.49-7.48.24-7.22-1.02.59-2.35.18-4.93.46-7.22,1.81-14.49,1.86-29.42,2.53-44.17,1.12-.92,2.15-2.04,3.43-2.77l.35,6.49Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 212)"
                    className="dark-tree-st33"
                    d="M437.09,425.05l1.84,39.68c.11,2.44-.11,5.06.51,7.52l-6.22-.03.36-47.59,3.5.42Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 212)"
                    className="dark-tree-st45"
                    d="M437.15,420.76c.2,1.42-.13,2.87-.06,4.29l-3.5-.42-.35-6.49c0-.13.04-.23.14-.32,1.62.31,2.73,2.13,3.78,2.95Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 212)"
                    className="dark-tree-st41"
                    d="M434.03,473.31c-6.45,1.18-13.01,1.77-19.8,1.89-4.68.09-8.98,1.07-13.97.6,7.87-2.39,18.6-2.08,26.55-3.52-.26,1.26,6.66-.47,7.22,1.02Z"
                  />
                </g>
                <path
                  className="dark-tree-st7"
                  d="M433.99,297.84c-.26.79-.45,1.56-.45,2.65l-.1,42.59c0,1.61.35,3.13,1.31,4.25-.16.26-.38.52-.61.71-.2-.69-.49-.12-.63.38l-.04,23.24c0,.76.62,1.31.57,1.89-.24,0-.29.34-.46.42-.28.15-.61-.34-.88-.12.06-.05-4.09,6.24-7.08,6.49-1.05,0-1.21-2.13-1.41-3.1-1.62.61-4.42,3.8-5.99,2.43-1.08-.94-.42-3.2-1-4.24-2.84,2.12-5.86,3.97-9.48,4.29-.76.07-1.52-.14-1.87.32-.39-.16-7.94,1.44-6.26-1.21,3.57-5.63,6.43-11.36,9.23-17.11,1.95-4.01,4.28-7.85,6.15-12.27-1.81.27-3.5,1.01-5.03-.28l6.79-14.33,2.81-6.6c3.41-8.03,7.18-16,10.74-24.33l2.96-6.92c.43-.16.48-.05.56.09.12.22.32.6.17.75Z"
                />
                <path
                  className="dark-tree-st52"
                  d="M434.13,348.05c1.78,4.1,7.69,5.35,11.62,4.36,3.29-.83,3.17.08,6.97-.57l9.45,17.52,5.01,9.23c-.42-.14-.37.23-.45.74-5.77.53-11.51-2.05-15.91-6.01-.14,1.87.86,3.41.28,5.2-.18.56-1.26.73-1.86.64-4.45-.61-8.34-2.73-11.65-5.91-.71.99-.09,2.28-.65,3.45l-2.9-3.14c.04-.58-.57-1.13-.57-1.89l.04-23.24c.13-.5.43-1.07.63-.38Z"
                />
                <path
                  className="dark-tree-st39"
                  d="M451.57,337.03c1.09,2.43,1.81,5.03,3.45,7.2.93,1.23,1.1,3.4,1.95,4.86-1.52.74-3.29,1.02-4.58.4-1.9-.93-3.9-1.63-5.97-2.79.11,3.72-5.58-.9-6.59-1.99-.62.59.07,5.3-1.34,4.99s-2.85-1.31-3.74-2.36c-.95-1.12-1.31-2.64-1.31-4.25l.1-42.59c0-1.09.19-1.86.45-2.65l17.58,39.19Z"
                />
                <path
                  className="dark-tree-st42"
                  d="M452.38,349.49c-1.82-2.26,1.26,4.07.33,2.35-3.8.65-3.68-.26-6.97.57-3.93.99-9.84-.26-11.62-4.36.24-.19.46-.45.61-.71.89,1.05,2.4,2.06,3.74,2.36s.72-4.4,1.34-4.99c1.01,1.09,6.7,5.72,6.59,1.99,2.07,1.16,4.07,1.87,5.97,2.79Z"
                />
                <path
                  className="dark-tree-st40"
                  d="M433.58,373.99l-.2,43.83c-.1.09-.15.19-.14.32-1.28.74-2.31,1.85-3.43,2.77-1.41,1.16-7.11,5.89-8.93,4.98s-1.82-4.45-2.06-6.67c-3.66,1.77-7.24,3.33-11.33,3.55-.28-1.43.43-2.28.7-3.71-5.63,2.13-17.97,1.83-24.32,1.62-.47-.02-1.1-.38-1.04-.77.05-.31.04-1.02.26-1.35,8.21-12.29,16.03-25.26,22.79-38.5.35-.46,1.11-.25,1.87-.32,3.62-.32,6.64-2.17,9.48-4.29.58,1.04-.09,3.3,1,4.24,1.58,1.37,4.37-1.81,5.99-2.43.2.97.36,3.11,1.41,3.1,2.99-.26,7.15-6.55,7.08-6.49.26-.22.6.27.88.12Z"
                />
                <path
                  className="dark-tree-st8"
                  d="M467.18,378.59c.1.19,0,.66-.02.91,0,.03-1.95.66-1.69.63,1.9-.25-4.33-.54-4.77-.48l7.18,12.57c-.15.44.18.84.38,1.18,2.98,5.12,5.82,10.32,9.16,15.2-1.52,2.48-2.86,5.13-4.74,7.55-1.07,1.38-1.64,2.95-1.34,4.6-5.06.03-10.17-.19-15.02-2.13.12,1.03,3.23,6.88.56,6.54-3.23-.41-5.96-1.93-8.53-3.72-.22,1.22-.14,3.31-1.41,3.52-3.25.53-8.11-4.12-9.79-4.21-1.05-.82-2.16-2.64-3.78-2.95l.2-43.83c.16-.09.22-.43.46-.42l2.9,3.14c.56-1.17-.06-2.46.65-3.45,3.31,3.18,7.2,5.3,11.65,5.91.6.08,1.67-.08,1.86-.64.59-1.79-.42-3.33-.28-5.2,4.4,3.96,10.14,6.55,15.91,6.01.07-.51.02-.88.45-.74Z"
                />
                <path
                  className="dark-tree-st22"
                  d="M458.19,401.56c.85,1.98-.64,3.94-2.89,4.54-8.64,2.28-17.49-3.06-20.39-11.13,4.04,3.24,7.36,5.89,11.89,7.3,2.63.82,8.5,2.28,11.39-.7Z"
                />
              </g>
            </g>

            <g id="dark-tree-shape-5">
              <g transform="scale(0.35) translate(-295, -666)">
                <g transform="translate(0,-3)" data-tree-trunk="5">
                  {/* Shortened Trunks */}
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 342)"
                    className="dark-tree-st23"
                    d="M286.51,683.95c.21,1.05,4.71-1.05,5.31-.8l.31,8.71-5.82.65-.12,42.49-8.94-.24.5-5.51c1.39-15.45,2.59-30.94,3.41-46.44,1.48.47,2.95,1.02,4.63,1.41l.71-.27Z"
                  />
                  <path
                    transform="matrix(1, 0, 0, 0.5, 0, 342)"
                    className="dark-tree-st27"
                    d="M292.14,691.86l3.33,40.51c.07.89.11,1.78.29,2.83-.3.19-.53.27-.44.45l-9.13-.64.12-42.49,5.82-.65Z"
                  />
                </g>

                <path
                  className="dark-tree-st34"
                  d="M311.66,609.22c-.37-.02-.91.59-.64,1.16,7.83-1.22,15.18,3.16,18.4,10.37,2.34,5.24,2.48,11.23-.17,16.18-1.31-1.29-3.36-2.23-5.34-3.24-5.18-2.64-13.69-2.45-17.48,3.1-.42.62-3.57,3.5-3.47,2.72-.02.15-.08.34-.06.55-1.23.29-2.45.78-3.82.95-.52-1.46,2.28-7.2,1.17-9.1-2.06,4.79-4.41,8.85-7.16,12.83-.99.36-1.34,1.58-2.23,2.27l-3.87,2.97c1,4.38-.29,6.11-.02,10.33-.04.02-.34,0-.34-.12l-.09-58.56.14-41.14c10.02.1,17.79,8.19,19.58,17.5,4.62,2.3,8.64,6.24,9.78,11.87,1.29,6.36-.18,12.95-3.9,18.24-.27.38-.66.77-.46,1.1Z"
                />
                <path
                  className="dark-tree-st50"
                  d="M329.25,636.92c6.07,5.97,8.1,14.86,4.21,22.66-2.35,4.7-5.97,8.86-11.12,10.88-.69,1.13-.54,2.62-1.03,3.86-2.17,5.51-6.65,9.99-11.67,11.7-6.46,2.2-13.26,1.04-17.82-2.86-.6-.24-5.1,1.86-5.31.8-.15-2.86.02-5.75.1-8.81.11-3.97-.49-7.87.23-11.69.17-.91,1.19-1.85.91-2.79,2.03-2.4,2.14-6.12,3.74-8.84,1.07-1.83,2.96-3.45,3.88-5.64,1.86-4.43,6.33-2.47,11.06-6.02.81-.61,1.04-1.81,1.36-2.73-1.09,1.81-3.02,2.2-4.9,2.65-.02-.21.05-.4.06-.55-.1.78,3.05-2.11,3.47-2.72,3.8-5.55,12.3-5.74,17.48-3.1,1.98,1.01,4.03,1.95,5.34,3.24Z"
                />
                <path
                  className="dark-tree-st55"
                  d="M291.49,651.82c-1.6,2.73-1.7,6.45-3.74,8.84l-.79-.34c-.27-4.22,1.02-5.95.02-10.33l3.87-2.97c.9-.69,1.25-1.91,2.23-2.27,1.05.53-4.78,5.57-2.53,6.63l.94.44Z"
                />
                <path
                  className="dark-tree-st1"
                  d="M286.66,560.51l-.14,41.14.09,58.56c0,.11.3.13.34.12l.79.34c.28.94-.74,1.88-.91,2.79-.72,3.82-.12,7.72-.23,11.69-.08,3.06-.25,5.95-.1,8.81l-.71.27c-1.68-.39-3.16-.95-4.63-1.41-1.27-.4-5.48,4.68-15.58,4.88-11.84.22-16.7-8.27-20.79-16.84-2.46-5.15-9.06-8.62-7.28-16.43,1.23-5.36,4.34-11.45,10.82-13.45-7.84-9.02-10.33-23.56-2.6-32.86,3.91-4.7,8.92-6.96,15.32-6.23-3.82-6.51.05-11.99,1.5-17.41,2.07-7.74,4.03-15.01,11.15-19.77,3.93-2.63,8.31-4.25,12.95-4.2Z"
                />
                <path
                  className="dark-tree-st57"
                  d="M263.75,660.31l3.76,1.13c1.75.53,2.83,1.68,4.18,2.67,5.63,4.1,2.87,5.2,2.76,5.13-2.08-1.23-3.79-2.75-5.57-4.24-2.97-2.48-6.47-3.54-9.87-5.31,1.85-.52,3.18.78,4.74.62Z"
                />
                <path
                  className="dark-tree-st19"
                  d="M267.51,661.44l-3.76-1.13c1.59-1.82-1.11-5.88.23-8.2.92,1.8,1.51,3.37,2.25,5.17.58,1.4,2.55,3.09,1.28,4.16Z"
                />
                <path
                  className="dark-tree-st37"
                  d="M302.89,640.07c1.88-.45,3.82-.83,4.9-2.65-.33.93-.55,2.13-1.36,2.73-4.73,3.55-9.2,1.6-11.06,6.02-.92,2.19-2.81,3.82-3.88,5.64l-.94-.44c-2.25-1.06,3.58-6.09,2.53-6.63,2.75-3.98,5.1-8.04,7.16-12.83,1.1,1.9-1.69,7.64-1.17,9.1,1.37-.17,2.59-.66,3.82-.95Z"
                />
              </g>
            </g>
          </defs>

          {/* Deep Night Sky */}
          <rect width="2400" height="400" fill="url(#sky-grad-dark)" />

          {/* Moon */}
          <g transform="translate(10,-20)">
            <path
              d="M 1370,45 A 16,16 0 1,0 1395,70 A 20,20 0 0,1 1370,45 Z"
              fill="#FEF08A"
              opacity="0.9"
            />
          </g>

          {/* Meteors */}
          <g fill="#FFF">
            {STATIC.meteors.map((m, i) => (
              <circle
                key={`meteor-${i}`}
                cx={m.x}
                cy={m.y}
                r={m.size}
                className="jp-meteor-anim"
                style={
                  {
                    animationDuration: `${m.duration}s`,
                    animationDelay: `${m.delay}s`,
                    "--end-x": `${m.endX}px`
                  } as CSSProperties
                }
              />
            ))}
          </g>

          {/* Static Stars */}
          <g fill="#FFF">
            {STATIC.stars.map((s, i) => (
              <circle
                key={`star-${i}`}
                cx={s.x}
                cy={s.y}
                r={s.r}
                style={{
                  animation: `jp-fade-pulse ${s.duration}s infinite ease-in-out ${s.delay}s`
                }}
              />
            ))}
          </g>
          <g fill="#FEF08A">
            {STATIC.star4s.map((s, i) => (
              <path
                key={`star4-${i}`}
                d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z"
                transform={`translate(${s.x}, ${s.y}) scale(${s.scale})`}
                style={{
                  animation: `jp-fade-pulse ${s.duration}s infinite ease-in-out ${s.delay}s`
                }}
              />
            ))}
          </g>

          {/* Procedural Mountain Layers with Night Palette */}
          {STATIC.mountainLayers.map((layer, idx) => {
            const darkMountainColors = [
              "#1d4ed8",
              "#1e40af",
              "#1e3a8a",
              "#172554",
              "#0f172a"
            ]
            return (
              <path
                key={`mtn-layer-${idx}`}
                d={layer.path}
                fill={darkMountainColors[idx]}
              />
            )
          })}

          {/* Middle Mountain */}
          <path
            d="M -100,400 L -100,120 Q 200,40 500,110 Q 800,60 1100,120 Q 1400,50 1700,110 Q 2100,50 2500,120 L 2500,400 Z"
            fill="#0D1B3C"
          />

          {/* Midground Hills */}
          <path
            d="M -100,400 L -100,130 Q 150,90 400,130 T 900,125 T 1500,120 T 2100,130 L 2500,130 L 2500,400 Z"
            fill="#040914"
          />
          <path
            d="M -100,400 L -100,140 Q 200,110 500,135 T 1100,130 T 1700,135 T 2300,140 L 2500,140 L 2500,400 Z"
            fill="#020617"
          />

          {/* Midground Trees & Birds */}
          <g>
            {[...STATIC.midgroundTrees]
              .sort((a, b) => a.y - b.y)
              .map((t) => {
                const baseY = baseOffsets?.[t.type] ?? 0

                return (
                  <g key={t.id} transform={`translate(${t.x}, ${t.y})`}>
                    <use
                      href={`#dark-tree-shape-${t.type}`}
                      transform={`scale(${t.scale}) translate(0, ${-baseY})`}
                    />
                  </g>
                )
              })}
          </g>

          {/* Lodge (Now styled securely via CSS scoped to .dark-scene) */}
          <g transform="translate(1455, 124) scale(0.5) translate(-300, -435)">
            <path
              className="lodge-st15"
              d="M313.97,399.73c-3.44,5.65-11.16,14.68-14.79,19.63-.4.54-1.03,1.96-1.91,2.08-8.38,1.13-17.02.01-25.7.74-1.1.09-1.48.36-2.36.19-4.49-.89-9.39-.24-14.21-.22-.62,0-1.52.79-1.52-.15,3.36-4.09,10.19-11.88,13.96-15.76,5.62-1.12,9.87-.86,15.11-1.29l6.38-.53.53,5.19,1.84-.27c1.56-1.28,4.97-6.48,6.09-8.2l16.58-1.4Z"
            />
            <path
              className="lodge-st31"
              d="M300.21,420.4c-.92,1.06-.98,2.83-2.95,2.71-.62-.04-1.73.87-4.35.43-.22-.04-.48.41-.3.65-.01,0-3.68.75-2.76-.17-.33.32-.99.1-.96.58-.37,0-.76-.05-1.13.04-.94-1.22-2.38.26-3.5.08s-2.11.29-2.98.35c-1.98.07-4.15-.87-6.22-.09-.61.23-.3,1.25-.09,1.61.75,1.3,4.2-.45,6.34.77.21.13-.03.31,0,.42-1.95.05-4.01-.38-6.19-.11-.59.07-.59,2.38-.06,2.45l1.85.22c.68.23.45.34-.33.25l-1.53.18c-.46.05-.46.81-.35,1.32.29,1.29,5.32.36,6.54.23.02.5.07,1,.06,1.51-1.34.8-3,.03-4.61.17-2.36.2-4.38.16-6.49-.19l.02-2.63v-4.65c0-.41.02-.81-.06-1.44-1.34-.33-2.61-.07-3.78.33-.33-.6-1.16-.72-1.76-.65l-2.36.29c-1.81.22-3.92.07-5.75-.36.06-1.48-3.71-.35-3.83-1.65-.05-.54.56-.78.78-1.05,0,.94.9.15,1.52.15,4.82-.02,9.71-.67,14.21.22.88.17,1.26-.1,2.36-.19,8.68-.73,17.32.39,25.7-.74.88-.12,1.51-1.53,1.91-2.08.25.09.5-.03.71.2s.42.49.33.84Z"
            />
            <path
              className="lodge-st26"
              d="M321.19,406.79l12.64,15.24c.37.45.52.79.18,1.16-.18.2-.54.46-.88.37-1.1-.99-2.26-1.95-3.35-3.23l-15.05-17.76c-.87.64-1.15,1.74-1.81,2.32-2.56,2.22-4,5.49-6.18,7.99l-6.53,7.52c.1-.35-.12-.62-.33-.84s-.46-.11-.71-.2c3.64-4.95,11.35-13.98,14.79-19.63.09-.15.11-.45.48-.27.38.11,1.17.55,1.49,1.14,1.4,2.59,3.62,4.21,5.25,6.18Z"
            />
            <path
              className="lodge-st21"
              d="M295.44,439.92c.39.58.44,2.26.26,2.92-1.43.58-3.31.23-4.87.34-3.33.24-6.73.22-9.95.34-.57.02-1.32.03-1.9.04l-11.81.11c-3.55.03-9.92.09-10.72-.81-.15-.71-.31-1.52,0-2.2,2.56-.21,5.16.42,7.84-.31l30.16-.1c.29-.37.67-.34.98-.34Z"
            />
            <path
              className="lodge-st11"
              d="M295.4,439.52c-3.75.09-7.53-.17-11.33.12-.43.03-.98.2-1.42.2l-26.18.06c-.23-.74-.11-1.5.03-2.24l38.45-.05c.37,0,.57-.12.51-.36.89.44.42,1.65-.07,2.27Z"
            />
            <path
              className="lodge-st7"
              d="M297.4,401.13c-1.12,1.72-4.53,6.92-6.09,8.2l.23-9.62c1.7-.07,3.45-.24,5.44-.06.55.05.34,1.21.43,1.48Z"
            />
            <path
              className="lodge-st13"
              d="M295.4,439.52c.13.12.15.25.04.39-.3,0-.69-.02-.98.34l-30.16.1c-2.69.73-5.28.1-7.84.31.11-.23.08-.53.01-.76l26.18-.06c.44,0,.98-.17,1.42-.2,3.8-.29,7.58-.03,11.33-.12Z"
            />
            <path
              className="lodge-st27"
              d="M291.53,399.71l-.23,9.62-1.84.27-.53-5.19c.58-1.23.37-2.64.55-4.2.1-.86,1.5-.48,2.05-.5Z"
            />
            <path
              className="lodge-st38"
              d="M262.27,425.06l.07,1.96c0,.17.19.24-.04.35l-4.66-.06c-.32,0-.42.24-.36.39-1.2.1-.57-1.92-.75-2.69-.03-.1,0-.22,0-.33,1.83.43,3.94.58,5.75.36Z"
            />
            <path
              className="lodge-st6"
              d="M333.13,423.56c-.73-.19-1.22.31-1.54.77-3.02-.12-2.75-3.33-5.23-3.35.25-2.04-1.64-2.81-3.53-2.77-.08-.58.51-.33,1.07-.65.49.01-4.24-5.59-4.2-4.71-.45-1.2-1.41-2.94-2.67-3.17l-1.14-.21c-.41-.07.32-.64.29-.9-.58-1.59-2.08-2.62-3.26-3.68.66-.57.94-1.67,1.81-2.32l15.05,17.76c1.08,1.28,2.25,2.23,3.35,3.23Z"
            />
            <path
              className="lodge-st28"
              d="M331.23,426.5c.05.24.03.49-.03.73-.55-.23-1.25.16-1.76.32-.76.24-.77,1.22-.74,2.32-1.1.36-2.15.23-3.12.41.49-1.96-.15-3.99.16-5.99-.08-.99,2.93-.69,3.11-.55.62.46,0,2.05.96,2.54.36.19.94.07,1.43.22Z"
            />
            <path
              className="lodge-st5"
              d="M292.62,424.2c.67.3,2.08-.39,2.65-.05.99.59.03,2.28.03,2.88-1.7-.18-3.44-.23-5.15-.13l-.44-1.09c-.12-.3.02-.61-.06-.92-.07-.27-.39-.19-.74-.27-.03-.48.63-.26.96-.58-.93.91,2.74.16,2.76.17Z"
            />
            <path
              className="lodge-st8"
              d="M270.24,431.19l-.02,2.63c-1.06-.17-2.74,1.17-4.13.21-.15-.86-.09-1.77-.06-3.02,1.51-.09,3.07-.64,4.22.18Z"
            />
            <path
              className="lodge-st19"
              d="M270.24,426.53c-.59.34-4.14,1.32-4.31-.09-.04-.33.29-.59.47-1.02,1.17-.4,2.44-.66,3.78-.33.08.63.06,1.03.06,1.44Z"
            />
            <path
              className="lodge-st23"
              d="M287.78,424.65c-.66.15-1.49-.2-2.33.19-.49.23-.64,1.6-.26,1.9.57.46,1.45-.12,2.21.34-.35.74-1.33.04-1.86.38-.65.41-.74,2.12-.19,2.65.74.72,2.05-.39,4.25.25-.06-1.4.98-2.37.54-3.47,1.71-.09,3.45-.04,5.15.13.6.87.18,2.14.36,3.37l-5.68.09c1.93,1.62,7.13-.71,5.77,1.9.16,1.48-.12,3.2-.31,4.45l-38.02.05c-.26.41-.61.26-.9.32-.31-1.85-.19-3.8-.04-5.67.14-.73,7.62-.02,6.18-1.1.56-.01,1.51.08,2.33-.25.61-.25.72-2.21-.06-2.61-.68-.35-1.98.08-2.36.44-.19.88-.07,1.81.08,2.41-2.04.04-4.18-.35-6.12.23-.65-.68.2-1.62-.04-2.5-.25-.94-.86-2.4.03-3.13.19.77-.44,2.79.75,2.69,1.67-.14,3.48.39,5.03-.34.23-.11.05-.18.04-.35.83.3,1.94.39,3-.07.17-1.11-.71-1.43-.7-2.19.6-.07,1.43.05,1.76.65-.18.44-.51.69-.47,1.02.18,1.4,3.72.42,4.31.09v4.65c-1.14-.82-2.71-.27-4.22-.18-.02,1.25-.09,2.16.06,3.02,1.39.96,3.07-.38,4.13-.21,2.12.34,4.14.38,6.49.19,1.61-.13,3.27.63,4.61-.17.51.66,1.96.48,2.69.33.84-.71.51-2.31.33-3.23-.85-.13-1.47-.1-2.38-.06-.67.03-.71.97-.69,1.44-1.22.14-6.25,1.06-6.54-.23-.11-.51-.12-1.26.35-1.32l1.53-.18c.77.09,1.01-.02.33-.25l-1.85-.22c-.54-.06-.54-2.38.06-2.45,2.18-.27,4.24.17,6.19.11.12.56-.31,1.79.27,2.29.49.42,2.21.42,2.6-.09s.3-2.01-.14-2.33c-.79-.58-2.04.1-2.73-.29-2.14-1.22-5.59.54-6.34-.77-.21-.36-.53-1.38.09-1.61,2.07-.79,4.24.16,6.22.09l.19,1.77c.8,0,2.18.39,2.72-.35.4-.56-.15-1.38.07-1.77,1.12.18,2.56-1.3,3.5-.08Z"
            />
            <path
              className="lodge-st30"
              d="M295.43,436.83c0,.12.21.29.04.43.06.24-.14.36-.51.36l-38.45.05c.03-.14.02-.33,0-.47.29-.06.64.1.9-.32l38.02-.05Z"
            />
            <path
              className="lodge-st0"
              d="M262.65,430.43c1.44,1.08-6.04.37-6.18,1.1.02-.29-.07-.58.06-.87,1.94-.59,4.09-.19,6.12-.23Z"
            />
            <path
              className="lodge-st25"
              d="M287.78,424.65c.36-.08.76-.04,1.13-.04.35.08.67,0,.74.27.08.31-.07.62.06.92l.44,1.09c.44,1.09-.61,2.07-.54,3.47-2.2-.63-3.51.48-4.25-.25-.55-.53-.46-2.24.19-2.65.53-.34,1.51.36,1.86-.38-.75-.46-1.63.12-2.21-.34-.37-.3-.23-1.67.26-1.9.84-.39,1.67-.04,2.33-.19Z"
            />
            <path
              className="lodge-st35"
              d="M289.74,434.29c-1.49.31-2.91.3-4.52.04-.26-1.1-.06-1.99-.17-3.36,1.66-.36,3.19-.49,4.7-.02-.11,1.3-.1,2.08,0,3.34Z"
            />
            <path
              className="lodge-st36"
              d="M281.32,433.84c.01-.51-.04-1-.06-1.51-.02-.48.02-1.42.69-1.44.91-.04,1.53-.08,2.38.06.18.93.51,2.52-.33,3.23-.73.15-2.18.32-2.69-.33Z"
            />
            <path
              className="lodge-st29"
              d="M265.21,433.87c-.27.65-2.2.71-2.66.18s-.58-2.51.04-2.89c.8-.48,1.89-.03,2.75,0,.27.77.21,1.91-.13,2.71Z"
            />
            <path
              className="lodge-st16"
              d="M269.5,430.37c-1.14.11-1.89-.25-3.26.1-.41-.92-.64-2,.06-3.22,1.42.55,2.31.49,3.64.48-.43.96-.64,1.63-.45,2.64Z"
            />
            <path
              className="lodge-st20"
              d="M281.33,427.8c-.02-.12.22-.3,0-.42.69.39,1.94-.28,2.73.29.44.32.51,1.83.14,2.33s-2.11.51-2.6.09c-.58-.5-.16-1.73-.27-2.29Z"
            />
            <path
              className="lodge-st14"
              d="M262.65,430.43c-.15-.61-.27-1.54-.08-2.41.37-.37,1.67-.79,2.36-.44.78.39.66,2.36.06,2.61-.82.34-1.77.24-2.33.25Z"
            />
            <path
              className="lodge-st1"
              d="M284.28,424.73c-.22.4.33,1.22-.07,1.77-.54.75-1.92.34-2.72.35l-.19-1.77c.88-.07,1.89-.53,2.98-.35Z"
            />
            <path
              className="lodge-st18"
              d="M262.34,427.03l-.07-1.96,2.36-.29c0,.76.88,1.08.7,2.19-1.06.46-2.17.37-3,.07Z"
            />
            <path
              className="lodge-st37"
              d="M262.3,427.38c-1.54.73-3.35.2-5.03.34-.06-.16.04-.4.36-.39l4.66.06Z"
            />
            <path
              className="lodge-st22"
              d="M319.71,412.84l-12.96.04c2.17-2.5,3.62-5.77,6.18-7.99,1.19,1.06,2.68,2.08,3.26,3.68.04.26-.69.82-.29.9l1.14.21c1.26.23,2.22,1.97,2.67,3.17Z"
            />
            <path
              className="lodge-st4"
              d="M325.73,424.29c-.31,1.99.33,4.02-.16,5.99-.06.26-.08.42.26,1.11-1.49.45-3.05.31-4.72.27-.28-.65-.22-1.16-.21-1.69l.04-2.25c0-.36.06-.73,0-1.09,1.26-.21,2.53.21,3.8-.25-1.31-.41-2.46-.11-3.56-.15-.05-.15-.16-.27-.28-.37.27-.32.07-.84.05-1.18,0-.14-.03-.67.11-.69,1.59-.2,3.41-.54,4.67.31Z"
            />
            <path
              className="lodge-st10"
              d="M319.71,412.84c-.04-.88,4.69,4.72,4.2,4.71-.56.33-1.16.08-1.07.65,1.88-.05,3.78.72,3.53,2.77,2.48.03,2.21,3.23,5.23,3.35.25.78.53,1.8-.35,2.18-.49-.15-1.06-.04-1.43-.22-.96-.49-.35-2.07-.96-2.54-.18-.14-3.19-.44-3.11.55-1.26-.86-3.08-.51-4.67-.31-.14.02-.11.56-.11.69-.57.09-.34-.26-.37-1.06-1.52.64-2.96-.08-4.83.27-.38.93-.06,1.95-.06,3.21,1.33.26,3.16.43,4.53-.07.32-.12-.03-1.49.67-1.17.12.11.22.23.28.37-.37-.04-.28.13-.24.4.06.36,0,.72,0,1.09-.89.55-3.64.23-5.34.41-.04.63-.26,1.87.21,2.12,2.68-.04,3.44.44,5.09-.27,0,.53-.07,1.04.21,1.69,1.67.04,3.23.17,4.72-.27-.34-.69-.32-.85-.26-1.11.97-.18,2.02-.05,3.12-.41-.03-1.1-.02-2.07.74-2.32.51-.16,1.22-.55,1.76-.32,1.98,1.18-.73,5.35,1,5.64,2.6.45,5.03.05,7.31.05.09.01.21.52.42.46.64-.2.53-.93.97-1.15.62.28,1.58,1.48,1.39,2.14-.38,1.33-.14,2.61-.13,4.02v3.22c-.45-.01-.95-.05-1.4,0,.15-.57.53-2.3-.03-2.89-.73.3-.45.69-.85,1.39.48-.52-4.86-.41-4.86-.24.36-2.01.59-3.7.71-5.83-1.33-.13-2.45-.09-3.75.11,1.28.71-.5,5.79-.12,7.57l-19.68.55c-2.83.08-5.5.3-8.14.43l-5.65.28c-1.02.05-2.02.3-2.71-.15.17-.67.12-2.35-.26-2.92.12-.14.1-.27-.04-.39.49-.63.95-1.83.07-2.27.17-.14-.03-.31-.04-.43.18-1.24.46-2.96.31-4.45,1.36-2.6-3.84-.28-5.77-1.9l5.68-.09c-.18-1.23.24-2.5-.36-3.37,0-.6.96-2.29-.03-2.88-.57-.34-1.98.35-2.65.05-.18-.24.08-.69.3-.65,2.62.44,3.73-.47,4.35-.43,1.97.11,2.02-1.65,2.95-2.71l6.53-7.52,12.96-.04Z"
            />
            <path
              className="lodge-st17"
              d="M340.91,432.23c-.43.22-.32.96-.97,1.15-.21.06-.34-.44-.42-.46-.26-.35.3-.69.57-.63.18.04.64-.15.82-.07Z"
            />
            <path
              className="lodge-st3"
              d="M306.87,436.54c.16.13.34.04.69-.16v-6.29c-.34-.19-.53-.26-.7-.15l.26-5.61,7.75.15.04,7.4.35,5.56c.03.45.46-.36.54-.18.19.42.23.81.12.97-.15.22-.55.06-.66.19-.26.3-.07,1.09-.47,1.15-2.58.17-5.05.12-7.73-.01-.41-1.09-.19-2.07-.19-3.03Z"
            />
            <path
              className="lodge-st12"
              d="M306.34,431.65c-.21-.24.29,8.37-.65,2.51-2.61-.25-5.01-.33-7.73-.44-.79-.03-1.11-1.69-.56-2.22l8.94.15Z"
            />
            <path
              className="lodge-st9"
              d="M320.96,424.67c.02.34.21.86-.05,1.18-.7-.32-.36,1.05-.67,1.17-1.37.5-3.2.33-4.53.07,0-1.26-.32-2.28.06-3.21,1.86-.35,3.31.36,4.83-.27.04.8-.2,1.15.37,1.06Z"
            />
            <path
              className="lodge-st24"
              d="M320.9,429.97c-1.65.71-2.41.23-5.09.27-.47-.24-.25-1.49-.21-2.12,1.7-.17,4.45.14,5.34-.41l-.04,2.25Z"
            />
            <path
              className="lodge-st34"
              d="M306.87,436.54v-6.59c.15-.12.34-.05.69.15v6.29c-.34.2-.53.29-.69.16Z"
            />
            <path
              className="lodge-st32"
              d="M320.94,426.63c-.04-.27-.13-.44.24-.4,1.1.04,2.24-.26,3.56.15-1.27.46-2.54.04-3.8.25Z"
            />
            <path
              className="lodge-st33"
              d="M340.77,441.62c-2.94.41-5.95.03-8.89.11-.37-1.78,1.4-6.86.12-7.57,1.29-.2,2.42-.24,3.75-.11-.13,2.13-.35,3.82-.71,5.83,0-.17,5.34-.29,4.86.24.39-.7.12-1.09.85-1.39.56.59.18,2.32.03,2.89Z"
            />
            <path
              className="lodge-st2"
              d="M333.75,439.51c-.68.15-1.38-.02-.75-.4.34-1.24-.57-3.64.27-4.05,1.68-.82.31,2.76.48,4.45Z"
            />
          </g>

          {/* Atmospheric Haze Layer spanning across background/midground elements */}
          <rect
            x="0"
            y="90"
            width="2400"
            height="50"
            fill="url(#haze-grad-dark)"
            style={{ pointerEvents: "none" }}
          />

          {/* Lake */}
          <rect
            x="0"
            y="128"
            width="2400"
            height="60"
            fill="#1E3A8A"
            opacity="0.4"
          />
          <g opacity="0.5">
            {STATIC.shimmers.map((s, i) => (
              <rect
                key={`shimmer-${i}`}
                x={s.x}
                y={s.y}
                width={s.w}
                height="2"
                rx="1"
                fill={"#60A5FA"}
                style={{
                  animation: `jp-fade-pulse 3s infinite ease-in-out ${s.delay}s`
                }}
              />
            ))}
          </g>

          {/* Lodge Shimmers */}
          <g opacity="0.5">
            {STATIC.lodgeShimmers.map((s, i) => (
              <rect
                key={`shimmer-${i}`}
                x={s.x}
                y={s.y}
                width={s.w}
                height="2"
                rx="1"
                fill={"#E8FA60"}
                style={{
                  animation: `jp-fade-pulse 3s infinite ease-in-out ${s.delay}s`
                }}
              />
            ))}
          </g>

          {/* Fluffy White Clouds */}
          <g opacity="0.95">
            <g className="jp-cloud-1" fill="url(#cloud-grad-dark-1)">
              <use
                href="#cloud-base"
                transform="translate(300, 70) scale(0.6)"
              />
              <use
                href="#cloud-base"
                transform="translate(2700, 70) scale(0.6)"
              />
            </g>
            <g className="jp-cloud-2" fill="url(#cloud-grad-dark-2)">
              <use
                href="#cloud-base"
                transform="translate(900, 90) scale(0.4)"
              />
              <use
                href="#cloud-base"
                transform="translate(3300, 90) scale(0.4)"
              />
            </g>
            <g className="jp-cloud-3" fill="url(#cloud-grad-dark-1)">
              <use
                href="#cloud-base"
                transform="translate(1600, 65) scale(0.7)"
              />
              <use
                href="#cloud-base"
                transform="translate(4000, 65) scale(0.7)"
              />
            </g>
            <g className="jp-cloud-4" fill="url(#cloud-grad-dark-2)">
              <use
                href="#cloud-base"
                transform="translate(2100, 80) scale(0.5)"
              />
              <use
                href="#cloud-base"
                transform="translate(4500, 80) scale(0.5)"
              />
            </g>
          </g>

          {/* Floating Atmospheric Particles */}
          <g fill={themeColor} opacity="0.4">
            {STATIC.glowParticles.map((p, i) => (
              <circle
                key={`glow-particle-${i}`}
                cx={p.x}
                cy={p.y}
                r={p.r}
                className="jp-particle"
                style={{
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`
                }}
              />
            ))}
          </g>

          {/* Foreground Ground */}
          <path
            d="M -100,400 L -100,150 Q 200,145 500,150 Q 800,140 1000,150 Q 1060,153 1130,135 Q 1170,135 1200,143 Q 1250,153 1300,150 Q 1600,140 1900,150 Q 2200,145 2500,150 L 2500,400 Z"
            fill="#050C24"
          />
          <path
            d="M -100,400 L -100,165 Q 200,160 500,165 Q 800,155 1000,165 Q 1060,168 1130,150 Q 1170,150 1200,158 Q 1250,168 1300,165 Q 1600,155 1900,165 Q 2200,160 2500,165 L 2500,400 Z"
            fill="#020617"
          />

          <g>
            {[...STATIC.fgTrees]
              .sort((a, b) => a.y - b.y) // higher y behind? (smaller y first = behind)
              .map((t) => {
                const baseY = baseOffsets?.[t.type] ?? 0

                return (
                  <use
                    key={t.id}
                    href={`#dark-tree-shape-${t.type}`}
                    transform={`translate(${t.x}, ${t.y}) scale(${t.scale}) translate(0, ${-baseY})`}
                  />
                )
              })}
          </g>

          {/* Expanded Organic Foreground Bushes */}
          <g>
            {/* Far Left Cluster */}
            <ellipse cx="-20" cy="180" rx="160" ry="50" fill="#060F1D" />
            <ellipse cx="50" cy="185" rx="140" ry="40" fill="#040A12" />
            <ellipse cx="70" cy="190" rx="120" ry="30" fill="#050C16" />
            <ellipse cx="100" cy="200" rx="60" ry="30" fill="#011726" />
            <ellipse cx="180" cy="195" rx="90" ry="35" fill="#040B14" />
            <ellipse cx="250" cy="190" rx="120" ry="30" fill="#06111B" />
            <ellipse cx="350" cy="195" rx="100" ry="25" fill="#040C14" />
            <ellipse cx="450" cy="200" rx="80" ry="20" fill="#030B10" />

            {/* Far Right Cluster */}
            <ellipse cx="2450" cy="180" rx="180" ry="50" fill="#060F1D" />
            <ellipse cx="2350" cy="185" rx="160" ry="45" fill="#040A12" />
            <ellipse cx="2250" cy="195" rx="110" ry="35" fill="#050C16" />
            <ellipse cx="2150" cy="200" rx="80" ry="25" fill="#011726" />
            <ellipse cx="2100" cy="190" rx="130" ry="35" fill="#040B14" />
            <ellipse cx="1950" cy="195" rx="100" ry="30" fill="#06111B" />
            <ellipse cx="1800" cy="195" rx="100" ry="25" fill="#040C14" />
            <ellipse cx="1650" cy="198" rx="70" ry="20" fill="#030B10" />
          </g>

          {/* --- CENTER ACTION --- */}
          <g transform="translate(1150, 110)">
            {/* Shadow on grass */}
            <ellipse cx="1" cy="27" rx="10" ry="4" fill="#000" opacity="0.6" />

            {/* Glowing Interface Apps floating above the box */}
            <g transform="translate(45, 25)" fill={themeColor} opacity="0.9">
              <rect
                x="-10"
                y="-22"
                width="4"
                height="4"
                rx="1"
                className="jp-hover-app"
                style={{ animationDelay: "0s" }}
              />
              <circle
                cx="-1"
                cy="-24"
                r="2"
                className="jp-hover-app"
                style={{ animationDelay: "1.5s" }}
              />
              <polygon
                points="4,-18 7,-13 1,-13"
                className="jp-hover-app"
                style={{ animationDelay: "0.8s" }}
              />
            </g>

            {/* Beams radiating from the box opening */}
            <g transform="translate(40, 35)" style={{ mixBlendMode: "screen" }}>
              <polygon
                points="2,0 8,0 15,-40 -10,-40"
                fill="url(#beam-grad-dark)"
                className="jp-beam-pulse"
                style={{ animationDelay: "0s" }}
              />
              <polygon
                points="4,0 6,0 -5,-30 -15,-20"
                fill="url(#beam-grad-dark)"
                className="jp-beam-pulse"
                style={{ animationDelay: "0.7s" }}
              />
              <polygon
                points="4,0 6,0 25,-25 15,-30"
                fill="url(#beam-grad-dark)"
                className="jp-beam-pulse"
                style={{ animationDelay: "1.4s" }}
              />
            </g>

            {/* Box */}
            <g transform="translate(45, 35)">
              <g transform="scale(0.25) translate(-294, -440)">
                <path
                  className="box-st2"
                  d="M339.59,404.17c-.03.94-1.24.32-1.89.41l-4.41.6c-1.46.2-2.73.31-4.09.43l-3.61.31-4.4.44-4,.32-6,.5c-1.08.09-3.14-.43-3.62.98-1.32,3.94-.64,8.33-.64,12.88l-.03,46.12-67.94-4.95-.21-9.1.26-28.26c.91.36,1.9.41,2.91.53l17.31,2.04,28.14,2.66c4.03.38,7.81.79,11.81.67,2.81-.09,4.87-9.75,5.68-12.21.55-1.68.94-3.25.89-5.18-.03-1.17,1.06-5.01.25-4.84.21-.38.26-.83.4-1.24.25.02.42.21.62.2.37-.02.5-.47.88-.52,5.08-.64,10.71-1.01,15.78-1.42l3.97-.32,4.17-.38,3.36-.44c1.16-.15,3.33.07,4.4-.22Z"
                />
                <path
                  className="box-st6"
                  d="M239.01,424.84c.02-2.06-.18-4.14.03-6.2l58.5,4.92,8.47-15.05c.81-.18-.28,3.67-.25,4.84.05,1.94-.34,3.5-.89,5.18-.81,2.47-2.87,12.13-5.68,12.21-4,.12-7.78-.29-11.81-.67l-28.14-2.66-17.31-2.04c-1.01-.12-2-.17-2.91-.53Z"
                />
                <path
                  className="box-st9"
                  d="M296.08,397.31c-.17.41.07.8.07,1.23l-.05,7.8-52.59-4.56c-.33-.03-.75-.39-1.06-.27,1.75-.58,3.62-.31,5.76-.47l47.87-3.73Z"
                />
                <path
                  className="box-st5"
                  d="M341.42,403.94c1.56,1.15,5.02-.24,7.31-.06.61,1.84,1.55,3.61,2.53,5.45l5.24,9.85c-2.76.08-5,1.19-7.29,1.4l-6.32.57-25.83,3.33c-.49.06-1.78-.27-1.9-.91-.13-.72-2.37-4.99-2.64-5.59l-1.94-4.39c.18-.2.64-.5.27-.59-1.22-.31-2.56-3.79-3.28-4.84.47-1.41,2.54-.89,3.62-.98l6-.5,4-.32,4.4-.44,3.61-.31c1.37-.12,2.63-.23,4.09-.43l4.41-.6c.65-.09,1.86.54,1.89-.41.45-.12,1.35-.58,1.84-.22Z"
                />
                <path
                  className="box-st4"
                  d="M343,404.78c-.5-.49-1.44.14-1.91.31-1.12.4-3.37.09-4.58.3l-3.49.61-4.34.52-4.13.44c-5.29.57-11.15,1.08-16.43,1.97-.39.07-.52.69-.91.72-.21.01-.38-.24-.65-.27l-10.74-1.28.05-10.79,36.47,4.96,12.37,1.98c-.62.86-1.26.12-1.7.52Z"
                />
                <g>
                  <path
                    className="box-st12"
                    d="M349.22,420.58l.33,14.59-.11,22.95-22.04,4.75-20.5,4.28.03-46.12c0-4.54-.68-8.94.64-12.88.72,1.05,2.06,4.53,3.28,4.84.37.09-.09.4-.27.59l1.94,4.39c.26.6,2.5,4.87,2.64,5.59.12.64,1.41.97,1.9.91l25.83-3.33,6.32-.57Z"
                  />
                  <g>
                    <path
                      className="box-st0"
                      d="M339.21,448.04l-.03,8.42c0,.51-.77.63-.74,1.1l-7.62,1.55c-.34.07-.66-.17-.76.16-.05.15.02.38,0,.58-.45.31-1.94.05-1.93-.42.58.28.86-.15.46-.35-.17-.08-.16-.62.2-.84s1.03-.05,1.31-.17c.95-.42-1.18-.34.19-4.46.1-.29-.47-.69-.21-1.19.14-.27.43-.55.84-1.15-.96-.29-1.86-.11-2.74-.19,0-.32-.15-.91.17-1.15.24-.18.65-.32.98-.37-.15.27.2.35.33.58.18.33.35.04.77-.06l5.34-1.29c.33-.08.65.15.76-.17.05-.15-.01-.37,0-.58.93-.29,1.91.16,2.67,0Z"
                    />
                    <g>
                      <path
                        className="box-st1"
                        d="M328.13,459.43l.04-2.41c.71.22,1.45.32,1.44.1-.34-4.08.35-2.73-.47-5.19-.94-2.84-.31,5.98-.76,5.12-.49-2.16-.23-4.05-.19-5.98.88.08,1.78-.1,2.74.19-.41.6-.7.89-.84,1.15-.26.5.31.9.21,1.19-1.37,4.12.76,4.03-.19,4.46-.28.12-.95-.05-1.31.17s-.37.76-.2.84c.4.19.12.63-.46.35Z"
                      />
                      <path
                        className="box-st7"
                        d="M329.34,449.56c2.4-.61,4.87-.79,7.2-1.52-.02.21.05.43,0,.58-.1.32-.43.09-.76.17l-5.34,1.29c-.42.1-.59.38-.77.06-.13-.23-.48-.31-.33-.58Z"
                      />
                      <path
                        className="box-st3"
                        d="M338.45,457.56c-.45,1.14-7.92,1.98-8.38,2.29.02-.19-.05-.42,0-.58.11-.33.43-.09.76-.16l7.62-1.55Z"
                      />
                      <path
                        className="box-st3"
                        d="M338.45,457.56c-.04-.47.73-.59.74-1.1l.03-8.42c.94,2.98.03,6.22.46,9.46-.65.13-.89.04-1.22.06Z"
                      />
                      <path
                        className="box-st10"
                        d="M334.86,456.35l.3-4.98c.91,1.37-.14,2.76.46,3.8.17.29.86.55,1.02.35.29-.36.21-4.2.05-4.71-.08-.26-.22-.47-.23-.67-.03-.37.31-.61.6-.51,1.19.38-.09,3.51.48,6.16-.48.69-1.9.53-2.68.56Z"
                      />
                      <path
                        className="box-st8"
                        d="M335.23,451.36c-.54-.51-.5-1.29-.01-1.68.35.23.51.36.54.55.05.33.16.68-.53,1.13Z"
                      />
                    </g>
                  </g>
                </g>
                <path
                  className="box-st11"
                  d="M242.45,401.51c.31-.12.73.24,1.06.27l52.59,4.56,10.32.92c-.14.4-.19.86-.4,1.24l-8.47,15.05-58.5-4.92-8.34-1.2,9.18-15.39c.53-.89,1.9-.31,2.56-.54Z"
                />
              </g>
            </g>

            {/* Boy with hardcoded dark/nighttime fills to safely bypass light mode SVGs */}
            <g transform="translate(0, 27) scale(0.35) translate(-297, -495)">
              <defs>
                {/* Combine all the boy's paths into a single unified silhouette for masking */}
                <g id="boy_silhouette">
                  <path d="M315.18,436.69l.11,3.33c.03.89.18,2.06-.59,2.33-2.46.53-5.23.75-7.68.9,1.8-2.48,3.18-5.2,4.37-8.02.61-1.45,1.17-2.94,1.88-4.34,1.19,1.53,1.84,3.76,1.91,5.81h0Z" />
                  <path d="M315.83,351c4,3.21,5.02,8.58,1.56,12.64-.72.84-1.55,1.55-2.31,2.23-1.7-.37-1.51,1.55-3.56,4.45-1.37,1.94-2.16,3.97-3.36,6.35l-1.68-2.96c-.89-1.57-2.96-1.85-4.47-.73-1.78,1.32-2.45,3.54-2,5.77.37,1.85,1.54,3.48,4.02,4.14-2.6,3.19-6.2,5.36-10.29,5.48l-4.47.13c-8.76-3.41-14.86-11.25-15.53-20.86-.18-2.58-.03-5.38.87-7.81.79-2.15,2.77-3.89,4.87-4.86-.42-.64-.79-1.68-.6-2.56.12-.58.59-1.45,1.56-1.67.64-.15,1.01.62,1.34.9,5.19-6.13,15.04-6.16,22.23-4.71,1.37.28,2.66.29,3.52-.52.83-.04,1.94-.72,2.87-.56s1.01,1.24.97,1.9c-.03.53-.5,1.12-.78,1.62,1.65.75,3.91.58,5.24,1.64Z" />
                  <path d="M313.61,445.45c.73,6.08.77,12.32.58,18.71-.04,1.23-1.95,1.27-2.78,1.72l-1,12.35c-3.15.35-6.3.13-9.46.02-.94-3.83-.14-8.12-.73-12.16-3.79.64-2.11-4.94-3.82-8.11-.89,2.39-.75,7.86-2.78,8.54l-1.94,11.51c-.04.26-.8.08-.61.52-2.82-.07-5.68-.16-8.45-.7-.84-3.89.44-7.99.23-12.18-.57-.17-2.67-.2-2.62-1.18.32-6.11.52-12.08,1.29-17.91,10.38,1.16,21.79,1.57,32.09-1.14Z" />
                  <path d="M314.41,402.79c1.43,3.04,2.79,6.12,4.02,9.19.62,1.55,1.2,3.5,1.57,5.28.23,1.09-1.58,1.33-2.24,1.51l-5.58,1.54c-1.23.34-2.07.41-2.84.78-.5-.06-1.16-.73-1.78-.3-.15-3.48-.35-6.93-.93-10.37-.4-2.35-.71-4.87-1.86-7,1.31-1.25,5.24-5.78,7.36-3.33.74.85,1.81,1.71,2.27,2.69Z" />
                  <path d="M315.03,437.12c.29,2.13-.09,4.48-.09,6.83,0,.74-.87,1.38-1.33,1.5-10.3,2.71-21.71,2.3-32.09,1.14-2.55-.28-3.06-2.6-4.36-3.82,6.25.57,12.52,1.15,18.81.8,5.49-.31,9.58-1.04,12.52-5.98l3.9-6.56c.51,2.04,2.36,3.95,2.65,6.1Z" />
                  <path d="M293.46,494.67c-1.77.72-3.73.95-5.82.92l-6.22-.1c-.26-.09-.1-.22-.1-.4.01-.43.24-6.5,1.38-5.85,1.63-.42,5.77,1.19,6.93-.69,1.65,1.72,4.21,2.66,3.82,6.12Z" />
                  <path d="M316.93,495.03c-5.12.98-10.37.54-15.57.66-.15-.42-.5-.58-.45-1.03.17-1.8.09-3.76.86-5.35,2.95-.13,6.36,1.44,7.96-1.18,2.05,1.26,9.11,3.25,7.2,6.89Z" />
                  <path d="M309.4,486.27l.33,1.86c-1.6,2.62-5.01,1.05-7.96,1.18-.56-.88.08-2.24-.04-3.11,2.55.15,5.12.2,7.67.07Z" />
                  <path d="M281.43,495.49l6.22.1c2.09.03,4.05-.2,5.82-.92-.05.44.24.72-.12.97-2.36,1.67-11.42,1.65-11.85.72-.13-.29-.01-.57-.07-.88Z" />
                  <path d="M315.03,437.12c-.29-2.15-2.14-4.06-2.65-6.1-.37-1.46-.74-2.88-1.52-4.21-.63-1.07-.45-2.76-.74-3.92,1.13-1.09,6.32-.6,7.21-2.96l4.29,19.03c.45,2.01,1.33,3.67,1.01,5.78-.27,1.73-1.41,3.81-3.33,3.76-1.26-.03-1.18-1.74-1.21-2.76-3.52-.85.59-3.97-3.05-8.61Z" />
                  <path d="M310.42,478.23l-.36,3.75c-.14,1.45-.24,2.88-.66,4.29-2.56.14-5.12.08-7.67-.07l-.68-4.82c-.14-.96.15-2.15-.09-3.12,3.16.11,6.32.33,9.46-.02Z" />
                  <path d="M317.76,418.78c.02.28-.08.39-.22.41-.54.09-.29.5-.22.74-.89,2.37-6.08,1.88-7.21,2.96-.38-.45-.93-1.03-.78-1.79.77-.38,1.61-.44,2.84-.78l5.58-1.54Z" />
                  <path d="M291.07,478.56c.38.88-.24,1.92.32,2.75-1.36,0-.67,4.92-1.76,4.91-2.43.19-4.87.1-7.3-.04.02-1.74.1-3.42-.09-5.14-.1-.93.2-2.32.38-3.18,2.77.54,5.63.63,8.45.7Z" />
                  <path d="M289.63,486.22c.25.61.39,1.7,0,2.33-1.16,1.88-5.3.26-6.93.69-.81-.83-.39-2-.38-3.05,2.43.14,4.87.23,7.3.04Z" />
                  <path d="M291.89,395.05c3.16.99,6.48.3,9.76.33.54,0,1.02.24,1.54.35l-3.94,3.31c-3.73-1.22-7.18-.87-11.01-1.23-.24-1.12.81-2.15,1.69-2.66.51,0,1.46-.25,1.95-.09Z" />
                  <path d="M315.08,365.88c.21,1.12.04,2.27,0,3.41-.03.77.43,2.18-.07,2.96-1.07,1.66-.68,2.54.26,4.05.61.97.53,2.64.75,3.7.2.96-.67,2.03-.25,3-.63.2-.22,1.03-.32,1.52-.8,1.07-2.12,1.96-2.01,3.32-.33-.4-.7.18-1.06.47-3.01,2.43-6.61,3.33-10.48,3.64-.34,1.24-.26,2.36-.25,3.42-3.28-.03-6.6.66-9.76-.33-.12-1.23.83-2.65.28-4.12-.38-1.01-2.18-1.71-2.9-2.44l4.47-.13c4.08-.12,7.69-2.29,10.29-5.48-2.47-.65-3.65-2.29-4.02-4.14-.45-2.23.22-4.45,2-5.77,1.5-1.11,3.58-.84,4.47.73l1.68,2.96c1.2-2.38,1.99-4.41,3.36-6.35,2.05-2.9,1.85-4.82,3.56-4.45Z" />
                  <path d="M304.96,377.71c-.13-.91-.82-1.15-1.8-1.67.55-.59,1.09-.29,1.45.09s.94.76.35,1.57Z" />
                  <path d="M315.45,384.52c.1-.49-.31-1.32.32-1.52.3.69,0,1.11-.32,1.52Z" />
                  <path d="M274.8,406.62l1.39-3.8c.18-.48.95-.76,1.12-1.18.53-.45.92.65,1.37.65,1.36,0,2.8-.85,4.03-.94,2.18-.14,4.5-.24,6.69.11l2.86.45c4.84.76,7.05,4.56,7.03,9.12-.02,3.26.04,4.89-.17,8.13l-.51,8.05c-.17,2.72-.45,5.35-1.2,7.92-.56,1.93-2.4,3.12-4.46,3.34-4.57.5-9.15.09-13.67-.47-6.25-.76-5.47-6.95-5.24-13.01.03-.75.55-1.73.54-2.38-.03-1.62-.75-3.24.21-4.85,1.52.65,3.13.83,4.86.64-.25.03,17.59,1.38,17.46-.55-.27-.64-.97.15-1.23.15h-17.61c1.14,0-2.26-.31-3.11-.92-.16-.11-.53-3.03-.02-3.71.39-.52,2.96-1.43,4.6-.69.21.09.57-.46.88-.42.34.05.53.38.9.41,2.77.21,5.35-.2,7.94.19,2.31.34,4.56.44,7,.06l-3.99-.6-7.65-.14c-2.98-.06-6.14-.02-9.25-.21-1.04-1.31.63-5.34-.75-5.34Z" />
                  <path d="M289.94,395.14c-.88.51-1.93,1.54-1.69,2.66,3.83.36,7.28.01,11.01,1.23l3.94-3.31c2.6-.52,5.29.07,7.36,1.93-1.91.61-8.32,4.32-5.77,5.78,1.15,2.13,1.46,4.65,1.86,7-.18-.08-.48.12-.79-.15-.21-.18-.31.3-.62.53-1.57.24-2.72.22-4.38.73l-.31,2.76c-1.08.95-.51-3.94-.82-5.28-1.34-5.72-3.32-6.89-8.81-7.93-2.62-.5-5.38.03-8.14-.22-.1.23-.12.46-.06.48-1.23.08-2.67.93-4.03.94-.45,0-.83-1.1-1.37-.65.85-2.06,3.69-2.07,5.2-3.54s2.42-2.99,4.82-3.41c.9-.16,2.07-.52,2.6.46Z" />
                  <path d="M300.53,414.3c.32-2.85.08,10.68,1.03,7.99l.03,10.91c0,2.8-.71,5.45-1.78,8.01-1.34,3.19-4.25.44-3.84,2.37-6.29.35-12.56-.23-18.81-.8-2.22-2.1-4.52-3.12-4.65-6.8s-.46-7.83.06-11.82c.3-2.31-.06-4.5.22-6.55l1.05-7.58c.18-1.34.6-2.4.96-3.4,1.38,0-.28,4.03.75,5.34,3.11.2,6.27.16,9.25.21l7.65.14,3.99.6c-2.44.38-4.69.29-7-.06-2.59-.38-5.17.02-7.94-.19-.37-.03-.56-.36-.9-.41-.31-.04-.67.51-.88.42-1.64-.74-4.21.17-4.6.69-.51.68-.13,3.59.02,3.71.85.61,4.25.91,3.11.91h17.61c.26,0,.96-.78,1.23-.14.13,1.93-17.71.58-17.46.55-1.72.19-3.34,0-4.86-.64-.96,1.62-.24,3.24-.21,4.85.01.64-.51,1.62-.54,2.38-.22,6.06-1.01,12.24,5.24,13.01,4.53.55,9.1.97,13.67.47,2.07-.23,3.9-1.41,4.46-3.34.74-2.57,1.03-5.2,1.2-7.92l.51-8.05c.2-3.24.15-4.87.17-8.13.03-4.56-2.19-8.36-7.03-9.12l-2.86-.45c-2.19-.34-4.52-.25-6.69-.11-.06-.02-.04-.25.06-.48,2.76.25,5.52-.28,8.14.22,5.49,1.04,7.47,2.21,8.81,7.93.31,1.34-.26,6.24.82,5.28Z" />
                  <path d="M306.64,410.43c.58,3.44.78,6.89.93,10.37.11,2.5.28,5.03.52,7.53-.39-.02-.21.38-.26.58-.09.37.09.57.39.57.06.4-.35.86.18,1.54.86-1.41,1.79-2.72,2.47-4.2.78,1.33,1.15,2.75,1.52,4.21l-3.9,6.56c-2.94,4.94-7.02,5.68-12.52,5.98-.41-1.93,2.49.82,3.84-2.37,1.07-2.55,1.79-5.21,1.78-8.01l-.03-10.91c-.94,2.69-.7-10.84-1.03-7.99l.31-2.76c1.66-.5,2.81-.48,4.38-.73.31-.23.41-.71.62-.53.32.27.61.07.79.15Z" />
                  <path d="M309.35,421.1c-.15.76.4,1.34.78,1.79.29,1.16.12,2.85.74,3.92-.68,1.48-1.61,2.8-2.47,4.2-.53-.68-.12-1.13-.18-1.54-.03-.38.12-.81-.13-1.14-.24-2.49-.42-5.02-.52-7.53.62-.43,1.27.24,1.78.3Z" />
                  <path d="M308.22,429.48c-.29,0-.48-.2-.39-.57.05-.2-.13-.6.26-.58.24.33.1.76.13,1.14Z" />
                </g>

                {/* Mask: Translating a black silhouette left by 10 units leaves a solid 10-unit white band perfectly hugging the right side */}
                <mask id="right_rim_mask">
                  <use href="#boy_silhouette" fill="white" />
                  <use
                    href="#boy_silhouette"
                    fill="black"
                    transform="translate(-5, 0)"
                  />
                </mask>
              </defs>

              {/* Render the original boy layer beneath */}
              <path
                fill="#4A3810"
                d="M315.18,436.69l.11,3.33c.03.89.18,2.06-.59,2.33-2.46.53-5.23.75-7.68.9,1.8-2.48,3.18-5.2,4.37-8.02.61-1.45,1.17-2.94,1.88-4.34,1.19,1.53,1.84,3.76,1.91,5.81h0Z"
              />
              <g>
                <path
                  fill="#1A0E22"
                  d="M315.83,351c4,3.21,5.02,8.58,1.56,12.64-.72.84-1.55,1.55-2.31,2.23-1.7-.37-1.51,1.55-3.56,4.45-1.37,1.94-2.16,3.97-3.36,6.35l-1.68-2.96c-.89-1.57-2.96-1.85-4.47-.73-1.78,1.32-2.45,3.54-2,5.77.37,1.85,1.54,3.48,4.02,4.14-2.6,3.19-6.2,5.36-10.29,5.48l-4.47.13c-8.76-3.41-14.86-11.25-15.53-20.86-.18-2.58-.03-5.38.87-7.81.79-2.15,2.77-3.89,4.87-4.86-.42-.64-.79-1.68-.6-2.56.12-.58.59-1.45,1.56-1.67.64-.15,1.01.62,1.34.9,5.19-6.13,15.04-6.16,22.23-4.71,1.37.28,2.66.29,3.52-.52.83-.04,1.94-.72,2.87-.56s1.01,1.24.97,1.9c-.03.53-.5,1.12-.78,1.62,1.65.75,3.91.58,5.24,1.64Z"
                />
                <path
                  fill="#0D1338"
                  d="M313.61,445.45c.73,6.08.77,12.32.58,18.71-.04,1.23-1.95,1.27-2.78,1.72l-1,12.35c-3.15.35-6.3.13-9.46.02-.94-3.83-.14-8.12-.73-12.16-3.79.64-2.11-4.94-3.82-8.11-.89,2.39-.75,7.86-2.78,8.54l-1.94,11.51c-.04.26-.8.08-.61.52-2.82-.07-5.68-.16-8.45-.7-.84-3.89.44-7.99.23-12.18-.57-.17-2.67-.2-2.62-1.18.32-6.11.52-12.08,1.29-17.91,10.38,1.16,21.79,1.57,32.09-1.14Z"
                />
                <path
                  fill="#4D3708"
                  d="M314.41,402.79c1.43,3.04,2.79,6.12,4.02,9.19.62,1.55,1.2,3.5,1.57,5.28.23,1.09-1.58,1.33-2.24,1.51l-5.58,1.54c-1.23.34-2.07.41-2.84.78-.5-.06-1.16-.73-1.78-.3-.15-3.48-.35-6.93-.93-10.37-.4-2.35-.71-4.87-1.86-7,1.31-1.25,5.24-5.78,7.36-3.33.74.85,1.81,1.71,2.27,2.69Z"
                />
                <path
                  fill="#523408"
                  d="M315.03,437.12c.29,2.13-.09,4.48-.09,6.83,0,.74-.87,1.38-1.33,1.5-10.3,2.71-21.71,2.3-32.09,1.14-2.55-.28-3.06-2.6-4.36-3.82,6.25.57,12.52,1.15,18.81.8,5.49-.31,9.58-1.04,12.52-5.98l3.9-6.56c.51,2.04,2.36,3.95,2.65,6.1Z"
                />
                <path
                  fill="#0E1642"
                  d="M293.46,494.67c-1.77.72-3.73.95-5.82.92l-6.22-.1c-.26-.09-.1-.22-.1-.4.01-.43.24-6.5,1.38-5.85,1.63-.42,5.77,1.19,6.93-.69,1.65,1.72,4.21,2.66,3.82,6.12Z"
                />
                <path
                  fill="#0E1642"
                  d="M316.93,495.03c-5.12.98-10.37.54-15.57.66-.15-.42-.5-.58-.45-1.03.17-1.8.09-3.76.86-5.35,2.95-.13,6.36,1.44,7.96-1.18,2.05,1.26,9.11,3.25,7.2,6.89Z"
                />
                <path
                  fill="#6E84A3"
                  d="M309.4,486.27l.33,1.86c-1.6,2.62-5.01,1.05-7.96,1.18-.56-.88.08-2.24-.04-3.11,2.55.15,5.12.2,7.67.07Z"
                />
                <path
                  fill="#3B516B"
                  d="M281.43,495.49l6.22.1c2.09.03,4.05-.2,5.82-.92-.05.44.24.72-.12.97-2.36,1.67-11.42,1.65-11.85.72-.13-.29-.01-.57-.07-.88Z"
                />
                <g>
                  <path
                    fill="#593631"
                    d="M315.03,437.12c-.29-2.15-2.14-4.06-2.65-6.1-.37-1.46-.74-2.88-1.52-4.21-.63-1.07-.45-2.76-.74-3.92,1.13-1.09,6.32-.6,7.21-2.96l4.29,19.03c.45,2.01,1.33,3.67,1.01,5.78-.27,1.73-1.41,3.81-3.33,3.76-1.26-.03-1.18-1.74-1.21-2.76-3.52-.85.59-3.97-3.05-8.61Z"
                  />
                  <path
                    fill="#54312C"
                    d="M310.42,478.23l-.36,3.75c-.14,1.45-.24,2.88-.66,4.29-2.56.14-5.12.08-7.67-.07l-.68-4.82c-.14-.96.15-2.15-.09-3.12,3.16.11,6.32.33,9.46-.02Z"
                  />
                  <path
                    fill="#572D2B"
                    d="M317.76,418.78c.02.28-.08.39-.22.41-.54.09-.29.5-.22.74-.89,2.37-6.08,1.88-7.21,2.96-.38-.45-.93-1.03-.78-1.79.77-.38,1.61-.44,2.84-.78l5.58-1.54Z"
                  />
                  <path
                    fill="#54312C"
                    d="M291.07,478.56c.38.88-.24,1.92.32,2.75-1.36,0-.67,4.92-1.76,4.91-2.43.19-4.87.1-7.3-.04.02-1.74.1-3.42-.09-5.14-.1-.93.2-2.32.38-3.18,2.77.54,5.63.63,8.45.7Z"
                  />
                  <path
                    fill="#6E84A3"
                    d="M289.63,486.22c.25.61.39,1.7,0,2.33-1.16,1.88-5.3.26-6.93.69-.81-.83-.39-2-.38-3.05,2.43.14,4.87.23,7.3.04Z"
                  />
                  <path
                    fill="#4F3807"
                    d="M291.89,395.05c3.16.99,6.48.3,9.76.33.54,0,1.02.24,1.54.35l-3.94,3.31c-3.73-1.22-7.18-.87-11.01-1.23-.24-1.12.81-2.15,1.69-2.66.51,0,1.46-.25,1.95-.09Z"
                  />
                  <g>
                    <path
                      fill="#593631"
                      d="M315.08,365.88c.21,1.12.04,2.27,0,3.41-.03.77.43,2.18-.07,2.96-1.07,1.66-.68,2.54.26,4.05.61.97.53,2.64.75,3.7.2.96-.67,2.03-.25,3-.63.2-.22,1.03-.32,1.52-.8,1.07-2.12,1.96-2.01,3.32-.33-.4-.7.18-1.06.47-3.01,2.43-6.61,3.33-10.48,3.64-.34,1.24-.26,2.36-.25,3.42-3.28-.03-6.6.66-9.76-.33-.12-1.23.83-2.65.28-4.12-.38-1.01-2.18-1.71-2.9-2.44l4.47-.13c4.08-.12,7.69-2.29,10.29-5.48-2.47-.65-3.65-2.29-4.02-4.14-.45-2.23.22-4.45,2-5.77,1.5-1.11,3.58-.84,4.47.73l1.68,2.96c1.2-2.38,1.99-4.41,3.36-6.35,2.05-2.9,1.85-4.82,3.56-4.45Z"
                    />
                    <path
                      fill="#572C2A"
                      d="M304.96,377.71c-.13-.91-.82-1.15-1.8-1.67.55-.59,1.09-.29,1.45.09s.94.76.35,1.57Z"
                    />
                    <path
                      fill="#162130"
                      d="M315.45,384.52c.1-.49-.31-1.32.32-1.52.3.69,0,1.11-.32,1.52Z"
                    />
                  </g>
                </g>
                <g>
                  <path
                    fill="#093473"
                    d="M274.8,406.62l1.39-3.8c.18-.48.95-.76,1.12-1.18.53-.45.92.65,1.37.65,1.36,0,2.8-.85,4.03-.94,2.18-.14,4.5-.24,6.69.11l2.86.45c4.84.76,7.05,4.56,7.03,9.12-.02,3.26.04,4.89-.17,8.13l-.51,8.05c-.17,2.72-.45,5.35-1.2,7.92-.56,1.93-2.4,3.12-4.46,3.34-4.57.5-9.15.09-13.67-.47-6.25-.76-5.47-6.95-5.24-13.01.03-.75.55-1.73.54-2.38-.03-1.62-.75-3.24.21-4.85,1.52.65,3.13.83,4.86.64-.25.03,17.59,1.38,17.46-.55-.27-.64-.97.15-1.23.15h-17.61c1.14,0-2.26-.31-3.11-.92-.16-.11-.53-3.03-.02-3.71.39-.52,2.96-1.43,4.6-.69.21.09.57-.46.88-.42.34.05.53.38.9.41,2.77.21,5.35-.2,7.94.19,2.31.34,4.56.44,7,.06l-3.99-.6-7.65-.14c-2.98-.06-6.14-.02-9.25-.21-1.04-1.31.63-5.34-.75-5.34Z"
                  />
                  <path
                    fill="#093070"
                    d="M289.94,395.14c-.88.51-1.93,1.54-1.69,2.66,3.83.36,7.28.01,11.01,1.23l3.94-3.31c2.6-.52,5.29.07,7.36,1.93-1.91.61-8.32,4.32-5.77,5.78,1.15,2.13,1.46,4.65,1.86,7-.18-.08-.48.12-.79-.15-.21-.18-.31.3-.62.53-1.57.24-2.72.22-4.38.73l-.31,2.76c-1.08.95-.51-3.94-.82-5.28-1.34-5.72-3.32-6.89-8.81-7.93-2.62-.5-5.38.03-8.14-.22-.1.23-.12.46-.06.48-1.23.08-2.67.93-4.03.94-.45,0-.83-1.1-1.37-.65.85-2.06,3.69-2.07,5.2-3.54s2.42-2.99,4.82-3.41c.9-.16,2.07-.52,2.6.46Z"
                  />
                  <path
                    fill="#082C66"
                    d="M300.53,414.3c.32-2.85.08,10.68,1.03,7.99l.03,10.91c0,2.8-.71,5.45-1.78,8.01-1.34,3.19-4.25.44-3.84,2.37-6.29.35-12.56-.23-18.81-.8-2.22-2.1-4.52-3.12-4.65-6.8s-.46-7.83.06-11.82c.3-2.31-.06-4.5.22-6.55l1.05-7.58c.18-1.34.6-2.4.96-3.4,1.38,0-.28,4.03.75,5.34,3.11.2,6.27.16,9.25.21l7.65.14,3.99.6c-2.44.38-4.69.29-7-.06-2.59-.38-5.17.02-7.94-.19-.37-.03-.56-.36-.9-.41-.31-.04-.67.51-.88.42-1.64-.74-4.21.17-4.6.69-.51.68-.13,3.59.02,3.71.85.61,4.25.91,3.11.91h17.61c.26,0,.96-.78,1.23-.14.13,1.93-17.71.58-17.46.55-1.72.19-3.34,0-4.86-.64-.96,1.62-.24,3.24-.21,4.85.01.64-.51,1.62-.54,2.38-.22,6.06-1.01,12.24,5.24,13.01,4.53.55,9.1.97,13.67.47,2.07-.23,3.9-1.41,4.46-3.34.74-2.57,1.03-5.2,1.2-7.92l.51-8.05c.2-3.24.15-4.87.17-8.13.03-4.56-2.19-8.36-7.03-9.12l-2.86-.45c-2.19-.34-4.52-.25-6.69-.11-.06-.02-.04-.25.06-.48,2.76.25,5.52-.28,8.14.22,5.49,1.04,7.47,2.21,8.81,7.93.31,1.34-.26,6.24.82,5.28Z"
                  />
                  <path
                    fill="#082863"
                    d="M306.64,410.43c.58,3.44.78,6.89.93,10.37.11,2.5.28,5.03.52,7.53-.39-.02-.21.38-.26.58-.09.37.09.57.39.57.06.4-.35.86.18,1.54.86-1.41,1.79-2.72,2.47-4.2.78,1.33,1.15,2.75,1.52,4.21l-3.9,6.56c-2.94,4.94-7.02,5.68-12.52,5.98-.41-1.93,2.49.82,3.84-2.37,1.07-2.55,1.79-5.21,1.78-8.01l-.03-10.91c-.94,2.69-.7-10.84-1.03-7.99l.31-2.76c1.66-.5,2.81-.48,4.38-.73.31-.23.41-.71.62-.53.32.27.61.07.79.15Z"
                  />
                  <path
                    fill="#4F3607"
                    d="M309.35,421.1c-.15.76.4,1.34.78,1.79.29,1.16.12,2.85.74,3.92-.68,1.48-1.61,2.8-2.47,4.2-.53-.68-.12-1.13-.18-1.54-.03-.38.12-.81-.13-1.14-.24-2.49-.42-5.02-.52-7.53.62-.43,1.27.24,1.78.3Z"
                  />
                  <path
                    fill="#452432"
                    d="M308.22,429.48c-.29,0-.48-.2-.39-.57.05-.2-.13-.6.26-.58.24.33.1.76.13,1.14Z"
                  />
                </g>
              </g>

              {/* This renders the thick theme-colored right-side rim light over the boy */}
              <use
                href="#boy_silhouette"
                fill={`${themeColor}`}
                mask="url(#right_rim_mask)"
                opacity="0.75"
              />
            </g>
          </g>

          {/* Grain Overlay */}
          <rect
            x="0"
            y="0"
            width="2400"
            height="400"
            filter="url(#grain-dark)"
            opacity="1"
            style={{ mixBlendMode: "overlay", pointerEvents: "none" }}
          />

          {/* DEDICATED NIGHT-TIME CSS
          Prefixing everything with .dark-scene ensures zero clash with the Summer mode.
          Mapped all original colors to a deep, stylized indigo and slate night palette.
        */}
          <style>{`
          .dark-tree-st10 { fill: url(#linear-gradient-tree1-dark); }
          .dark-tree-st1 { fill: url(#linear-gradient-tree5-dark); }
          
          /* Shadows & Trunks */
          .dark-tree-st7, .dark-tree-st8, .dark-tree-st11, .dark-tree-st12, 
          .dark-tree-st13, .dark-tree-st16, .dark-tree-st18, .dark-tree-st19, 
          .dark-tree-st21, .dark-tree-st22, .dark-tree-st23, .dark-tree-st27, 
          .dark-tree-st28, .dark-tree-st31, .dark-tree-st33, .dark-tree-st35, 
          .dark-tree-st36, .dark-tree-st38, .dark-tree-st40, .dark-tree-st42, 
          .dark-tree-st43, .dark-tree-st44, .dark-tree-st45, .dark-tree-st48, 
          .dark-tree-st49, .dark-tree-st54, .dark-tree-st55, .dark-tree-st57 { fill: #020617; }
          
          /* Darkest Leaves */
          .dark-tree-st0, .dark-tree-st2, .dark-tree-st4, .dark-tree-st15, .dark-tree-st17, 
          .dark-tree-st20, .dark-tree-st24, .dark-tree-st26, .dark-tree-st29, 
          .dark-tree-st30, .dark-tree-st32, .dark-tree-st39, .dark-tree-st52, 
          .dark-tree-st53 { fill: #050F24; }

          /* Mid/Base Leaves */
          .dark-tree-st6, .dark-tree-st9, .dark-tree-st14, .dark-tree-st34, 
          .dark-tree-st41, .dark-tree-st50, .dark-tree-st56 { fill: #0B1B3D; }

          /* Light Leaves */
          .dark-tree-st5, .dark-tree-st25, .dark-tree-st37, .dark-tree-st46 { fill: #112756; }

          /* Box Colors (Dark Slate Blues) */
          .dark-scene .box-st0, .dark-scene .box-st1, .dark-scene .box-st3, .dark-scene .box-st7, 
          .dark-scene .box-st8, .dark-scene .box-st10, .dark-scene .box-st12 { fill: #0F172A; }
          .dark-scene .box-st2, .dark-scene .box-st5, .dark-scene .box-st6, 
          .dark-scene .box-st11 { fill: #1E293B; }

          /* Box Glow */
          .dark-scene .box-st4, .dark-scene .box-st9 { fill: ${themeColor} }

          /* Lodge Colors */
          /* Bright Warm Windows */
          .dark-scene .lodge-st1, .dark-scene .lodge-st8, .dark-scene .lodge-st14, .dark-scene .lodge-st16, 
          .dark-scene .lodge-st18, .dark-scene .lodge-st19, .dark-scene .lodge-st20, .dark-scene .lodge-st25, 
          .dark-scene .lodge-st29, .dark-scene .lodge-st35, .dark-scene .lodge-st36, .dark-scene .lodge-st4 { fill: #FEF08A; }
          
          /* Dark Shadows / Side Wood */
          .dark-scene .lodge-st2, .dark-scene .lodge-st3, .dark-scene .lodge-st6, .dark-scene .lodge-st7, 
          .dark-scene .lodge-st9, .dark-scene .lodge-st10, .dark-scene .lodge-st12, .dark-scene .lodge-st17, 
          .dark-scene .lodge-st22, .dark-scene .lodge-st24, .dark-scene .lodge-st26, .dark-scene .lodge-st28, 
          .dark-scene .lodge-st31, .dark-scene .lodge-st34, .dark-scene .lodge-st37 { fill: #132763; }
          
          /* Front Wood */
          .dark-scene .lodge-st0, .dark-scene .lodge-st5, .dark-scene .lodge-st11, .dark-scene .lodge-st13, 
          .dark-scene .lodge-st15, .dark-scene .lodge-st21, .dark-scene .lodge-st23, .dark-scene .lodge-st27, 
          .dark-scene .lodge-st30, .dark-scene .lodge-st38 { fill: #56531C; }
          
          /* Roof */
          .dark-scene .lodge-st32, .dark-scene .lodge-st33 { fill: #1E293B; }

          .jp-cloud-1 { animation: jp-cloud-drift 140s linear infinite; }
          .jp-cloud-2 { animation: jp-cloud-drift 180s linear infinite; }
          .jp-cloud-3 { animation: jp-cloud-drift 160s linear infinite; }
          .jp-cloud-4 { animation: jp-cloud-drift 200s linear infinite; }

          @keyframes jp-cloud-drift {
            from { transform: translateX(0); }
            to { transform: translateX(-2400px); }
          }

          /* Animations */
          @keyframes jp-fade-pulse {
            0%, 100% { opacity: 0.1; }
            50% { opacity: 1; }
          }

          .jp-meteor-anim {
            animation-name: jp-meteor-fall;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
            opacity: 0;
          }

          @keyframes jp-meteor-fall {
            0% { transform: translate(0, 0); opacity: 0; }
            5% { opacity: 1; }
            80% { opacity: 1; }
            /* Fall to the dynamic X, but keep the constant Y depth */
            100% { transform: translate(var(--end-x), 450px); opacity: 0; } 
          }

          .jp-bird-fly-ltr {
            animation-name: jp-flight-pan-ltr;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }

          @keyframes jp-flight-pan-ltr {
            from { transform: translateX(0); }
            to { transform: translateX(2400px); }
          }

          .jp-bird-swoop {
            animation: jp-bird-swoop-anim ease-in-out infinite;
          }
          @keyframes jp-bird-swoop-anim {
            0%   { transform: translateY(0px); }
            25%  { transform: translateY(-15px); }
            50%  { transform: translateY(5px); }
            75%  { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }

          .jp-bird-flap {
            animation: jp-bird-flap-anim ease-in-out infinite alternate;
            transform-origin: 10px 7px;
          }
          @keyframes jp-bird-flap-anim {
            0% { transform: scaleY(1); }
            100% { transform: scaleY(0.3); }
          }

          .jp-cloud-1 { animation: jp-cloud-drift 140s linear infinite; }
          .jp-cloud-2 { animation: jp-cloud-drift 180s linear infinite; }
          .jp-cloud-3 { animation: jp-cloud-drift 160s linear infinite; }
          .jp-cloud-4 { animation: jp-cloud-drift 200s linear infinite; }

          @keyframes jp-cloud-drift {
            from { transform: translateX(0); }
            to { transform: translateX(-2400px); }
          }

          .jp-particle {
            animation-name: jp-float-particle;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
            animation-direction: alternate;
          }

          @keyframes jp-float-particle {
            0% { transform: translateY(0px) translateX(0px); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: translateY(-15px) translateX(10px); opacity: 0; }
          }

          .jp-beam-pulse {
            animation: jp-beam 2s infinite alternate ease-in-out;
          }

          @keyframes jp-beam {
            0% { opacity: 0.2; }
            100% { opacity: 0.9; }
          }

          .jp-hover-app {
            animation: jp-hover 3s infinite alternate ease-in-out;
            transform-box: fill-box;
            transform-origin: center;
          }

          @keyframes jp-hover {
            0% { transform: translateY(0px); opacity: 0.6; }
            100% { transform: translateY(-4px); opacity: 1; }
          }
        `}</style>
        </svg>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Scene router — picks dark or light variant based on colour scheme         */
/* -------------------------------------------------------------------------- */

export function JobProgress({
  job,
  color
}: {
  job?: JobProgressData
  color: string
}) {
  return (
    <>
      {/* Dark mode scene */}
      <div className="hidden dark:block">
        <JobProgressDark job={job} color={color} />
      </div>
      {/* Light mode scene */}
      <div className="block dark:hidden">
        <JobProgressSummer job={job} color={color} />
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Shared banner layout                                                       */
/* -------------------------------------------------------------------------- */

function AlertBanner({
  icon: Icon,
  color,
  label,
  description,
  details,
  children
}: {
  icon: LucideIcon
  color: string
  label: string
  description: string
  details?: React.ReactNode
  children?: React.ReactNode
}) {
  const hasScene = !!children
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-l-4 ${hasScene ? "min-h-[10rem] sm:min-h-[12rem] dark:bg-[#0B132B]" : ""}`}
      style={{
        borderColor: `${color}30`,
        borderLeftColor: color,
        background: hasScene
          ? undefined
          : `linear-gradient(to right, ${color}10, ${color}05)`
      }}
    >
      {children}
      <div className="relative z-10 flex items-start gap-3 px-4 py-4">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: hasScene ? `${color}50` : `${color}20` }}
        >
          <Icon
            className="size-4"
            style={{ color: hasScene ? "#FFF" : color }}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2.5">
          <div>
            <p
              className={`text-sm font-semibold leading-none ${hasScene ? "text-gray-900 dark:text-white" : ""}`}
            >
              {label}
            </p>
            <p
              className={`mt-1 text-xs font-medium ${hasScene ? "text-gray-700 dark:text-white/70" : "text-muted-foreground"}`}
            >
              {description}
            </p>
            {details}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatGiB(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0.00"
  return (bytes / 1024 / 1024 / 1024).toFixed(2)
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface AppAlertsProps {
  app: InstalledApp
  cylo?: CyloDetail
  job?: JobProgressData
  showPayloadMessage?: boolean
}

export function AppAlerts({
  app,
  cylo,
  job,
  showPayloadMessage = false
}: AppAlertsProps) {
  const t = useTranslations("appboxmanager.appDetail")
  const cyloT = useTranslations("appboxmanager.cyloDetail")

  /* ── Appbox suspended banner (takes priority) ── */
  if (cylo?.status === "suspended") {
    return (
      <AlertBanner
        icon={Ban}
        color="#f59e0b"
        label="Appbox Suspended"
        description={`${cylo.name} has been suspended. All apps on this appbox are currently unavailable. Please contact support or check your billing status.`}
      />
    )
  }

  if (cylo?.is_migrating) {
    const progress = cylo.migration_progress
    const totalBytes = Number(progress?.pre_migration_space_used ?? 0)
    const transferredBytes = Number(progress?.total_sent ?? 0)
    const transferPercent = Number(progress?.transferred_percent ?? 0)
    const transferComplete = progress?.phase === 5 && transferPercent >= 100
    const migrationStatusText = transferComplete
      ? "Installing apps on new server"
      : progress
        ? cyloT(MIGRATION_PHASE_KEYS[progress.phase] ?? "migrationPhase5")
        : "Migration is in progress..."

    return (
      <MigrationAlert
        title={cyloT("migrationProgress")}
        description={migrationStatusText}
        phase={progress ? migrationStatusText : undefined}
        progress={progress?.complete}
        from={progress?.old_server_name}
        to={progress?.new_server_name}
        eta={transferComplete ? undefined : (progress?.ETA ?? undefined)}
        live={progress ? progress.live_migration === 1 : undefined}
        transferredText={
          progress &&
          !transferComplete &&
          progress.phase === 5 &&
          totalBytes > 0
            ? cyloT("migrationTransferred", {
                sent: formatGiB(transferredBytes),
                total: formatGiB(totalBytes)
              })
            : undefined
        }
        reason={formatMigrationReason(progress?.reason) ?? undefined}
        liveMessage={cyloT("migrationLive")}
        offlineMessage={cyloT("migrationOffline")}
        fallbackMessage="Migration is in progress..."
        scene={<JobProgress job={undefined} color="#3b82f6" />}
      />
    )
  }

  /* ── Live job banner — takes priority over status-derived banners ── */
  if (job) {
    // Inherit the colour/icon from the transitional state if applicable,
    // otherwise fall back to the generic purple "running" style.
    const config = STATE_CONFIG[app.status]
    const color = config?.color ?? "#8b5cf6"
    const Icon = config?.icon ?? Zap
    const label = config?.label ?? "Running"
    return (
      <AlertBanner
        icon={Icon}
        color={color}
        label={label}
        description={
          getTransitionalDescription(app, job, showPayloadMessage, t) ??
          job.status ??
          `A job is currently running on ${app.display_name}.`
        }
      >
        <JobProgress job={job} color={color} />
      </AlertBanner>
    )
  }

  /* ── App-level transitional state banners (no live job) ── */
  const config = STATE_CONFIG[app.status]

  if (config) {
    const { color, icon, label, description, showProgress } = config
    const descriptionText =
      getTransitionalDescription(app, undefined, showPayloadMessage, t) ??
      description(app)
    return (
      <AlertBanner
        icon={icon}
        color={color}
        label={label}
        description={descriptionText}
      >
        {showProgress && <JobProgress job={undefined} color={color} />}
      </AlertBanner>
    )
  }

  return null
}
