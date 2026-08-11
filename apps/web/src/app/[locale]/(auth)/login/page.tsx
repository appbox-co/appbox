"use client"

import { useCallback, useState } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"
import { Info, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { Link, useRouter } from "@/i18n/routing"
import { getSafeAuthRedirect } from "@/lib/auth/safe-redirect"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const t = useTranslations("auth.login")
  const router = useRouter()
  const searchParams = useSearchParams()
  const safeRedirect = getSafeAuthRedirect(searchParams.get("redirect"))
  const isAppInstallRedirect = safeRedirect.startsWith("/appstore/app/")

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
      router.replace(safeRedirect)
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
          router.replace("/account/2fa-setup")
        } else {
          router.replace(safeRedirect)
        }
      } catch {
        toast.error(t("error_generic"))
        setOtpValue("")
        setRecoveryCode("")
      } finally {
        setIsLoading(false)
      }
    },
    [router, safeRedirect, t, twoFactorToken]
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
          <h1 className="appbox-display text-4xl font-bold leading-tight tracking-[-0.035em]">
            {t("2fa_title")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
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
              <InputOTPGroup className="gap-1.5">
                <InputOTPSlot className="appbox-otp-slot" index={0} />
                <InputOTPSlot className="appbox-otp-slot" index={1} />
                <InputOTPSlot className="appbox-otp-slot" index={2} />
                <InputOTPSlot className="appbox-otp-slot" index={3} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-1.5">
                <InputOTPSlot className="appbox-otp-slot" index={4} />
                <InputOTPSlot className="appbox-otp-slot" index={5} />
                <InputOTPSlot className="appbox-otp-slot" index={6} />
                <InputOTPSlot className="appbox-otp-slot" index={7} />
              </InputOTPGroup>
            </InputOTP>

            {isLoading && (
              <div
                aria-live="polite"
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
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
              <InputOTPGroup className="gap-1.5">
                <InputOTPSlot className="appbox-otp-slot" index={0} />
                <InputOTPSlot className="appbox-otp-slot" index={1} />
                <InputOTPSlot className="appbox-otp-slot" index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-1.5">
                <InputOTPSlot className="appbox-otp-slot" index={3} />
                <InputOTPSlot className="appbox-otp-slot" index={4} />
                <InputOTPSlot className="appbox-otp-slot" index={5} />
              </InputOTPGroup>
            </InputOTP>

            {isLoading && (
              <div
                aria-live="polite"
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                {t("2fa_submit")}...
              </div>
            )}
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={toggleRecoveryMode}
            className="appbox-text-link inline-flex text-sm"
          >
            {useRecoveryCode
              ? "Use authenticator app instead"
              : "Lost access to your authenticator? Use a recovery code"}
          </button>
        </div>

        <Button
          type="button"
          variant="appboxOutline"
          className="h-11 w-full"
          onClick={() => {
            setShowTwoFactor(false)
            setTwoFactorToken("")
            setOtpValue("")
            setRecoveryCode("")
            setUseRecoveryCode(false)
          }}
        >
          {t("2fa_back")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="appbox-display text-4xl font-bold leading-tight tracking-[-0.035em]">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {isAppInstallRedirect && (
        <Alert className="appbox-cut-surface appbox-subcard [--marketing-cut-size:9px]">
          <Info className="size-4 text-[var(--appbox-signal)]" />
          <AlertTitle className="font-semibold">
            {t("appbox_required_title")}
          </AlertTitle>
          <AlertDescription className="space-y-2 leading-6 text-muted-foreground">
            <p>{t("appbox_required_description")}</p>
            <Link
              href="/#plans-section"
              className="appbox-text-link inline-flex"
            >
              {t("appbox_required_link")}
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={loginForm.handleSubmit(onLoginSubmit)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold">
            {t("email_label")}
          </Label>
          <div
            className={cn(
              "appbox-field-frame",
              loginForm.formState.errors.email && "appbox-field-frame-error"
            )}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("email_placeholder")}
              aria-invalid={Boolean(loginForm.formState.errors.email)}
              aria-describedby={
                loginForm.formState.errors.email ? "email-error" : undefined
              }
              className="appbox-form-control h-12 px-4"
              {...loginForm.register("email")}
            />
          </div>
          {loginForm.formState.errors.email && (
            <p
              id="email-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {t("email_error")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-semibold">
              {t("password_label")}
            </Label>
            <Link href="/forgot" className="appbox-text-link text-xs">
              {t("forgot_password")}
            </Link>
          </div>
          <div
            className={cn(
              "appbox-field-frame",
              loginForm.formState.errors.password && "appbox-field-frame-error"
            )}
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder={t("password_placeholder")}
              aria-invalid={Boolean(loginForm.formState.errors.password)}
              aria-describedby={
                loginForm.formState.errors.password
                  ? "password-error"
                  : undefined
              }
              className="appbox-form-control h-12 px-4"
              {...loginForm.register("password")}
            />
          </div>
          {loginForm.formState.errors.password && (
            <p
              id="password-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {t("password_error")}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="appboxSignal"
          className="relative h-12 w-full"
          disabled={isLoading}
        >
          {isLoading && (
            <Loader2 className="absolute left-4 h-4 w-4 animate-spin motion-reduce:animate-none" />
          )}
          {t("submit")}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        {t("external_signup")}{" "}
        <Link href="/#plans-section" className="appbox-text-link">
          {t("external_signup_link")}
        </Link>
      </p>
    </div>
  )
}
