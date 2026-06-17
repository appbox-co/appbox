"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Expand, X } from "lucide-react"
import { resolveSafeScreenshotUrl } from "@/lib/marketing/safe-urls"
import type { AlternativeSectionItem } from "@/types/marketing-blocks"

interface AlternativeScreenshotLightboxProps {
  name: string
  screenshot: NonNullable<AlternativeSectionItem["screenshot"]>
}

export function AlternativeScreenshotLightbox({
  name,
  screenshot
}: AlternativeScreenshotLightboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const resolvedSrc = resolveSafeScreenshotUrl(screenshot.src)

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close()
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [close, isOpen])

  if (!resolvedSrc) return null

  const alt = screenshot.alt || `${name} screenshot`

  return (
    <>
      <figure className="rounded-2xl border border-border/70 bg-muted/30 p-3 shadow-sm">
        <button
          type="button"
          aria-label={`Open larger ${name} screenshot`}
          className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={() => setIsOpen(true)}
        >
          <Image
            src={resolvedSrc}
            alt={alt}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Expand className="size-3.5" />
            Expand
          </span>
        </button>

        {screenshot.caption && (
          <figcaption className="mt-3 text-center text-sm text-muted-foreground">
            {screenshot.caption}
          </figcaption>
        )}
      </figure>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${name} screenshot preview`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={close}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <button
              type="button"
              aria-label="Close screenshot preview"
              onClick={(event) => {
                event.stopPropagation()
                close()
              }}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white/80 transition-colors hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="size-5" />
            </button>

            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative mx-auto aspect-video w-[92vw] max-w-6xl"
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={resolvedSrc}
                alt={alt}
                fill
                className="rounded-lg object-contain"
                sizes="92vw"
                priority
              />
            </motion.div>

            {screenshot.caption && (
              <p className="absolute bottom-6 z-10 max-w-3xl px-4 text-center text-sm text-white/80">
                {screenshot.caption}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
