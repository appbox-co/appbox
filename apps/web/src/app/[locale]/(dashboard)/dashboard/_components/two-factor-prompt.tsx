"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { ShieldCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

const DISMISS_SESSION_KEY = "appbox-2fa-prompt-dismissed"

interface TwoFactorPromptProps {
  className?: string
}

export function TwoFactorPrompt({ className }: TwoFactorPromptProps) {
  const t = useTranslations("dashboard")
  const [dismissed, setDismissed] = useState(true) // Start hidden to prevent flash

  useEffect(() => {
    queueMicrotask(() =>
      setDismissed(sessionStorage.getItem(DISMISS_SESSION_KEY) === "true")
    )
  }, [])

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem(DISMISS_SESSION_KEY, "true")
  }

  if (dismissed) return null

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
            <ShieldCheck className="size-6 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              {t("twoFactor.title")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("twoFactor.description")}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" asChild>
                <Link href={ROUTES.TWO_FACTOR_SETUP}>
                  {t("twoFactor.enable")}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-muted-foreground"
              >
                {t("twoFactor.dismiss")}
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
