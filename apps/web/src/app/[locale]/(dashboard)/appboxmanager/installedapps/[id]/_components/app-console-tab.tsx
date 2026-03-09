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
import { AlertCircle, Loader2, RefreshCcw } from "lucide-react"
import { useInstalledAppVncInfo } from "@/api/installed-apps/hooks/use-installed-apps"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AppConsoleTabProps {
  instanceId: number
  serverName: string
  appState: number
  appEnabled: boolean
}

type ViewerStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

type RfbEvent = Event & {
  detail?: {
    clean?: boolean
    message?: string
  }
}

type RfbPrivateDom = {
  _screen?: HTMLDivElement
}

type AlertTone = "warning" | "destructive"

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "appbox.co"
const SHIFT_KEYSYM = 0xffe1

const MODIFIER_RELEASES: Array<[number, string]> = [
  [0xffe1, "ShiftLeft"],
  [0xffe2, "ShiftRight"],
  [0xffe3, "ControlLeft"],
  [0xffe4, "ControlRight"],
  [0xffe9, "AltLeft"],
  [0xffea, "AltRight"],
  [0xffeb, "MetaLeft"],
  [0xffec, "MetaRight"]
]

interface KeyInfo {
  code: string
  shift: boolean
  keysym?: number
}

function ConsoleAlert({
  tone,
  title,
  description,
  action
}: {
  tone: AlertTone
  title: string
  description: string
  action?: ReactNode
}) {
  const isWarning = tone === "warning"

  return (
    <div
      className={
        isWarning
          ? "flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300"
          : "flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
      }
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1 space-y-2">
        <p className="font-medium">{title}</p>
        <p>{description}</p>
        {action}
      </div>
    </div>
  )
}

// Maps characters to their physical key (KeyboardEvent.code) and Shift state
// on the VM's en-us layout. Client keyboard layout is irrelevant because paste
// reads resolved characters from the clipboard, not keyboard events. The code
// values feed into noVNC's QEMU extended key event path, which sends XT
// scancodes directly — bypassing QEMU's unreliable keysym reverse-mapping.
const CHAR_TO_KEY: Record<string, KeyInfo> = {
  "\n": { code: "Enter", shift: false, keysym: 0xff0d },
  "\r": { code: "Enter", shift: false, keysym: 0xff0d },
  "\t": { code: "Tab", shift: false, keysym: 0xff09 },
  " ": { code: "Space", shift: false },
  "!": { code: "Digit1", shift: true },
  '"': { code: "Quote", shift: true },
  "#": { code: "Digit3", shift: true },
  $: { code: "Digit4", shift: true },
  "%": { code: "Digit5", shift: true },
  "&": { code: "Digit7", shift: true },
  "'": { code: "Quote", shift: false },
  "(": { code: "Digit9", shift: true },
  ")": { code: "Digit0", shift: true },
  "*": { code: "Digit8", shift: true },
  "+": { code: "Equal", shift: true },
  ",": { code: "Comma", shift: false },
  "-": { code: "Minus", shift: false },
  ".": { code: "Period", shift: false },
  "/": { code: "Slash", shift: false },
  "0": { code: "Digit0", shift: false },
  "1": { code: "Digit1", shift: false },
  "2": { code: "Digit2", shift: false },
  "3": { code: "Digit3", shift: false },
  "4": { code: "Digit4", shift: false },
  "5": { code: "Digit5", shift: false },
  "6": { code: "Digit6", shift: false },
  "7": { code: "Digit7", shift: false },
  "8": { code: "Digit8", shift: false },
  "9": { code: "Digit9", shift: false },
  ":": { code: "Semicolon", shift: true },
  ";": { code: "Semicolon", shift: false },
  "<": { code: "Comma", shift: true },
  "=": { code: "Equal", shift: false },
  ">": { code: "Period", shift: true },
  "?": { code: "Slash", shift: true },
  "@": { code: "Digit2", shift: true },
  A: { code: "KeyA", shift: true },
  B: { code: "KeyB", shift: true },
  C: { code: "KeyC", shift: true },
  D: { code: "KeyD", shift: true },
  E: { code: "KeyE", shift: true },
  F: { code: "KeyF", shift: true },
  G: { code: "KeyG", shift: true },
  H: { code: "KeyH", shift: true },
  I: { code: "KeyI", shift: true },
  J: { code: "KeyJ", shift: true },
  K: { code: "KeyK", shift: true },
  L: { code: "KeyL", shift: true },
  M: { code: "KeyM", shift: true },
  N: { code: "KeyN", shift: true },
  O: { code: "KeyO", shift: true },
  P: { code: "KeyP", shift: true },
  Q: { code: "KeyQ", shift: true },
  R: { code: "KeyR", shift: true },
  S: { code: "KeyS", shift: true },
  T: { code: "KeyT", shift: true },
  U: { code: "KeyU", shift: true },
  V: { code: "KeyV", shift: true },
  W: { code: "KeyW", shift: true },
  X: { code: "KeyX", shift: true },
  Y: { code: "KeyY", shift: true },
  Z: { code: "KeyZ", shift: true },
  "[": { code: "BracketLeft", shift: false },
  "\\": { code: "Backslash", shift: false },
  "]": { code: "BracketRight", shift: false },
  "^": { code: "Digit6", shift: true },
  _: { code: "Minus", shift: true },
  "`": { code: "Backquote", shift: false },
  a: { code: "KeyA", shift: false },
  b: { code: "KeyB", shift: false },
  c: { code: "KeyC", shift: false },
  d: { code: "KeyD", shift: false },
  e: { code: "KeyE", shift: false },
  f: { code: "KeyF", shift: false },
  g: { code: "KeyG", shift: false },
  h: { code: "KeyH", shift: false },
  i: { code: "KeyI", shift: false },
  j: { code: "KeyJ", shift: false },
  k: { code: "KeyK", shift: false },
  l: { code: "KeyL", shift: false },
  m: { code: "KeyM", shift: false },
  n: { code: "KeyN", shift: false },
  o: { code: "KeyO", shift: false },
  p: { code: "KeyP", shift: false },
  q: { code: "KeyQ", shift: false },
  r: { code: "KeyR", shift: false },
  s: { code: "KeyS", shift: false },
  t: { code: "KeyT", shift: false },
  u: { code: "KeyU", shift: false },
  v: { code: "KeyV", shift: false },
  w: { code: "KeyW", shift: false },
  x: { code: "KeyX", shift: false },
  y: { code: "KeyY", shift: false },
  z: { code: "KeyZ", shift: false },
  "{": { code: "BracketLeft", shift: true },
  "|": { code: "Backslash", shift: true },
  "}": { code: "BracketRight", shift: true },
  "~": { code: "Backquote", shift: true }
}

export function AppConsoleTab({
  instanceId,
  serverName,
  appState,
  appEnabled
}: AppConsoleTabProps) {
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

  if (!canViewConsole) {
    return (
      <ConsoleAlert
        tone="warning"
        title={t("tabConsole")}
        description={t("consoleUnavailable")}
      />
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[320px] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>{t("consoleLoading")}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <ConsoleAlert
        tone="destructive"
        title={t("consoleLoadError")}
        description={
          error instanceof Error ? error.message : t("consoleLoadError")
        }
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => void refetch()}
            className="h-8 border-destructive/30 bg-destructive/10 px-3 text-destructive hover:bg-destructive/20 hover:text-destructive"
          >
            {t("consoleReconnect")}
          </Button>
        }
      />
    )
  }

  if (!websocketUrl) {
    return (
      <ConsoleAlert
        tone="warning"
        title={t("tabConsole")}
        description={t("consolePortsMissing")}
      />
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("consoleTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
          <span className="text-sm text-muted-foreground">{statusText}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleReconnect}
            disabled={isFetching || viewerStatus === "connecting"}
          >
            {viewerStatus === "connecting" ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-1.5 size-4" />
            )}
            {t("consoleReconnect")}
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-md border bg-black">
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
              <div className="flex items-center gap-2 text-sm">
                {viewerStatus === "connecting" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <AlertCircle className="size-4" />
                )}
                <span>{statusText}</span>
              </div>
            </div>
          )}
        </div>

        {viewerError && (
          <ConsoleAlert
            tone="destructive"
            title={t("consoleConnectionError")}
            description={viewerError}
          />
        )}
      </CardContent>
    </Card>
  )
}
