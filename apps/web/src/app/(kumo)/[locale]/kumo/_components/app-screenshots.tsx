"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button, cn, Dialog } from "@cloudflare/kumo"
import {
  ArrowsOutSimpleIcon,
  CaretLeftIcon,
  CaretRightIcon,
  XIcon
} from "@phosphor-icons/react"
import type {
  ScreenshotImage,
  ScreenshotsBlock
} from "@/types/marketing-blocks"

const SCREENSHOT_BASE_URL = "https://api.appbox.co/assets/images/apps/"

const COPY = {
  heading: "Screenshots",
  screenshot: "Screenshot",
  position: (index: number, total: number) => `Screenshot ${index} of ${total}`,
  open: (index: number, total: number) =>
    `View screenshot ${index} of ${total} full size`,
  show: (index: number, total: number) =>
    `Show screenshot ${index} of ${total}`,
  counter: (index: number, total: number) => `${index} of ${total}`,
  expand: "View full size",
  previous: "Previous screenshot",
  next: "Next screenshot",
  close: "Close"
} as const

export function screenshotUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src
  return `${SCREENSHOT_BASE_URL}${src}`
}

/**
 * File names of screenshots that show Appbox itself (the store listing, the
 * installed app's overview, its ports) rather than the app. A guess from how
 * the catalogue names its files today; a flag on the image would be better.
 */
const APPBOX_SHOT =
  /(appbox-overview|appbox-store|appbox-ports|appstore|installed-overview|install-modal|overview-ssh|ports-tab)/i

/** The app's own screens first, pictures of Appbox after; otherwise catalogue order. */
function appShotsFirst(images: ScreenshotImage[]): ScreenshotImage[] {
  const own = images.filter((image) => !APPBOX_SHOT.test(image.src))
  const appbox = images.filter((image) => APPBOX_SHOT.test(image.src))
  return [...own, ...appbox]
}

/**
 * Screenshots live in the app's marketing blocks, which may arrive as JSON
 * text. The first one returned is the app's cover image.
 */
export function extractScreenshots(raw: unknown): ScreenshotImage[] {
  let blocks = raw
  if (typeof blocks === "string") {
    try {
      blocks = JSON.parse(blocks)
    } catch {
      return []
    }
  }
  if (!Array.isArray(blocks)) return []

  return appShotsFirst(
    blocks
      .filter(
        (block): block is ScreenshotsBlock =>
          typeof block === "object" &&
          block !== null &&
          block.type === "screenshots" &&
          Array.isArray(block.images)
      )
      .flatMap((block) => block.images)
  )
}

interface AppScreenshotsProps {
  images: ScreenshotImage[]
  appName: string
}

/**
 * The app page's lead: one large screenshot with a strip of thumbnails under
 * it, the arrangement Steam and the Shopify App Store use for landscape
 * product shots. The stage is a native scroll-snap row, so it swipes on touch
 * and trackpads; buttons, thumbnails and the full-size viewer all move it.
 */
export function AppScreenshots({ images, appName }: AppScreenshotsProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const thumbsRef = useRef<HTMLUListElement>(null)
  // Follows the stage's scroll position, which is the single source of truth.
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const count = images.length
  const active = Math.min(index, Math.max(0, count - 1))

  // Keep the selected thumbnail in view without scrolling the page.
  useEffect(() => {
    const strip = thumbsRef.current
    const thumb = strip?.children[active] as HTMLElement | undefined
    if (!strip || !thumb) return
    strip.scrollTo({
      left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2
    })
  }, [active])

  if (count === 0) return null

  const altFor = (image: ScreenshotImage) =>
    image.alt || `${appName} ${COPY.screenshot.toLowerCase()}`

  /** Wraps at both ends. Only single steps animate; longer jumps land at once. */
  const go = (target: number, instant = false) => {
    const stage = stageRef.current
    const next = (target + count) % count
    const slide = stage?.children[next] as HTMLElement | undefined
    if (!stage || !slide) return
    const smooth =
      !instant &&
      Math.abs(next - active) === 1 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    stage.scrollTo({
      left: slide.offsetLeft,
      behavior: smooth ? "smooth" : "instant"
    })
  }

  const syncIndex = () => {
    const stage = stageRef.current
    if (!stage || stage.clientWidth === 0) return
    // scrollLeft runs negative in right-to-left layouts.
    const position = Math.round(Math.abs(stage.scrollLeft) / stage.clientWidth)
    setIndex(Math.max(0, Math.min(count - 1, position)))
  }

  const current = images[active]

  return (
    <section className="grid grid-cols-1 gap-3">
      <h2 className="sr-only">{COPY.heading}</h2>
      <p className="sr-only" aria-live="polite">
        {count > 1 ? COPY.position(active + 1, count) : ""}
      </p>

      <div className="relative">
        <div
          ref={stageRef}
          onScroll={syncIndex}
          className="no-scrollbar relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-lg bg-kumo-tint ring ring-kumo-line"
        >
          {images.map((image, position) => (
            <button
              key={`${image.src}-${position}`}
              type="button"
              // Mouse and touch only: the thumbnails and the expand button are
              // the keyboard route, so the stage adds no extra tab stops.
              tabIndex={-1}
              aria-label={COPY.open(position + 1, count)}
              onClick={() => setOpen(true)}
              className="relative aspect-video w-full shrink-0 cursor-zoom-in snap-center"
            >
              <Image
                src={screenshotUrl(image.src)}
                alt={altFor(image)}
                fill
                sizes="(min-width: 1024px) 1000px, 100vw"
                // The first screenshot is the largest image on the page. Its
                // neighbours load ahead so a swipe never lands on a blank slide.
                loading={Math.abs(position - active) <= 1 ? "eager" : "lazy"}
                fetchPriority={position === 0 ? "high" : "auto"}
                className="object-contain"
              />
            </button>
          ))}
        </div>

        <Button
          size="sm"
          shape="square"
          icon={ArrowsOutSimpleIcon}
          aria-label={COPY.expand}
          onClick={() => setOpen(true)}
          className="absolute end-3 top-3 shadow-xs"
        />

        {/* Small screens swipe instead. */}
        {count > 1 && (
          <>
            <Button
              shape="square"
              icon={<CaretLeftIcon className="rtl:rotate-180" />}
              aria-label={COPY.previous}
              onClick={() => go(active - 1)}
              className="absolute start-3 top-1/2 hidden -translate-y-1/2 shadow-xs sm:inline-flex"
            />
            <Button
              shape="square"
              icon={<CaretRightIcon className="rtl:rotate-180" />}
              aria-label={COPY.next}
              onClick={() => go(active + 1)}
              className="absolute end-3 top-1/2 hidden -translate-y-1/2 shadow-xs sm:inline-flex"
            />
          </>
        )}
      </div>

      {count > 1 && (
        // The padding leaves room for the selection ring and focus outline.
        <ul
          ref={thumbsRef}
          className="no-scrollbar relative -m-1 flex list-none gap-2 overflow-x-auto p-1"
        >
          {images.map((image, position) => {
            const selected = position === active
            return (
              <li key={`${image.src}-${position}`} className="shrink-0">
                <button
                  type="button"
                  aria-label={COPY.show(position + 1, count)}
                  aria-current={selected ? "true" : undefined}
                  onClick={() => go(position)}
                  className={cn(
                    "relative block aspect-video w-24 overflow-hidden rounded-md bg-kumo-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kumo-brand sm:w-32",
                    selected
                      ? "ring-2 ring-kumo-brand"
                      : "opacity-60 ring ring-kumo-line hover:opacity-100"
                  )}
                >
                  <Image
                    src={screenshotUrl(image.src)}
                    alt=""
                    fill
                    sizes="128px"
                    // Sits directly under the stage, so never worth deferring.
                    loading="eager"
                    className="object-cover"
                  />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        {/* As wide as the screen allows while the whole screenshot still fits its height. */}
        <Dialog
          size="xl"
          className="p-4 sm:top-8 sm:w-[min(96rem,calc(100vw_-_2rem),calc((100dvh_-_15rem)_*_16_/_9_+_2rem))]"
        >
          {/* Arrow keys page through the screenshots while the viewer has focus. */}
          <div
            className="grid grid-cols-1 gap-3"
            onKeyDown={(event) => {
              if (count < 2) return
              const forward =
                getComputedStyle(event.currentTarget).direction === "rtl"
                  ? "ArrowLeft"
                  : "ArrowRight"
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                go(active + (event.key === forward ? 1 : -1), true)
              }
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <Dialog.Title className="min-w-0 truncate text-base font-semibold">
                {appName}
                {count > 1 && (
                  <span className="font-normal text-kumo-subtle">
                    {" · "}
                    {COPY.counter(active + 1, count)}
                  </span>
                )}
              </Dialog.Title>
              <Dialog.Close
                render={
                  <Button
                    variant="ghost"
                    shape="square"
                    icon={XIcon}
                    aria-label={COPY.close}
                  />
                }
              />
            </div>

            <div className="relative aspect-video overflow-hidden rounded-lg bg-kumo-tint">
              {current && (
                <Image
                  src={screenshotUrl(current.src)}
                  alt={altFor(current)}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              )}
            </div>

            {(current?.caption || count > 1) && (
              <div className="flex min-h-9 items-center justify-between gap-3">
                <Dialog.Description className="min-w-0 text-kumo-subtle">
                  {current?.caption || current?.alt || ""}
                </Dialog.Description>
                {count > 1 && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      shape="square"
                      icon={<CaretLeftIcon className="rtl:rotate-180" />}
                      aria-label={COPY.previous}
                      onClick={() => go(active - 1, true)}
                    />
                    <Button
                      shape="square"
                      icon={<CaretRightIcon className="rtl:rotate-180" />}
                      aria-label={COPY.next}
                      onClick={() => go(active + 1, true)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </Dialog>
      </Dialog.Root>
    </section>
  )
}
