"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react"
import { Heart } from "lucide-react"
import {
  useBlogKudos,
  useCreateBlogKudo
} from "@/api/blog/hooks/use-blog-kudos"
import { cn } from "@/lib/utils"

const BLOG_KUDOS_TOKEN_KEY = "appbox_blog_kudos_token"
const HOVER_CHARGE_MS = 900

function getOrCreateBrowserToken(): string {
  const existing = window.localStorage.getItem(BLOG_KUDOS_TOKEN_KEY)

  if (existing) {
    return existing
  }

  const token =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  window.localStorage.setItem(BLOG_KUDOS_TOKEN_KEY, token)

  return token
}

interface BlogKudosButtonProps {
  slug: string
  className?: string
}

export function BlogKudosButton({ slug, className }: BlogKudosButtonProps) {
  const [token, setToken] = useState<string>()
  const [justActivated, setJustActivated] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hoverProgress, setHoverProgress] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [supportsHover, setSupportsHover] = useState(false)
  const hoverAnimationFrameRef = useRef<number | null>(null)
  const hoverStartRef = useRef<number | null>(null)
  const chargeModeRef = useRef<"hover" | "press" | null>(null)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setToken(getOrCreateBrowserToken())
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)")
    const updateHoverSupport = () => setSupportsHover(mediaQuery.matches)

    updateHoverSupport()

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateHoverSupport)

      return () => {
        mediaQuery.removeEventListener("change", updateHoverSupport)
      }
    }

    mediaQuery.addListener(updateHoverSupport)

    return () => {
      mediaQuery.removeListener(updateHoverSupport)
    }
  }, [])

  const { data, isLoading } = useBlogKudos(slug, token)
  const createKudo = useCreateBlogKudo(slug, token)
  const count = data?.count ?? 0
  const hasKudoed = data?.hasKudoed ?? false

  const clearHoverAnimation = useCallback(() => {
    if (hoverAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverAnimationFrameRef.current)
      hoverAnimationFrameRef.current = null
    }

    hoverStartRef.current = null
    chargeModeRef.current = null
  }, [])

  const submitKudo = useCallback(() => {
    if (!token || createKudo.isPending || hasKudoed) {
      return
    }

    setErrorMessage(null)

    createKudo.mutate(undefined, {
      onSuccess: () => {
        setHoverProgress(1)
        setIsCharging(false)
        chargeModeRef.current = null
        setJustActivated(true)
      },
      onError: (error) => {
        setIsCharging(false)
        setHoverProgress(0)
        chargeModeRef.current = null
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not save your kudos right now."
        )
      }
    })
  }, [createKudo, hasKudoed, token])

  const beginHoverCharge = useCallback(() => {
    if (
      !supportsHover ||
      !token ||
      isLoading ||
      createKudo.isPending ||
      hasKudoed
    ) {
      return
    }

    clearHoverAnimation()
    setErrorMessage(null)
    setHoverProgress(0)
    setIsCharging(true)
    chargeModeRef.current = "hover"

    const tick = (timestamp: number) => {
      if (hoverStartRef.current === null) {
        hoverStartRef.current = timestamp
      }

      const nextProgress = Math.min(
        (timestamp - hoverStartRef.current) / HOVER_CHARGE_MS,
        1
      )

      setHoverProgress(nextProgress)

      if (nextProgress >= 1) {
        clearHoverAnimation()
        setIsCharging(false)
        submitKudo()
        return
      }

      hoverAnimationFrameRef.current = window.requestAnimationFrame(tick)
    }

    hoverAnimationFrameRef.current = window.requestAnimationFrame(tick)
  }, [
    clearHoverAnimation,
    createKudo.isPending,
    hasKudoed,
    isLoading,
    submitKudo,
    supportsHover,
    token
  ])

  const beginPressCharge = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (
        event.pointerType === "mouse" ||
        !token ||
        isLoading ||
        createKudo.isPending ||
        hasKudoed
      ) {
        return
      }

      event.preventDefault()

      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Ignore unsupported capture behavior.
      }

      clearHoverAnimation()
      setErrorMessage(null)
      setHoverProgress(0)
      setIsCharging(true)
      chargeModeRef.current = "press"

      const tick = (timestamp: number) => {
        if (hoverStartRef.current === null) {
          hoverStartRef.current = timestamp
        }

        const nextProgress = Math.min(
          (timestamp - hoverStartRef.current) / HOVER_CHARGE_MS,
          1
        )

        setHoverProgress(nextProgress)

        if (nextProgress >= 1) {
          clearHoverAnimation()
          setIsCharging(false)
          submitKudo()
          return
        }

        hoverAnimationFrameRef.current = window.requestAnimationFrame(tick)
      }

      hoverAnimationFrameRef.current = window.requestAnimationFrame(tick)
    },
    [
      clearHoverAnimation,
      createKudo.isPending,
      hasKudoed,
      isLoading,
      submitKudo,
      token
    ]
  )

  const cancelHoverCharge = useCallback(() => {
    clearHoverAnimation()
    setIsCharging(false)

    if (!hasKudoed && !createKudo.isPending) {
      setHoverProgress(0)
    }
  }, [clearHoverAnimation, createKudo.isPending, hasKudoed])

  const endPressCharge = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse") {
        return
      }

      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // Ignore unsupported capture behavior.
      }

      if (chargeModeRef.current === "press") {
        cancelHoverCharge()
      }
    },
    [cancelHoverCharge]
  )

  useEffect(() => {
    if (!justActivated) {
      return
    }

    const timer = window.setTimeout(() => {
      setJustActivated(false)
    }, 900)

    return () => window.clearTimeout(timer)
  }, [justActivated])

  const isDisabled = !token || isLoading || createKudo.isPending || hasKudoed

  const accessibleLabel = useMemo(() => {
    if (hasKudoed) {
      return `Kudos sent. This post has ${count} kudos.`
    }

    return `Send kudos to this post. Current kudos: ${count}.`
  }, [count, hasKudoed])

  useEffect(() => {
    return () => {
      clearHoverAnimation()
    }
  }, [clearHoverAnimation])

  const currentFillProgress = hasKudoed ? 1 : hoverProgress
  const fillScale = Math.max(0.001, currentFillProgress)

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <button
        type="button"
        aria-label={accessibleLabel}
        aria-pressed={hasKudoed}
        disabled={isDisabled}
        onMouseEnter={beginHoverCharge}
        onMouseLeave={cancelHoverCharge}
        onBlur={cancelHoverCharge}
        onPointerDown={beginPressCharge}
        onPointerUp={endPressCharge}
        onPointerCancel={endPressCharge}
        onPointerLeave={(event) => {
          if (event.pointerType !== "mouse") {
            endPressCharge(event)
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault()
        }}
        onClick={() => {
          if (isDisabled) {
            return
          }
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return
          }

          event.preventDefault()

          if (isDisabled) {
            return
          }

          submitKudo()
        }}
        className={cn(
          "group flex min-w-[128px] select-none flex-col items-center gap-2 transition-all duration-300",
          hasKudoed ? "cursor-default" : "cursor-pointer",
          !isDisabled &&
            !supportsHover &&
            "hover:scale-105 focus-visible:scale-105",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
        style={{
          WebkitTapHighlightColor: "transparent",
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          touchAction: "manipulation"
        }}
      >
        <span
          className={cn(
            "relative flex size-[4.5rem] items-center justify-center rounded-full border-2 transition-all duration-300",
            hasKudoed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-foreground/80 bg-background text-foreground",
            justActivated &&
              "scale-[1.16] shadow-[0_0_28px_rgba(255,255,255,0.18)]",
            isCharging && "scale-[1.05]"
          )}
        >
          <Heart className="size-10 text-current/95" strokeWidth={1.8} />
          <Heart
            className={cn(
              "absolute size-10 fill-current stroke-current",
              isCharging
                ? "transition-none"
                : "transition-transform duration-200 ease-out",
              justActivated && "scale-[1.22]"
            )}
            style={{
              transform: `scale(${fillScale})`
            }}
          />
          <span
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full border-2 border-primary/50 opacity-0",
              justActivated && "scale-[1.14] animate-ping opacity-100"
            )}
          />
          <span
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300",
              justActivated && "opacity-100"
            )}
            style={{
              boxShadow: "0 0 24px rgba(255,255,255,0.24)"
            }}
          />
        </span>

        <span className="flex flex-col items-center leading-none">
          <span className="text-2xl font-semibold tracking-tight">
            {count.toLocaleString()}
          </span>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {hasKudoed ? "Kudo sent" : "Kudos"}
          </span>
        </span>
      </button>

      {errorMessage ? (
        <p className="mt-2 max-w-52 text-xs text-destructive sm:text-right">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
