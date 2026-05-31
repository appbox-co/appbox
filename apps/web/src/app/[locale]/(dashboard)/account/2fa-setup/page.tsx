"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useQueryClient } from "@tanstack/react-query"
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"
import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldOff
} from "lucide-react"
import { toast } from "sonner"
import {
  use2FAStatus,
  useDisable2FA,
  useGenerate2FA,
  useProfile,
  useRegenerateRecoveryCodes,
  useVerify2FA
} from "@/api/account/hooks/use-account"
import { ApiError } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from "@/components/ui/input-otp"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { useRouter } from "@/i18n/routing"
import { useAuth } from "@/providers/auth-provider"
import { AccountPageHeader } from "../_components/account-page-header"
import {
  isRecentAuthError,
  RecentAuthDialog
} from "../_components/recent-auth-dialog"
import { BackupCodes } from "./_components/backup-codes"
import { QRStep } from "./_components/qr-step"
import { VerifyStep } from "./_components/verify-step"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type SetupStep = "idle" | "generating" | "verifying" | "complete"

function isMissingVerificationCodeError(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 404 &&
    error.message.toLowerCase().includes("verification code is required")
  )
}

/* -------------------------------------------------------------------------- */
/*  Step Indicator                                                             */
/* -------------------------------------------------------------------------- */

function StepIndicator({ current }: { current: SetupStep }) {
  const steps: { key: SetupStep; label: string }[] = [
    { key: "generating", label: "1" },
    { key: "verifying", label: "2" },
    { key: "complete", label: "3" }
  ]

  const stepOrder: SetupStep[] = ["generating", "verifying", "complete"]
  const currentIdx = stepOrder.indexOf(current)

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, i) => {
        const isActive = i === currentIdx
        const isDone = i < currentIdx

        return (
          <div key={step.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-8 transition-colors",
                  isDone ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : isDone
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
              )}
            >
              {isDone ? <ShieldCheck className="size-4" /> : step.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Disable 2FA Section                                                        */
/* -------------------------------------------------------------------------- */

function Disable2FASection() {
  const t = useTranslations("account")
  const disable2FA = useDisable2FA()
  const { logout } = useAuth()
  const [code, setCode] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [useRecovery, setUseRecovery] = useState(false)
  const [reauthOpen, setReauthOpen] = useState(false)

  const RECOVERY_LENGTH = 8

  function resetForm() {
    setShowForm(false)
    setCode("")
    setUseRecovery(false)
  }

  async function disableWithCode(value: string) {
    try {
      await disable2FA.mutateAsync({ code: value })
      resetForm()
      toast.success(t("twoFactor.disabled"))
      await logout()
    } catch (error) {
      if (isRecentAuthError(error)) {
        setReauthOpen(true)
        setCode("")
        return
      }

      toast.error("Failed to disable 2FA. Please check your code.")
      setCode("")
    }
  }

  async function handleDisableClick() {
    if (showForm || disable2FA.isPending) return

    try {
      await disable2FA.mutateAsync({ code: "" })
      resetForm()
      toast.success(t("twoFactor.disabled"))
      await logout()
    } catch (error) {
      if (isRecentAuthError(error)) {
        setReauthOpen(true)
        return
      }

      if (
        (error instanceof ApiError && error.status === 401) ||
        isMissingVerificationCodeError(error)
      ) {
        setShowForm(true)
        return
      }

      toast.error("Failed to disable 2FA. Please check your code.")
      setCode("")
    }
  }

  async function handleCode(value: string) {
    setCode(value)
    const ready = useRecovery
      ? value.length === RECOVERY_LENGTH
      : value.length === 6
    if (!ready) return
    await disableWithCode(value)
  }

  async function handleReauthVerified() {
    setCode("")
    setShowForm(true)
  }

  function toggleMode() {
    setUseRecovery((prev) => !prev)
    setCode("")
  }

  function handleCancel() {
    resetForm()
  }

  if (!showForm) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("twoFactor.disableWarning")}
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDisableClick}
          disabled={disable2FA.isPending}
        >
          <ShieldOff className="mr-2 size-4" />
          {t("twoFactor.disable")}
        </Button>
        <RecentAuthDialog
          open={reauthOpen}
          onOpenChange={setReauthOpen}
          onVerified={handleReauthVerified}
          description={t("twoFactor.reauthDescription")}
          idPrefix="disable-2fa-reauth"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {useRecovery
          ? t("twoFactor.disableRecoveryConfirm")
          : t("twoFactor.disableConfirm")}
      </p>

      <div className="flex justify-center">
        {useRecovery ? (
          <div
            onPaste={(e) => {
              const text = e.clipboardData
                .getData("text")
                .replace(/[^A-Z0-9]/gi, "")
                .toUpperCase()
              if (text.length > 0) {
                e.preventDefault()
                handleCode(text.slice(0, RECOVERY_LENGTH))
              }
            }}
          >
            <InputOTP
              maxLength={RECOVERY_LENGTH}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              value={code}
              onChange={handleCode}
              disabled={disable2FA.isPending}
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
          </div>
        ) : (
          <InputOTP
            maxLength={6}
            value={code}
            onChange={handleCode}
            disabled={disable2FA.isPending}
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
        )}
      </div>

      {disable2FA.isPending && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Disabling...
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={toggleMode}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {useRecovery
            ? "Use authenticator app instead"
            : "Use a recovery code instead"}
        </button>
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={disable2FA.isPending}
        >
          Cancel
        </Button>
      </div>

      <RecentAuthDialog
        open={reauthOpen}
        onOpenChange={setReauthOpen}
        onVerified={handleReauthVerified}
        description={t("twoFactor.reauthDescription")}
        idPrefix="disable-2fa-reauth"
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Regenerate Recovery Codes Section                                          */
/* -------------------------------------------------------------------------- */

function RegenerateCodesSection({
  onCodesRegenerated
}: {
  onCodesRegenerated: (codes: string[]) => void
}) {
  const t = useTranslations("account")
  const regenerate = useRegenerateRecoveryCodes()
  const [code, setCode] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [reauthOpen, setReauthOpen] = useState(false)

  function resetForm() {
    setShowForm(false)
    setCode("")
  }

  async function regenerateWithCode(value: string) {
    try {
      const result = await regenerate.mutateAsync({ code: value })
      onCodesRegenerated(result.recovery_codes)
      resetForm()
    } catch (error) {
      if (isRecentAuthError(error)) {
        setReauthOpen(true)
        setCode("")
        return
      }

      toast.error(
        "Failed to regenerate recovery codes. Please check your code."
      )
      setCode("")
    }
  }

  async function handleRegenerateClick() {
    if (showForm || regenerate.isPending) return

    try {
      const result = await regenerate.mutateAsync({ code: "" })
      onCodesRegenerated(result.recovery_codes)
      resetForm()
    } catch (error) {
      if (isRecentAuthError(error)) {
        setReauthOpen(true)
        return
      }

      if (
        (error instanceof ApiError && error.status === 401) ||
        isMissingVerificationCodeError(error)
      ) {
        setShowForm(true)
        return
      }

      toast.error(
        "Failed to regenerate recovery codes. Please check your code."
      )
      setCode("")
    }
  }

  async function handleCode(value: string) {
    setCode(value)
    if (value.length !== 6) return
    await regenerateWithCode(value)
  }

  async function handleReauthVerified() {
    setCode("")
    setShowForm(true)
  }

  if (!showForm) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerateClick}
          disabled={regenerate.isPending}
        >
          <RefreshCw className="mr-2 size-4" />
          Regenerate Recovery Codes
        </Button>
        <RecentAuthDialog
          open={reauthOpen}
          onOpenChange={setReauthOpen}
          onVerified={handleReauthVerified}
          description={t("twoFactor.recoveryCodesReauthDescription")}
          idPrefix="regenerate-recovery-codes-reauth"
        />
      </>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        This will invalidate all existing recovery codes and generate new ones.
        Enter your current 6-digit authenticator code to confirm.
      </p>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={handleCode}
          disabled={regenerate.isPending}
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

      {regenerate.isPending && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Regenerating...
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetForm}
          disabled={regenerate.isPending}
        >
          Cancel
        </Button>
      </div>

      <RecentAuthDialog
        open={reauthOpen}
        onOpenChange={setReauthOpen}
        onVerified={handleReauthVerified}
        description={t("twoFactor.recoveryCodesReauthDescription")}
        idPrefix="regenerate-recovery-codes-reauth"
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function TwoFactorSetupPage() {
  const t = useTranslations("account")
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [sessionCleared, setSessionCleared] = useState(false)
  const { data: profile } = useProfile(sessionCleared ? 0 : user.id)
  const { data: twoFactorStatus } = use2FAStatus(!sessionCleared)

  const generate2FA = useGenerate2FA()
  const verify2FA = useVerify2FA()

  const [step, setStep] = useState<SetupStep>("idle")
  const [secret, setSecret] = useState("")
  const [provisioningUri, setProvisioningUri] = useState("")
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [showNewCodes, setShowNewCodes] = useState(false)
  const [newCodes, setNewCodes] = useState<string[]>([])

  // The session user.two_factor_enabled is validated fresh on every page load
  // (validate_token, cache: no-store), so it's safe to render immediately.
  // twoFactorStatus overrides it once loaded, and supplies the extra detail
  // (recovery code counts, required flag, etc.).
  const is2FAEnabled =
    twoFactorStatus?.enabled ??
    profile?.two_factor_enabled ??
    user.two_factor_enabled

  async function startSetup() {
    try {
      setStep("generating")
      const result = await generate2FA.mutateAsync()
      setSecret(result.secret)
      setProvisioningUri(result.provisioning_uri)
    } catch {
      toast.error("Failed to generate 2FA secret. Please try again.")
      setStep("idle")
    }
  }

  async function handleVerify(code: string) {
    try {
      const result = await verify2FA.mutateAsync({ code })
      setSessionCleared(true)
      await queryClient.cancelQueries()
      queryClient.clear()
      await fetch("/api/auth/logout?local=1", {
        method: "POST",
        credentials: "include",
        cache: "no-store"
      }).catch(() => {})
      setRecoveryCodes(result.recovery_codes)
      setStep("complete")
    } catch {
      toast.error("Invalid verification code. Please try again.")
    }
  }

  async function handleDone() {
    router.replace(ROUTES.LOGIN)
  }

  function handleCodesRegenerated(codes: string[]) {
    setNewCodes(codes)
    setShowNewCodes(true)
  }

  if (showNewCodes) {
    return (
      <div className="space-y-6">
        <AccountPageHeader
          title={t("twoFactor.newRecoveryCodes")}
          description={t("twoFactor.newRecoveryCodesDescription")}
          icon={<Shield className="size-[18px]" />}
          gradient="from-[#10b981] to-[#059669]"
        />
        <Card className="card-glow max-w-2xl overflow-hidden">
          <CardContent className="pt-6">
            <BackupCodes
              codes={newCodes}
              onDone={() => setShowNewCodes(false)}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AccountPageHeader
        title={t("twoFactor.title")}
        description={t("twoFactor.description")}
        icon={<Shield className="size-[18px]" />}
        gradient="from-[#10b981] to-[#059669]"
      />

      {/* ------------------------------------------------------------------ */}
      {/*  2FA Already Enabled — show status + disable option                 */}
      {/* ------------------------------------------------------------------ */}
      {is2FAEnabled && step === "idle" && (
        <Card className="card-glow max-w-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              {t("twoFactor.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status */}
            {twoFactorStatus && (
              <div className="space-y-2">
                {twoFactorStatus.verified_at && (
                  <p className="text-sm text-muted-foreground">
                    Enabled on{" "}
                    {new Date(twoFactorStatus.verified_at).toLocaleDateString()}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {twoFactorStatus.recovery_codes_remaining} recovery codes
                  remaining
                </p>
                {twoFactorStatus.recovery_codes_exhausted && (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
                    <AlertCircle className="size-4 shrink-0 text-destructive" />
                    <p className="text-sm text-destructive">
                      No recovery codes remaining! Regenerate codes now to avoid
                      being locked out.
                    </p>
                  </div>
                )}
                {twoFactorStatus.recovery_codes_low &&
                  !twoFactorStatus.recovery_codes_exhausted && (
                    <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                      <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Only {twoFactorStatus.recovery_codes_remaining} recovery
                        codes left. Consider regenerating.
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Regenerate recovery codes */}
            <div>
              <RegenerateCodesSection
                onCodesRegenerated={handleCodesRegenerated}
              />
            </div>

            {/* Disable */}
            {(!twoFactorStatus || !twoFactorStatus.required) && (
              <div className="border-t pt-4">
                <Disable2FASection />
              </div>
            )}
            {twoFactorStatus?.required && (
              <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Two-factor authentication is required for your account type
                  and cannot be disabled.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  Setup Wizard                                                       */}
      {/* ------------------------------------------------------------------ */}
      {!is2FAEnabled && step === "idle" && (
        <Card className="card-glow max-w-2xl overflow-hidden">
          <CardContent className="flex flex-col items-center gap-6 py-10">
            <div className="rounded-full border border-primary/20 bg-primary/10 p-6">
              <Shield className="size-12 text-primary/70" />
            </div>
            <div className="space-y-2 text-center">
              <h2 className="text-lg font-semibold">{t("twoFactor.setup")}</h2>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Add an extra layer of security to your account by enabling
                two-factor authentication with an authenticator app.
              </p>
            </div>
            <Button onClick={startSetup} disabled={generate2FA.isPending}>
              {generate2FA.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {t("twoFactor.setup")}
            </Button>
          </CardContent>
        </Card>
      )}

      {step !== "idle" && (
        <div className="max-w-2xl space-y-6">
          <StepIndicator current={step} />

          <Card className="card-glow overflow-hidden">
            <CardContent className="pt-6">
              {step === "generating" && (
                <QRStep
                  provisioningUri={provisioningUri}
                  secret={secret}
                  onNext={() => setStep("verifying")}
                />
              )}

              {step === "verifying" && (
                <VerifyStep
                  onVerify={handleVerify}
                  onBack={() => setStep("generating")}
                  isPending={verify2FA.isPending}
                />
              )}

              {step === "complete" && (
                <BackupCodes codes={recoveryCodes} onDone={handleDone} />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
