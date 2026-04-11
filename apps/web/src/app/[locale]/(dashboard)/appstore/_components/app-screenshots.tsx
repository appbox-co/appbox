"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import type { ScreenshotImage, ScreenshotsBlock } from "@/types/marketing-blocks"
import { cn } from "@/lib/utils"

const SCREENSHOT_BASE_URL = "https://api.appbox.co/assets/images/apps/"

interface AppScreenshotsProps {
  marketingContent: unknown
}

function resolveUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src
  return `${SCREENSHOT_BASE_URL}${src}`
}

function extractScreenshots(raw: unknown): ScreenshotImage[] {
  let blocks = raw
  if (typeof blocks === "string") {
    try {
      blocks = JSON.parse(blocks)
    } catch {
      return []
    }
  }
  if (!Array.isArray(blocks)) return []

  return blocks
    .filter(
      (b): b is ScreenshotsBlock =>
        typeof b === "object" && b !== null && b.type === "screenshots"
    )
    .flatMap((b) => b.images)
}

export function AppScreenshots({ marketingContent }: AppScreenshotsProps) {
  const images = useMemo(
    () => extractScreenshots(marketingContent),
    [marketingContent]
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth
      const scrollable = maxScroll > 1 && el.scrollLeft < maxScroll - 1
      setCanScrollRight(scrollable)
      el.classList.toggle("mask-fade-right", scrollable)
    }

    const timer = setTimeout(update, 50)
    el.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)

    return () => {
      clearTimeout(timer)
      el.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [images])

  const close = useCallback(() => setLightboxIndex(null), [])

  const goPrev = useCallback(() => {
    setDirection(-1)
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + images.length) % images.length : null
    )
  }, [images.length])

  const goNext = useCallback(() => {
    setDirection(1)
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % images.length : null
    )
  }, [images.length])

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

  if (images.length === 0) return null

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
    <>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex justify-center gap-3 overflow-x-auto pb-2 scroll-smooth scrollbar-thin"
        >
          {images.map((image, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setDirection(0)
                setLightboxIndex(i)
              }}
              className="group relative aspect-video w-80 shrink-0 overflow-hidden rounded-lg border bg-muted ring-primary/50 transition-all hover:ring-2 focus-visible:outline-none focus-visible:ring-2"
            >
              <Image
                src={resolveUrl(image.src)}
                alt={image.alt || "Screenshot"}
                fill
                className="object-contain transition-transform group-hover:scale-[1.02]"
                sizes="320px"
              />
            </button>
          ))}
        </div>

        <div
          className={`scroll-indicator-arrow pointer-events-none ${canScrollRight ? "visible pulsing" : ""}`}
          style={{ zIndex: 10 }}
        >
          <ChevronRight
            className="text-foreground/70"
            style={{ width: 28, height: 28 }}
          />
        </div>
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

            {images.length > 1 && (
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
                transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
                className="relative mx-auto aspect-video w-[90vw] max-w-5xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={resolveUrl(images[lightboxIndex].src)}
                  alt={images[lightboxIndex].alt || "Screenshot"}
                  fill
                  className="rounded-lg object-contain"
                  sizes="90vw"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {images.length > 1 && (
              <div className="absolute bottom-6 z-10 flex gap-2">
                {images.map((_, i) => (
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
    </>
  )
}
