"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Check, Copy, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

/* -------------------------------------------------------------------------- */
/*  Backup Codes                                                               */
/* -------------------------------------------------------------------------- */

interface BackupCodesProps {
  codes: string[]
  onDone: () => void
}

export function BackupCodes({ codes, onDone }: BackupCodesProps) {
  const t = useTranslations("account")
  const [copied, setCopied] = useState(false)

  async function copyAll() {
    await navigator.clipboard.writeText(codes.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3">
        <ShieldCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          Two-factor authentication has been enabled!
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">{t("twoFactor.backupCodes")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("twoFactor.backupCodesDescription")}
        </p>
      </div>

      {/* Codes grid */}
      <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/50 p-4">
        {codes.map((code, i) => (
          <code
            key={i}
            className="rounded border bg-background px-3 py-1.5 text-center font-mono text-sm"
          >
            {code}
          </code>
        ))}
      </div>

      {/* Copy all button */}
      <Button variant="outline" onClick={copyAll} className="w-full gap-2">
        {copied ? (
          <>
            <Check className="size-4 text-emerald-500" />
            {t("twoFactor.copied")}
          </>
        ) : (
          <>
            <Copy className="size-4" />
            {t("twoFactor.copyAll")}
          </>
        )}
      </Button>

      <Button onClick={onDone} className="w-full">
        {t("twoFactor.done")}
      </Button>
    </div>
  )
}
