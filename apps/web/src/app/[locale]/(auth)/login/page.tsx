"use client"

import { useCallback, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { Link } from "@/i18n/routing"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const t = useTranslations("auth.login")
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"

  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState("")
  const [otpValue, setOtpValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState("")
  const RECOVERY_CODE_LENGTH = 8

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  })

  function extractErrorMessage(data: unknown, fallback: string): string {
    if (!data || typeof data !== "object") return fallback
    const obj = data as Record<string, unknown>
    if (typeof obj.error === "string" && obj.error) return obj.error
    if (typeof obj.message === "string" && obj.message) return obj.message
    return fallback
  }

  async function onLoginSubmit(values: LoginValues) {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(extractErrorMessage(data, t("error_invalid")))
        return
      }

      if (data.two_factor_required) {
        setTwoFactorToken(data.two_factor_token || "")
        setShowTwoFactor(true)
        return
      }

      toast.success(t("success"))
      router.push(redirect)
    } catch {
      toast.error(t("error_generic"))
    } finally {
      setIsLoading(false)
    }
  }

  const submitTwoFactor = useCallback(
    async (code: string, isRecovery: boolean) => {
      setIsLoading(true)
      try {
        const res = await fetch("/api/auth/2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            two_factor_token: twoFactorToken,
            code,
            use_recovery: isRecovery
          })
        })

        const data = await res.json()

        if (!res.ok) {
          toast.error(extractErrorMessage(data, t("error_2fa_invalid")))
          setOtpValue("")
          setRecoveryCode("")
          return
        }

        toast.success(t("success"))

        // Redirect to 2FA page if codes are exhausted so the user is forced to
        // regenerate them before they get locked out. For low (but non-zero)
        // codes the dashboard banner will handle the nudge.
        if (data.recovery_codes_exhausted) {
          router.push("/account/2fa-setup")
        } else {
          router.push(redirect)
        }
      } catch {
        toast.error(t("error_generic"))
        setOtpValue("")
        setRecoveryCode("")
      } finally {
        setIsLoading(false)
      }
    },
    [twoFactorToken, redirect, router, t]
  )

  function handleOtpChange(value: string) {
    setOtpValue(value)
    if (value.length === 6) {
      submitTwoFactor(value, false)
    }
  }

  function handleRecoveryChange(value: string) {
    setRecoveryCode(value.toUpperCase())
    if (value.length === RECOVERY_CODE_LENGTH) {
      submitTwoFactor(value.toUpperCase(), true)
    }
  }

  function toggleRecoveryMode() {
    setUseRecoveryCode((prev) => !prev)
    setOtpValue("")
    setRecoveryCode("")
  }

  if (showTwoFactor) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("2fa_title")}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {useRecoveryCode
              ? "Enter one of your recovery codes"
              : t("2fa_description")}
          </p>
        </div>

        {useRecoveryCode ? (
          <div
            className="flex flex-col items-center space-y-4"
            onPaste={(e) => {
              const text = e.clipboardData
                .getData("text")
                .replace(/[^A-Z0-9]/gi, "")
                .toUpperCase()
              if (text.length > 0) {
                e.preventDefault()
                handleRecoveryChange(text.slice(0, RECOVERY_CODE_LENGTH))
              }
            }}
          >
            <InputOTP
              maxLength={RECOVERY_CODE_LENGTH}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              value={recoveryCode}
              onChange={handleRecoveryChange}
              disabled={isLoading}
              autoFocus
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
                <InputOTPSlot index={6} />
                <InputOTPSlot index={7} />
              </InputOTPGroup>
            </InputOTP>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={handleOtpChange}
              disabled={isLoading}
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

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("2fa_submit")}...
              </div>
            )}
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={toggleRecoveryMode}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {useRecoveryCode
              ? "Use authenticator app instead"
              : "Lost access to your authenticator? Use a recovery code"}
          </button>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setShowTwoFactor(false)
            setTwoFactorToken("")
            setOtpValue("")
            setRecoveryCode("")
            setUseRecoveryCode(false)
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("2fa_back")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <form
        onSubmit={loginForm.handleSubmit(onLoginSubmit)}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">{t("email_label")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("email_placeholder")}
            className="h-11"
            {...loginForm.register("email")}
          />
          {loginForm.formState.errors.email && (
            <p className="text-sm text-destructive">{t("email_error")}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password_label")}</Label>
            <Link
              href="/forgot"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("forgot_password")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder={t("password_placeholder")}
            className="h-11"
            {...loginForm.register("password")}
          />
          {loginForm.formState.errors.password && (
            <p className="text-sm text-destructive">{t("password_error")}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="h-11 w-full"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("submit")}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        {t("external_signup")}{" "}
        <Link
          href="/"
          className="text-foreground underline-offset-4 hover:underline"
        >
          appbox.co
        </Link>
      </p>
    </div>
  )
}
