"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react"
import { useTranslations } from "next-intl"
import { Badge, Banner, Button, Loader } from "@cloudflare/kumo"
import {
  ArrowsClockwiseIcon,
  WarningCircleIcon,
  WarningIcon
} from "@phosphor-icons/react"
import { useInstalledAppVncInfo } from "@/api/installed-apps/hooks/use-installed-apps"
import { Panel } from "../ui/panel"
import { CHAR_TO_KEY, MODIFIER_RELEASES, SHIFT_KEYSYM } from "./console-keys"

interface AppConsoleProps {
  instanceId: number
  serverName: string
  appState: number
  appEnabled: boolean
}

type ViewerStatus =
  "idle" | "connecting" | "connected" | "disconnected" | "error"

type RfbEvent = Event & {
  detail?: {
    clean?: boolean
    message?: string
  }
}

type RfbPrivateDom = {
  _screen?: HTMLDivElement
}

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "appbox.co"

/** Dot colour of the status badge beside the reconnect button. */
const STATUS_TONE = {
  connecting: "warning",
  connected: "success",
  disconnected: "neutral",
  error: "error"
} as const

/**
 * The noVNC console of a VM app. Same connection, keyboard and paste handling
 * as `AppConsoleTab` in the installed app page; only the frame around the
 * screen differs.
 */
export function AppConsole({
  instanceId,
  serverName,
  appState,
  appEnabled
}: AppConsoleProps) {
  const t = useTranslations("appboxmanager.appDetail")
  const [viewerStatus, setViewerStatus] = useState<ViewerStatus>("idle")
  const [viewerError, setViewerError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const viewerRef = useRef<HTMLDivElement>(null)
  const rfbRef = useRef<InstanceType<
    typeof import("@novnc/novnc").default
  > | null>(null)
  const connectionErrorText = t("consoleConnectionError")

  const canViewConsole = appState === 1 && appEnabled

  const {
    data: vncInfo,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useInstalledAppVncInfo(serverName, instanceId, canViewConsole)

  const websocketUrl = useMemo(() => {
    if (!vncInfo?.websocket_port) return null
    return `wss://${serverName}.${DOMAIN}/vnc-ws/${vncInfo.websocket_port}`
  }, [serverName, vncInfo?.websocket_port])

  const pasteAbortRef = useRef<(() => void) | null>(null)

  const pasteTextAsKeys = useCallback(
    (
      rfb: {
        sendKey(keysym: number, code: string, down: boolean): void
      },
      text: string
    ) => {
      pasteAbortRef.current?.()

      let aborted = false
      pasteAbortRef.current = () => {
        aborted = true
      }

      type KeyEvent = { keysym: number; code: string; down: boolean }
      const events: KeyEvent[] = []

      for (const char of [...text]) {
        const info = CHAR_TO_KEY[char]
        if (!info) continue
        const keysym = info.keysym ?? char.charCodeAt(0)
        for (const [modifierKeysym, modifierCode] of MODIFIER_RELEASES) {
          events.push({
            keysym: modifierKeysym,
            code: modifierCode,
            down: false
          })
        }
        if (info.shift) {
          events.push({ keysym: SHIFT_KEYSYM, code: "ShiftLeft", down: true })
        }
        events.push({ keysym, code: info.code, down: true })
        events.push({ keysym, code: info.code, down: false })
        if (info.shift) {
          events.push({ keysym: SHIFT_KEYSYM, code: "ShiftLeft", down: false })
        }
      }

      for (const [keysym, code] of MODIFIER_RELEASES) {
        events.push({ keysym, code, down: false })
      }

      let eventIndex = 0
      const sendNext = () => {
        if (aborted || rfbRef.current === null) {
          pasteAbortRef.current = null
          return
        }

        const nextEvent = events[eventIndex]
        if (!nextEvent) {
          pasteAbortRef.current = null
          return
        }

        rfb.sendKey(nextEvent.keysym, nextEvent.code, nextEvent.down)
        eventIndex += 1
        setTimeout(sendNext, 6)
      }

      sendNext()
    },
    []
  )

  useEffect(() => {
    if (!canViewConsole || !websocketUrl || !viewerRef.current) {
      setViewerStatus("idle")
      setViewerError(null)
      return
    }

    let cancelled = false
    let removeListeners = () => {}

    const connect = async () => {
      setViewerStatus("connecting")
      setViewerError(null)

      const { default: RFB } = await import("@novnc/novnc")

      if (cancelled || !viewerRef.current) return
      const viewerElement = viewerRef.current

      while (viewerElement.firstChild) {
        viewerElement.removeChild(viewerElement.firstChild)
      }

      const rfb = new RFB(viewerElement, websocketUrl, {
        credentials: { password: vncInfo?.password ?? "" }
      })

      rfb.scaleViewport = false
      rfb.resizeSession = true
      rfb.viewOnly = false
      rfb.focusOnClick = true
      rfbRef.current = rfb
      const privateDom = rfb as unknown as RfbPrivateDom
      if (privateDom._screen) {
        privateDom._screen.style.overflow = "hidden"
      }

      const handleConnect = () => {
        if (cancelled) return
        setViewerStatus("connected")
        setViewerError(null)
        // noVNC sometimes doesn't acquire keyboard focus in nested React layouts
        // until explicit focus is requested once connected.
        requestAnimationFrame(() => {
          rfb.focus()
        })
      }

      const handleDisconnect = (event: Event) => {
        if (rfbRef.current === rfb) {
          rfbRef.current = null
        }
        if (cancelled) return
        const detail = (event as RfbEvent).detail
        if (detail?.clean === false) {
          setViewerStatus("error")
          setViewerError(detail.message ?? connectionErrorText)
          return
        }
        setViewerStatus("disconnected")
      }

      const handleSecurityFailure = () => {
        if (rfbRef.current === rfb) {
          rfbRef.current = null
        }
        if (cancelled) return
        setViewerStatus("error")
        setViewerError(connectionErrorText)
      }

      const handleClipboardShortcut = (event: KeyboardEvent) => {
        const isPasteShortcut =
          (event.metaKey || event.ctrlKey) &&
          !event.altKey &&
          event.key.toLowerCase() === "v"

        if (
          !isPasteShortcut ||
          typeof navigator.clipboard?.readText !== "function"
        ) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        void navigator.clipboard
          .readText()
          .then((text) => {
            if (!text || cancelled || rfbRef.current !== rfb) return
            pasteTextAsKeys(
              rfb as unknown as {
                sendKey(keysym: number, code: string, down: boolean): void
              },
              text
            )
          })
          .catch(() => {
            // Ignore clipboard permission errors and keep the VNC session active.
          })
      }

      rfb.addEventListener("connect", handleConnect)
      rfb.addEventListener("disconnect", handleDisconnect)
      rfb.addEventListener("securityfailure", handleSecurityFailure)
      viewerElement.addEventListener("keydown", handleClipboardShortcut, true)

      removeListeners = () => {
        rfb.removeEventListener("connect", handleConnect)
        rfb.removeEventListener("disconnect", handleDisconnect)
        rfb.removeEventListener("securityfailure", handleSecurityFailure)
        viewerElement.removeEventListener(
          "keydown",
          handleClipboardShortcut,
          true
        )
      }
    }

    connect().catch((err: unknown) => {
      if (cancelled) return
      setViewerStatus("error")
      setViewerError(err instanceof Error ? err.message : connectionErrorText)
    })

    return () => {
      cancelled = true
      pasteAbortRef.current?.()
      removeListeners()
      if (rfbRef.current) {
        const maybeState = (
          rfbRef.current as { _rfb_connection_state?: string }
        )._rfb_connection_state
        try {
          if (maybeState !== "disconnected" && maybeState !== "disconnecting") {
            rfbRef.current.disconnect()
          }
        } catch {
          // ignore disconnect failures during teardown
        } finally {
          rfbRef.current = null
        }
      }
    }
  }, [
    canViewConsole,
    websocketUrl,
    vncInfo?.password,
    retryToken,
    connectionErrorText,
    pasteTextAsKeys
  ])

  const focusConsole = useCallback(() => {
    rfbRef.current?.focus()
  }, [])

  const handleReconnect = () => {
    void refetch()
    setRetryToken((current) => current + 1)
  }

  const statusText = (() => {
    switch (viewerStatus) {
      case "connecting":
        return t("consoleConnecting")
      case "connected":
        return t("consoleConnected")
      case "disconnected":
        return t("consoleDisconnected")
      case "error":
        return t("consoleConnectionError")
      default:
        return ""
    }
  })()

  // The same order of checks as the source's early returns. The screen has to
  // be in the tree exactly when the source's is: the effect above connects on
  // the render in which the WebSocket address first becomes known.
  let toolbar: ReactNode
  let body: ReactNode

  if (!canViewConsole) {
    body = (
      <div className="p-3">
        <Banner
          variant="alert"
          icon={<WarningIcon weight="fill" />}
          title={t("consoleUnavailable")}
        />
      </div>
    )
  } else if (isLoading) {
    body = (
      <div className="flex min-h-80 items-center justify-center gap-2 text-kumo-subtle">
        <Loader size="sm" />
        <span>{t("consoleLoading")}</span>
      </div>
    )
  } else if (isError) {
    body = (
      <div className="p-3">
        <Banner
          variant="error"
          icon={<WarningCircleIcon weight="fill" />}
          title={t("consoleLoadError")}
          description={error instanceof Error ? error.message : undefined}
          action={
            <Banner.Action variant="secondary" onClick={() => void refetch()}>
              {t("consoleReconnect")}
            </Banner.Action>
          }
        />
      </div>
    )
  } else if (!websocketUrl) {
    body = (
      <div className="p-3">
        <Banner
          variant="alert"
          icon={<WarningIcon weight="fill" />}
          title={t("consolePortsMissing")}
        />
      </div>
    )
  } else {
    toolbar = (
      <>
        <span aria-live="polite" className="flex items-center">
          {viewerStatus !== "idle" && (
            <Badge variant={STATUS_TONE[viewerStatus]} appearance="dot">
              {statusText}
            </Badge>
          )}
        </span>
        <Button
          type="button"
          size="sm"
          icon={ArrowsClockwiseIcon}
          loading={viewerStatus === "connecting"}
          disabled={isFetching || viewerStatus === "connecting"}
          onClick={handleReconnect}
        >
          {t("consoleReconnect")}
        </Button>
      </>
    )
    body = (
      <>
        {/* A screen, so black in both themes rather than a surface token. */}
        <div className="relative overflow-hidden bg-black">
          <div
            ref={viewerRef}
            className="min-h-[620px] w-full"
            tabIndex={0}
            onMouseDown={focusConsole}
            onTouchStart={focusConsole}
            onFocus={focusConsole}
          />

          {viewerStatus !== "connected" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 text-white">
              <div className="flex items-center gap-2">
                {viewerStatus === "connecting" ? (
                  <Loader size="sm" />
                ) : (
                  <WarningCircleIcon aria-hidden size={16} />
                )}
                <span>{statusText}</span>
              </div>
            </div>
          )}
        </div>

        {viewerError && (
          <div className="p-3">
            <Banner
              variant="error"
              icon={<WarningCircleIcon weight="fill" />}
              title={t("consoleConnectionError")}
              description={
                viewerError === connectionErrorText ? undefined : viewerError
              }
            />
          </div>
        )}
      </>
    )
  }

  return (
    <Panel title={t("consoleTitle")} flush action={toolbar}>
      {body}
    </Panel>
  )
}
