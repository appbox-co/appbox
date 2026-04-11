"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { BorderBeam } from "@/components/ui/border-beam"
import { cn } from "@/lib/utils"
import type { ScreenshotsBlock as ScreenshotsBlockType } from "@/types/marketing-blocks"

interface ScreenshotsBlockProps {
  block: ScreenshotsBlockType
}

function resolveScreenshotUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src
  }
  return `https://api.appbox.co/assets/images/apps/${src}`
}

/** Deterministic 0–180° phase offset per screenshot; stable across SSR and client. */
function beamPhaseOffset(src: string, index: number): number {
  let h = 0
  for (let i = 0; i < src.length; i++) {
    h = (Math.imul(31, h) + src.charCodeAt(i)) | 0
  }
  const t = Math.sin(index * 12.9898 + h * 0.001) * 43758.5453
  return (t - Math.floor(t)) * 180
}

const imageVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1] as const
    }
  })
}

export function ScreenshotsBlock({ block }: ScreenshotsBlockProps) {
  const imageCount = block.images.length
  const offsets = useMemo(
    () => block.images.map((img, i) => beamPhaseOffset(img.src, i)),
    [block.images]
  )
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [direction, setDirection] = useState(0)

  const open = (i: number) => {
    setDirection(0)
    setLightboxIndex(i)
  }

  const close = useCallback(() => setLightboxIndex(null), [])

  const goPrev = useCallback(() => {
    setDirection(-1)
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + imageCount) % imageCount : null
    )
  }, [imageCount])

  const goNext = useCallback(() => {
    setDirection(1)
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % imageCount : null))
  }, [imageCount])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowRight") goNext()
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [lightboxIndex, close, goPrev, goNext])

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir === 0 ? 0 : dir > 0 ? 300 : -300,
      opacity: 0
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0
    })
  }

  return (
    <section className="py-16">
      {block.title && (
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center font-heading text-4xl font-bold tracking-tight sm:text-5xl"
        >
          {block.title}
        </motion.h2>
      )}

      <div
        className={cn(
          "grid gap-6",
          imageCount === 1 && "grid-cols-1",
          imageCount === 2 && "grid-cols-1 md:grid-cols-2",
          imageCount >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {block.images.map((image, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={imageVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="group relative cursor-pointer rounded-xl p-2"
            onClick={() => open(i)}
          >
            <BorderBeam
              duration={10 + i * 4}
              delay={i * 2 - (offsets[i] / 360) * (10 + i * 4)}
              colorFrom="#6366f1"
              colorTo="#a78bfa"
              borderWidth={2}
            />
            <BorderBeam
              duration={10 + i * 4}
              delay={i * 2 - ((offsets[i] + 180) / 360) * (10 + i * 4)}
              colorFrom="#f97316"
              colorTo="#facc15"
              borderWidth={2}
            />

            <div className="bg-muted relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={resolveScreenshotUrl(image.src)}
                alt={image.alt || "App screenshot"}
                fill
                className="object-contain"
                sizes={
                  imageCount === 1
                    ? "100vw"
                    : imageCount === 2
                      ? "(max-width: 768px) 100vw, 50vw"
                      : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                }
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={close}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <button
              onClick={(e) => {
                e.stopPropagation()
                close()
              }}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white/80 transition-colors hover:bg-black/60 hover:text-white"
            >
              <X className="size-5" />
            </button>

            {imageCount > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goPrev()
                  }}
                  className="absolute left-4 z-10 rounded-full bg-black/40 p-2.5 text-white/80 transition-colors hover:bg-black/60 hover:text-white"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goNext()
                  }}
                  className="absolute right-4 z-10 rounded-full bg-black/40 p-2.5 text-white/80 transition-colors hover:bg-black/60 hover:text-white"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}

            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={lightboxIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.25,
                  ease: [0.25, 0.4, 0.25, 1] as const
                }}
                className="relative mx-auto aspect-video w-[90vw] max-w-5xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={resolveScreenshotUrl(block.images[lightboxIndex].src)}
                  alt={block.images[lightboxIndex].alt || "App screenshot"}
                  fill
                  className="rounded-lg object-contain"
                  sizes="90vw"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {imageCount > 1 && (
              <div className="absolute bottom-6 z-10 flex gap-2">
                {block.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation()
                      setDirection(i > lightboxIndex! ? 1 : -1)
                      setLightboxIndex(i)
                    }}
                    className={cn(
                      "size-2 rounded-full transition-all",
                      i === lightboxIndex
                        ? "scale-125 bg-white"
                        : "bg-white/40 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
