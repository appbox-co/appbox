"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Check, Copy } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"

/* -------------------------------------------------------------------------- */
/*  QR Step                                                                    */
/* -------------------------------------------------------------------------- */

interface QRStepProps {
  provisioningUri: string
  secret: string
  onNext: () => void
}

export function QRStep({ provisioningUri, secret, onNext }: QRStepProps) {
  const t = useTranslations("account")
  const [copied, setCopied] = useState(false)

  async function copySecret() {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("twoFactor.scanQR")}</p>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="rounded-xl border bg-white p-4">
          <QRCodeSVG value={provisioningUri} size={200} />
        </div>
      </div>

      {/* Secret key */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {t("twoFactor.secretKey")}
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm break-all">
            {secret}
          </code>
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            onClick={copySecret}
          >
            {copied ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <Button onClick={onNext} className="w-full">
        {t("twoFactor.next")}
      </Button>
    </div>
  )
}
