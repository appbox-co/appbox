"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, AlertTriangle, X } from "lucide-react"
import { use2FAStatus } from "@/api/account/hooks/use-account"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const DISMISS_SESSION_KEY = "appbox-recovery-codes-low-dismissed"

interface RecoveryCodesWarningProps {
  className?: string
}

export function RecoveryCodesWarning({ className }: RecoveryCodesWarningProps) {
  const { data: status, isLoading } = use2FAStatus()
  const [sessionDismissed, setSessionDismissed] = useState(true)

  useEffect(() => {
    queueMicrotask(() =>
      setSessionDismissed(
        sessionStorage.getItem(DISMISS_SESSION_KEY) === "true"
      )
    )
  }, [])

  if (isLoading || !status || !status.enabled) return null

  const isExhausted = status.recovery_codes_exhausted
  const isLow = status.recovery_codes_low && !isExhausted

  if (!isExhausted && (!isLow || sessionDismissed)) return null

  function handleDismiss() {
    setSessionDismissed(true)
    sessionStorage.setItem(DISMISS_SESSION_KEY, "true")
  }

  if (isExhausted) {
    return (
      <Card
        className={cn(
          "relative overflow-hidden border-destructive/40 bg-destructive/5",
          className
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-full bg-destructive/10 p-2.5">
              <AlertCircle className="size-6 text-destructive" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                No recovery codes remaining
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You have no recovery codes left. If you lose access to your
                authenticator app you will be locked out of your account.
                Regenerate new codes now.
              </p>

              <div className="mt-3">
                <Button size="sm" variant="destructive" asChild>
                  <Link href="/account/2fa-setup">
                    Regenerate recovery codes
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-amber-500/30 bg-amber-500/5",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-full bg-amber-500/10 p-2.5">
            <AlertTriangle className="size-6 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Only {status.recovery_codes_remaining} recovery code
              {status.recovery_codes_remaining === 1 ? "" : "s"} remaining
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Recovery codes let you access your account if you lose your
              authenticator app. Regenerate a fresh set before you run out.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" asChild>
                <Link href="/account/2fa-setup">Regenerate codes</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-muted-foreground"
              >
                Remind me later
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
