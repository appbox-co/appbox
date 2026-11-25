"use client"

import { useState, type ReactNode } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Badge,
  Banner,
  Button,
  ClipboardText,
  cn,
  Loader
} from "@cloudflare/kumo"
import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  InfoIcon,
  ShieldCheckIcon,
  ShieldSlashIcon,
  WarningCircleIcon,
  WarningIcon
} from "@phosphor-icons/react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import type {
  RegenerateRecoveryCodesResult,
  TwoFactorSecret,
  TwoFactorStatus,
  TwoFactorVerifyResult
} from "@/api/account/account"
import { ApiError } from "@/api/client"
import { Panel } from "../panel"
import { CODE_LENGTH, CodeInput } from "./code-input"
import { isRecentAuthError, type Reauth } from "./recent-auth"
import { RecentAuthDialog } from "./recent-auth-dialog"
import { AccountHeader, SettingList, SettingRow } from "./setting-list"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed. Several of
 * these are hard-coded English on the current page too.
 */
const COPY = {
  title: "Two-factor authentication",
  status: "Status",
  enabled: "Enabled",
  since: (date: string) => `since ${date}`,
  recoveryCodes: "Recovery codes",
  recoveryCodesHint:
    "Single-use codes for when you cannot use your authenticator app.",
  remaining: (count: number) => `${count} remaining`,
  exhausted:
    "No recovery codes remaining. Regenerate codes now to avoid being locked out.",
  low: (count: number) =>
    `Only ${count} recovery code${count === 1 ? "" : "s"} left. Consider regenerating.`,
  regenerateTitle: "Regenerate recovery codes",
  regenerateBody:
    "Replaces every recovery code with a new set. The old codes stop working.",
  regenerate: "Regenerate codes",
  regenerateConfirm:
    "This will invalidate all existing recovery codes and generate new ones. Enter your current 6-digit authenticator code to confirm.",
  regenerating: "Regenerating…",
  regenerateFailed:
    "Failed to regenerate recovery codes. Please check your code.",
  disableTitle: "Turn off two-factor authentication",
  disable: "Turn off",
  disabling: "Turning off…",
  disableFailed: "Failed to disable 2FA. Please check your code.",
  required:
    "Two-factor authentication is required for your account type and cannot be disabled.",
  useAuthenticator: "Use authenticator app instead",
  useRecovery: "Use a recovery code instead",
  cancel: "Cancel",
  authenticatorCode: "Authenticator code",
  recoveryCode: "Recovery code",
  setupTitle: "Set up two-factor authentication",
  setupBody:
    "Add an extra layer of security to your account by enabling two-factor authentication with an authenticator app.",
  setup: "Set up",
  setupFailed: "Failed to generate 2FA secret. Please try again.",
  setupExpired: "Your 2FA setup expired. Please start again.",
  invalidCode: "Invalid verification code. Please try again.",
  progress: "Two-factor setup progress",
  steps: ["Scan the QR code", "Enter a code", "Save recovery codes"],
  turnedOn: "Two-factor authentication is on",
  signedOut:
    "You have been signed out. Sign in again with a code from your app to continue.",
  newCodes: "New recovery codes",
  copyAll: "Copy all",
  copied: "Copied"
} as const

export interface TwoFactorViewProps {
  /** Whether the account has two-factor authentication on. */
  enabled: boolean
  /** The detail, once loaded: when it was turned on, codes left, whether it is required. */
  status: TwoFactorStatus | undefined
  /** Starts a setup and answers with the secret to scan. */
  onStartSetup: () => Promise<TwoFactorSecret>
  /** Confirms the setup with a code from the app; answers with the recovery codes. */
  onVerify: (code: string) => Promise<TwoFactorVerifyResult>
  /** Leaves the page once the new recovery codes have been saved. */
  onSetupDone: () => void
  /** Replaces the recovery codes. An empty code asks whether one is needed. */
  onRegenerate: (code: string) => Promise<RegenerateRecoveryCodesResult>
  /** Turns two-factor off. An empty code asks whether one is needed. */
  onDisable: (code: string) => Promise<unknown>
  /** Runs after it has been turned off (the page signs out). */
  onDisabled: () => Promise<unknown> | void
  /** How a sign-in is repeated when the API asks for a recent one. */
  reauth: Reauth
  /** The passkeys panel: above the danger zone, and hidden while setting up. */
  passkeys?: ReactNode
}

/** The API's way of saying "send a code with that". */
function isMissingVerificationCodeError(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 404 &&
    error.message.toLowerCase().includes("verification code is required")
  )
}

const needsCode = (error: unknown) =>
  (error instanceof ApiError && error.status === 401) ||
  isMissingVerificationCodeError(error)

/* -------------------------------------------------------------------------- */
/*  Shared pieces                                                              */
/* -------------------------------------------------------------------------- */

/** "Working…" beside a spinner, under a code field. */
function PendingLine({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="flex items-center gap-2 text-kumo-subtle">
      <Loader size="sm" />
      {children}
    </p>
  )
}

/** A set of recovery codes to save, with a way to copy them all. */
function RecoveryCodes({
  codes,
  notice,
  doneLabel,
  onDone
}: {
  codes: string[]
  /** Shown above the codes, e.g. that two-factor is now on. */
  notice?: ReactNode
  doneLabel: string
  onDone: () => void
}) {
  const t = useTranslations("account")
  const [copied, setCopied] = useState(false)

  const copyAll = async () => {
    await navigator.clipboard.writeText(codes.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      {notice}
      <div className="grid gap-1.5">
        <h3 className="font-semibold">{COPY.recoveryCodes}</h3>
        <p className="text-kumo-subtle">
          {t("twoFactor.backupCodesDescription")}
        </p>
      </div>
      <ul className="grid list-none grid-cols-1 gap-x-8 gap-y-2 rounded-lg bg-kumo-tint px-5 py-4 sm:grid-cols-2">
        {codes.map((code, index) => (
          <li key={index} className="font-mono text-[0.9em]">
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          icon={copied ? CheckIcon : CopyIcon}
          onClick={() => void copyAll()}
        >
          {copied ? COPY.copied : COPY.copyAll}
        </Button>
        <Button variant="primary" onClick={onDone}>
          {doneLabel}
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Regenerate recovery codes                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The current page's flow, unchanged: try without a code first; the API then
 * says whether it wants a recent sign-in, a code, or neither.
 */
function RegenerateCodes({
  onRegenerate,
  onCodes,
  reauth
}: Pick<TwoFactorViewProps, "onRegenerate" | "reauth"> & {
  onCodes: (codes: string[]) => void
}) {
  const t = useTranslations("account")
  const [code, setCode] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [reauthOpen, setReauthOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const resetForm = () => {
    setShowForm(false)
    setCode("")
  }

  const regenerateWithCode = async (value: string) => {
    setPending(true)
    try {
      const result = await onRegenerate(value)
      onCodes(result.recovery_codes)
      resetForm()
    } catch (error) {
      if (isRecentAuthError(error)) {
        setReauthOpen(true)
        setCode("")
        return
      }

      toast.error(COPY.regenerateFailed)
      setCode("")
    } finally {
      setPending(false)
    }
  }

  const handleRegenerateClick = async () => {
    if (showForm || pending) return

    setPending(true)
    try {
      const result = await onRegenerate("")
      onCodes(result.recovery_codes)
      resetForm()
    } catch (error) {
      if (isRecentAuthError(error)) {
        setReauthOpen(true)
        return
      }

      if (needsCode(error)) {
        setShowForm(true)
        return
      }

      toast.error(COPY.regenerateFailed)
      setCode("")
    } finally {
      setPending(false)
    }
  }

  const handleCode = async (value: string) => {
    setCode(value)
    if (value.length !== CODE_LENGTH.totp) return
    await regenerateWithCode(value)
  }

  return (
    <div className="grid grid-cols-1 justify-items-start gap-4">
      {showForm ? (
        <>
          <p className="text-kumo-subtle">{COPY.regenerateConfirm}</p>
          <CodeInput
            label={COPY.authenticatorCode}
            value={code}
            onChange={(value) => void handleCode(value)}
            disabled={pending}
            autoFocus
          />
          {pending && <PendingLine>{COPY.regenerating}</PendingLine>}
          <Button onClick={resetForm} disabled={pending}>
            {COPY.cancel}
          </Button>
        </>
      ) : (
        <>
          <p className="text-kumo-subtle">{COPY.regenerateBody}</p>
          <Button
            icon={ArrowsClockwiseIcon}
            onClick={() => void handleRegenerateClick()}
            loading={pending}
            disabled={pending}
          >
            {COPY.regenerate}
          </Button>
        </>
      )}

      <RecentAuthDialog
        open={reauthOpen}
        onOpenChange={setReauthOpen}
        onVerified={() => {
          setCode("")
          setShowForm(true)
        }}
        reauth={reauth}
        description={t("twoFactor.recoveryCodesReauthDescription")}
        idPrefix="regenerate-recovery-codes-reauth"
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Turn off                                                                   */
/* -------------------------------------------------------------------------- */

/** The current page's flow, unchanged; see `RegenerateCodes`. */
function DisableTwoFactor({
  onDisable,
  onDisabled,
  reauth
}: Pick<TwoFactorViewProps, "onDisable" | "onDisabled" | "reauth">) {
  const t = useTranslations("account")
  const [code, setCode] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [useRecovery, setUseRecovery] = useState(false)
  const [reauthOpen, setReauthOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const resetForm = () => {
    setShowForm(false)
    setCode("")
    setUseRecovery(false)
  }

  const disableWithCode = async (value: string) => {
    setPending(true)
    try {
      await onDisable(value)
      resetForm()
      toast.success(t("twoFactor.disabled"))
      await onDisabled()
    } catch (error) {
      if (isRecentAuthError(error)) {
        setReauthOpen(true)
        setCode("")
        return
      }

      toast.error(COPY.disableFailed)
      setCode("")
    } finally {
      setPending(false)
    }
  }

  const handleDisableClick = async () => {
    if (showForm || pending) return

    setPending(true)
    try {
      await onDisable("")
      resetForm()
      toast.success(t("twoFactor.disabled"))
      await onDisabled()
    } catch (error) {
      if (isRecentAuthError(error)) {
        setReauthOpen(true)
        return
      }

      if (needsCode(error)) {
        setShowForm(true)
        return
      }

      toast.error(COPY.disableFailed)
      setCode("")
    } finally {
      setPending(false)
    }
  }

  const handleCode = async (value: string) => {
    setCode(value)
    const ready =
      value.length === CODE_LENGTH[useRecovery ? "recovery" : "totp"]
    if (!ready) return
    await disableWithCode(value)
  }

  return (
    <div className="grid grid-cols-1 justify-items-start gap-4">
      {showForm ? (
        <>
          <p className="text-kumo-subtle">
            {useRecovery
              ? t("twoFactor.disableRecoveryConfirm")
              : t("twoFactor.disableConfirm")}
          </p>
          {useRecovery ? (
            // A pasted recovery code is tidied (letters and digits, upper
            // case) before it is used, as on the current page.
            <div
              onPaste={(event) => {
                const text = event.clipboardData
                  .getData("text")
                  .replace(/[^A-Z0-9]/gi, "")
                  .toUpperCase()
                if (text.length > 0) {
                  event.preventDefault()
                  void handleCode(text.slice(0, CODE_LENGTH.recovery))
                }
              }}
            >
              <CodeInput
                key="recovery"
                kind="recovery"
                label={COPY.recoveryCode}
                value={code}
                onChange={(value) => void handleCode(value)}
                disabled={pending}
                autoFocus
              />
            </div>
          ) : (
            <CodeInput
              key="totp"
              label={COPY.authenticatorCode}
              value={code}
              onChange={(value) => void handleCode(value)}
              disabled={pending}
              autoFocus
            />
          )}
          {pending && <PendingLine>{COPY.disabling}</PendingLine>}
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={resetForm} disabled={pending}>
              {COPY.cancel}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setUseRecovery((current) => !current)
                setCode("")
              }}
            >
              {useRecovery ? COPY.useAuthenticator : COPY.useRecovery}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-kumo-subtle">{t("twoFactor.disableWarning")}</p>
          <Button
            variant="destructive"
            icon={ShieldSlashIcon}
            onClick={() => void handleDisableClick()}
            loading={pending}
            disabled={pending}
          >
            {COPY.disable}
          </Button>
        </>
      )}

      <RecentAuthDialog
        open={reauthOpen}
        onOpenChange={setReauthOpen}
        onVerified={() => {
          setCode("")
          setShowForm(true)
        }}
        reauth={reauth}
        description={t("twoFactor.reauthDescription")}
        idPrefix="disable-2fa-reauth"
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Setup steps                                                                */
/* -------------------------------------------------------------------------- */

type SetupStep = "idle" | "generating" | "verifying" | "complete"

const STEP_ORDER: SetupStep[] = ["generating", "verifying", "complete"]

function Steps({ current }: { current: SetupStep }) {
  const currentIndex = STEP_ORDER.indexOf(current)

  return (
    <ol aria-label={COPY.progress} className="grid grid-cols-3 gap-3">
      {COPY.steps.map((label, index) => {
        const active = index === currentIndex
        const done = index < currentIndex
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="grid content-start gap-2"
          >
            <span className="flex items-start gap-2">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-xs tabular-nums",
                  active || done
                    ? "bg-kumo-brand text-white"
                    : "text-kumo-subtle ring ring-kumo-line"
                )}
              >
                {done ? (
                  <CheckIcon aria-hidden="true" size={12} weight="bold" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  "min-w-0",
                  active ? "font-medium" : "text-kumo-subtle"
                )}
              >
                {label}
                {done && <span className="sr-only"> (done)</span>}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "h-0.5 rounded-full",
                active || done ? "bg-kumo-brand" : "bg-kumo-fill"
              )}
            />
          </li>
        )
      })}
    </ol>
  )
}

function QrStep({
  secret,
  onNext
}: {
  /** Null while the secret is being generated. */
  secret: TwoFactorSecret | null
  onNext: () => void
}) {
  const t = useTranslations("account")

  if (!secret) {
    return <PendingLine>{t("twoFactor.generating")}</PendingLine>
  }

  return (
    <div className="grid grid-cols-1 justify-items-start gap-5">
      <p className="text-kumo-subtle">{t("twoFactor.scanQR")}</p>
      {/* White in both themes: a QR code needs the contrast to scan. */}
      <div className="rounded-lg bg-white p-4 ring ring-kumo-line">
        <QRCodeSVG value={secret.provisioning_uri} size={200} />
      </div>
      <div className="grid max-w-full gap-2">
        <p className="text-kumo-subtle">{t("twoFactor.secretKey")}</p>
        <ClipboardText text={secret.secret} />
      </div>
      <Button variant="primary" onClick={onNext}>
        {t("twoFactor.next")}
      </Button>
    </div>
  )
}

function VerifyStep({
  pending,
  onVerify,
  onBack
}: {
  pending: boolean
  onVerify: (code: string) => void
  onBack: () => void
}) {
  const t = useTranslations("account")
  const [code, setCode] = useState("")

  return (
    <div className="grid grid-cols-1 justify-items-start gap-5">
      <p className="text-kumo-subtle">{t("twoFactor.enterCode")}</p>
      <CodeInput
        label={COPY.authenticatorCode}
        value={code}
        onChange={(value) => {
          setCode(value)
          if (value.length === CODE_LENGTH.totp) onVerify(value)
        }}
        disabled={pending}
        autoFocus
      />
      {pending && <PendingLine>{t("twoFactor.verifying")}</PendingLine>}
      <Button onClick={onBack} disabled={pending}>
        {t("twoFactor.back")}
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Two-factor authentication: its state and the two things that can be done
 * while it is on (new recovery codes, turning it off), or the three-step setup
 * while it is off. What is asked of the API, and in what order, is the current
 * page's; only what it renders differs.
 */
export function TwoFactorView({
  enabled,
  status,
  onStartSetup,
  onVerify,
  onSetupDone,
  onRegenerate,
  onDisable,
  onDisabled,
  reauth,
  passkeys
}: TwoFactorViewProps) {
  const t = useTranslations("account")
  const locale = useLocale()

  const [step, setStep] = useState<SetupStep>("idle")
  const [secret, setSecret] = useState<TwoFactorSecret | null>(null)
  const [starting, setStarting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [newCodes, setNewCodes] = useState<string[] | null>(null)
  const [reauthOpen, setReauthOpen] = useState(false)
  const [reauthAction, setReauthAction] = useState<"setup" | "verify" | null>(
    null
  )
  const [verifyAttempt, setVerifyAttempt] = useState(0)

  const startSetup = async ({ afterReauth = false } = {}) => {
    setStarting(true)
    try {
      setSecret(null)
      setStep("generating")
      setSecret(await onStartSetup())
    } catch (error) {
      setStep("idle")

      if (isRecentAuthError(error)) {
        // Refused again straight after signing in: let the dialog stay open
        // and report the failure instead of closing without a message.
        if (afterReauth) throw error

        setReauthAction("setup")
        setReauthOpen(true)
        return
      }

      toast.error(COPY.setupFailed)
    } finally {
      setStarting(false)
    }
  }

  const verify = async (code: string) => {
    setVerifying(true)
    try {
      const result = await onVerify(code)
      setRecoveryCodes(result.recovery_codes)
      setStep("complete")
    } catch (error) {
      if (isRecentAuthError(error)) {
        setReauthAction("verify")
        setReauthOpen(true)
        return
      }

      // The API answers 404 once the pending setup has expired or been
      // cleared, so no code can succeed until setup starts again.
      if (error instanceof ApiError && error.status === 404) {
        setStep("idle")
        toast.error(COPY.setupExpired)
        return
      }

      toast.error(COPY.invalidCode)
    } finally {
      setVerifying(false)
    }
  }

  const handleReauthVerified = async () => {
    // Setup is retried automatically. A verification code may have expired
    // while the user signed in again, so the field is cleared for a fresh one.
    if (reauthAction === "setup") {
      await startSetup({ afterReauth: true })
    } else if (reauthAction === "verify") {
      setVerifyAttempt((attempt) => attempt + 1)
    }

    setReauthAction(null)
  }

  if (newCodes) {
    return (
      <div className="flex flex-col gap-6">
        <AccountHeader
          icon={<ShieldCheckIcon aria-hidden="true" size={24} />}
          title={COPY.newCodes}
          description={t("twoFactor.newRecoveryCodesDescription")}
        />
        <Panel title={COPY.newCodes}>
          <RecoveryCodes
            codes={newCodes}
            doneLabel={t("twoFactor.done")}
            onDone={() => setNewCodes(null)}
          />
        </Panel>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        icon={<ShieldCheckIcon aria-hidden="true" size={24} />}
        title={COPY.title}
        description={t("twoFactor.description")}
      />

      {/* On: its state, then the two things that can be done about it. */}
      {enabled && step === "idle" && (
        <>
          {status?.recovery_codes_exhausted && (
            <Banner
              variant="error"
              icon={<WarningCircleIcon weight="fill" />}
              description={COPY.exhausted}
            />
          )}
          {status?.recovery_codes_low && !status.recovery_codes_exhausted && (
            <Banner
              variant="alert"
              icon={<WarningIcon weight="fill" />}
              description={COPY.low(status.recovery_codes_remaining)}
            />
          )}

          <Panel title={COPY.status} flush>
            <SettingList>
              <SettingRow label={COPY.title}>
                <Badge variant="success" appearance="dot">
                  {COPY.enabled}
                </Badge>
                {status?.verified_at && (
                  <time
                    dateTime={status.verified_at}
                    className="text-kumo-subtle tabular-nums"
                    suppressHydrationWarning
                  >
                    {COPY.since(
                      new Date(status.verified_at).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    )}
                  </time>
                )}
              </SettingRow>
              {status && (
                <SettingRow
                  label={COPY.recoveryCodes}
                  hint={COPY.recoveryCodesHint}
                >
                  <span className="tabular-nums">
                    {COPY.remaining(status.recovery_codes_remaining)}
                  </span>
                </SettingRow>
              )}
            </SettingList>
          </Panel>

          <Panel title={COPY.regenerateTitle}>
            <RegenerateCodes
              onRegenerate={onRegenerate}
              onCodes={setNewCodes}
              reauth={reauth}
            />
          </Panel>

          {passkeys}

          {status?.required ? (
            <Banner
              icon={<InfoIcon weight="fill" />}
              description={COPY.required}
            />
          ) : (
            <Panel title={COPY.disableTitle}>
              <DisableTwoFactor
                onDisable={onDisable}
                onDisabled={onDisabled}
                reauth={reauth}
              />
            </Panel>
          )}
        </>
      )}

      {/* Off: what it is, and a way to start. */}
      {!enabled && step === "idle" && (
        <Panel title={COPY.setupTitle}>
          <div className="grid grid-cols-1 justify-items-start gap-4">
            <p className="max-w-prose text-kumo-subtle">{COPY.setupBody}</p>
            <Button
              variant="primary"
              onClick={() => void startSetup()}
              loading={starting}
              disabled={starting}
            >
              {COPY.setup}
            </Button>
          </div>
        </Panel>
      )}
      {!enabled && step === "idle" && passkeys}

      {/* Being set up. */}
      {step !== "idle" && (
        <>
          <Steps current={step} />
          <Panel title={COPY.steps[STEP_ORDER.indexOf(step)]}>
            {step === "generating" && (
              <QrStep secret={secret} onNext={() => setStep("verifying")} />
            )}
            {step === "verifying" && (
              <VerifyStep
                key={verifyAttempt}
                pending={verifying}
                onVerify={(code) => void verify(code)}
                onBack={() => setStep("generating")}
              />
            )}
            {step === "complete" && (
              <RecoveryCodes
                codes={recoveryCodes}
                notice={
                  <Banner
                    icon={<CheckCircleIcon weight="fill" />}
                    title={COPY.turnedOn}
                    description={COPY.signedOut}
                  />
                }
                doneLabel={t("twoFactor.done")}
                onDone={onSetupDone}
              />
            )}
          </Panel>
        </>
      )}

      <RecentAuthDialog
        open={reauthOpen}
        onOpenChange={setReauthOpen}
        onVerified={handleReauthVerified}
        reauth={reauth}
        description={t("twoFactor.setupReauthDescription")}
        idPrefix="setup-2fa-reauth"
      />
    </div>
  )
}
