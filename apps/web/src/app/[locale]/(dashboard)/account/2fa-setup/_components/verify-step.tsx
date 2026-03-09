"use client"

import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from "@/components/ui/input-otp"

/* -------------------------------------------------------------------------- */
/*  Verify Step                                                                */
/* -------------------------------------------------------------------------- */

interface VerifyStepProps {
  onVerify: (code: string) => Promise<void>
  onBack: () => void
  isPending: boolean
}

export function VerifyStep({ onVerify, onBack, isPending }: VerifyStepProps) {
  const t = useTranslations("account")

  function handleChange(value: string) {
    if (value.length === 6) {
      onVerify(value)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("twoFactor.enterCode")}
      </p>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          onChange={handleChange}
          disabled={isPending}
          autoFocus
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {isPending && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("twoFactor.verify")}...
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={isPending}
        >
          {t("twoFactor.back")}
        </Button>
      </div>
    </div>
  )
}
