"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { Banner, Button, Input, Label, Link } from "@cloudflare/kumo"
import {
  CheckCircleIcon,
  FingerprintSimpleIcon,
  InfoIcon,
  WarningCircleIcon
} from "@phosphor-icons/react"
import { z } from "zod"
import { CODE_LENGTH, CodeInput } from "../account/code-input"
import { kumoRoutes } from "../kumo-routes"
import { signInDestination, type SignInActions } from "./auth-actions"
import { AuthHeading, PLANS_HREF } from "./auth-frame"
import { PasswordInput } from "./password-input"
import { passkeyAutofillAvailable } from "./webauthn"

const emailSchema = z.string().email()

const PASSKEY_REFUSED = "That passkey was not accepted."

/** The reset password page sends people here with this, once it has worked. */
export const PASSWORD_RESET_PARAM = "reset"

interface SignInViewProps {
  /** How the sign-in is sent: `liveSignInActions`, for the page's locale. */
  actions: SignInActions
}

/**
 * Email and password, then a two-factor code if the account has one. The
 * steps and what is sent are the current design's login page, unchanged;
 * errors show in the page instead of in toasts.
 */
export function SignInView({ actions }: SignInViewProps) {
  const t = useTranslations("auth.login")
  const tCodes = useTranslations("account.apiKeys")
  const tReset = useTranslations("auth.reset")
  const params = useSearchParams()

  const destination = signInDestination(params.get("redirect"), kumoRoutes.home)
  // The note for people sent here by an app's Install button.
  const showInstallNote = /\/appstore\/app\//.test(destination)
  const passwordWasReset = params.get(PASSWORD_RESET_PARAM) === "done"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  const [twoFactorToken, setTwoFactorToken] = useState("")
  const [useRecovery, setUseRecovery] = useState(false)
  const [code, setCode] = useState("")

  // Which button is working, so only that one shows it.
  const [pending, setPending] = useState<"password" | "passkey" | null>(null)
  const isPending = pending !== null
  const [error, setError] = useState("")
  const busyRef = useRef(false)

  // Passkeys offered in the email field's autofill list. Each attempt uses up
  // its challenge, so a failed one starts a fresh wait.
  const [autofillRun, setAutofillRun] = useState(0)
  const autofillRef = useRef<AbortController | null>(null)
  const { passkeyAutofill, finish } = actions

  useEffect(() => {
    if (!passkeyAutofill || twoFactorToken) return
    const controller = new AbortController()
    autofillRef.current = controller

    void (async () => {
      try {
        if (!(await passkeyAutofillAvailable())) return
        if (controller.signal.aborted) return
        const result = await passkeyAutofill(controller.signal)
        if (controller.signal.aborted) return
        if (result.kind === "signed-in") {
          finish(destination)
        } else if (result.kind === "error") {
          setError(result.message || PASSKEY_REFUSED)
          setAutofillRun((run) => run + 1)
        }
      } catch {
        if (!controller.signal.aborted) setError(t("error_generic"))
      }
    })()

    return () => controller.abort()
  }, [passkeyAutofill, finish, twoFactorToken, destination, autofillRun, t])

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = {
      email: emailSchema.safeParse(email).success
        ? undefined
        : t("email_error"),
      password: password ? undefined : t("password_error")
    }
    setFieldErrors(errors)
    if (errors.email || errors.password || busyRef.current) return

    busyRef.current = true
    setPending("password")
    setError("")
    try {
      const result = await actions.signIn(email, password)
      if (result.kind === "error") {
        setError(result.message || t("error_invalid"))
        return
      }
      if (result.kind === "two-factor") {
        setTwoFactorToken(result.token)
        setCode("")
        return
      }
      actions.finish(destination)
    } catch {
      setError(t("error_generic"))
    } finally {
      busyRef.current = false
      setPending(null)
    }
  }

  async function submitPasskey() {
    if (!actions.signInWithPasskey || busyRef.current) return
    busyRef.current = true
    setPending("passkey")
    setError("")
    // The browser runs one passkey request at a time: stop the autofill one.
    autofillRef.current?.abort()
    let signedIn = false
    try {
      const result = await actions.signInWithPasskey()
      if (result.kind === "cancelled") return
      if (result.kind === "error") {
        setError(result.message || PASSKEY_REFUSED)
        return
      }
      signedIn = true
      actions.finish(destination)
    } catch {
      setError(t("error_generic"))
    } finally {
      busyRef.current = false
      setPending(null)
      if (!signedIn) setAutofillRun((run) => run + 1)
    }
  }

  async function submitCode(value: string) {
    if (busyRef.current) return
    busyRef.current = true
    setPending("password")
    setError("")
    try {
      const result = await actions.verifyTwoFactor(
        twoFactorToken,
        value,
        useRecovery
      )
      if (result.kind === "error") {
        setError(result.message || t("error_2fa_invalid"))
        setCode("")
        return
      }
      // Out of recovery codes: make new ones before anything else, so the
      // account cannot be locked out. Running low is the dashboard's to raise.
      actions.finish(
        result.recoveryCodesExhausted ? kumoRoutes.twoFactor : destination
      )
    } catch {
      setError(t("error_generic"))
      setCode("")
    } finally {
      busyRef.current = false
      setPending(null)
    }
  }

  function changeCode(value: string) {
    const next = useRecovery
      ? value
          .replace(/[^A-Z0-9]/gi, "")
          .toUpperCase()
          .slice(0, CODE_LENGTH.recovery)
      : value
    setCode(next)
    // A complete code is sent straight away, as in the current design.
    if (next.length === CODE_LENGTH[useRecovery ? "recovery" : "totp"]) {
      void submitCode(next)
    }
  }

  function backToPassword() {
    setTwoFactorToken("")
    setUseRecovery(false)
    setCode("")
    setError("")
  }

  const errorBanner = error && (
    <Banner
      variant="error"
      icon={<WarningCircleIcon weight="fill" />}
      description={error}
    />
  )

  if (twoFactorToken) {
    const codeLabel = useRecovery
      ? tCodes("recoveryCode")
      : tCodes("twoFactorCode")
    const codeComplete =
      code.length === CODE_LENGTH[useRecovery ? "recovery" : "totp"]

    return (
      <div className="grid gap-8">
        <AuthHeading
          title={t("2fa_title")}
          description={
            useRecovery
              ? "Enter one of your recovery codes"
              : t("2fa_description")
          }
        />

        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (codeComplete) void submitCode(code)
          }}
          className="grid gap-5"
        >
          <div className="grid justify-items-start gap-2">
            <Label htmlFor="sign-in-code">{codeLabel}</Label>
            <CodeInput
              key={useRecovery ? "recovery" : "totp"}
              kind={useRecovery ? "recovery" : "totp"}
              id="sign-in-code"
              label={codeLabel}
              value={code}
              onChange={changeCode}
              disabled={isPending}
              required
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setUseRecovery((current) => !current)
                setCode("")
                setError("")
              }}
            >
              {useRecovery
                ? tCodes("useAuthenticator")
                : tCodes("useRecoveryCode")}
            </Button>
          </div>

          {errorBanner}

          <div className="grid gap-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              disabled={isPending || !codeComplete}
              loading={pending === "password"}
            >
              {t("2fa_submit")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center"
              onClick={backToPassword}
            >
              {t("2fa_back")}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="grid gap-8">
      <AuthHeading title={t("title")} description={t("description")} />

      {passwordWasReset && (
        <Banner
          icon={<CheckCircleIcon weight="fill" />}
          description={
            // A reset removes the account's passkeys (the API does it, and
            // the password changed email says so too).
            actions.signInWithPasskey
              ? `${tReset("success")} Any passkeys on your account were removed; add them again from the two-factor page once you are signed in.`
              : tReset("success")
          }
        />
      )}

      {showInstallNote && (
        <Banner
          icon={<InfoIcon weight="fill" />}
          title={t("appbox_required_title")}
          description={
            <span className="grid justify-items-start gap-1">
              <span>{t("appbox_required_description")}</span>
              <Link href={PLANS_HREF}>{t("appbox_required_link")}</Link>
            </span>
          }
        />
      )}

      <form onSubmit={submitPassword} noValidate className="grid gap-5">
        <Input
          id="sign-in-email"
          type="email"
          label={t("email_label")}
          placeholder={t("email_placeholder")}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setFieldErrors((current) => ({ ...current, email: undefined }))
          }}
          error={fieldErrors.email}
          aria-invalid={fieldErrors.email ? true : undefined}
          // "webauthn" lets the browser list passkeys under this field.
          autoComplete={passkeyAutofill ? "username webauthn" : "email"}
          autoFocus
        />
        <div className="grid gap-2">
          <PasswordInput
            id="sign-in-password"
            label={t("password_label")}
            placeholder={t("password_placeholder")}
            value={password}
            onChange={(value) => {
              setPassword(value)
              setFieldErrors((current) => ({
                ...current,
                password: undefined
              }))
            }}
            error={fieldErrors.password}
            autoComplete="current-password"
          />
          <Link href={kumoRoutes.forgotPassword} className="justify-self-end">
            {t("forgot_password")}
          </Link>
        </div>

        {errorBanner}

        <div className="grid gap-3">
          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center"
            disabled={isPending}
            loading={pending === "password"}
          >
            {t("submit")}
          </Button>

          {actions.signInWithPasskey && (
            <>
              <div className="flex items-center gap-3 text-kumo-subtle">
                <span className="h-px flex-1 bg-kumo-line" />
                or
                <span className="h-px flex-1 bg-kumo-line" />
              </div>
              <Button
                type="button"
                variant="secondary"
                icon={<FingerprintSimpleIcon />}
                className="w-full justify-center"
                disabled={isPending}
                loading={pending === "passkey"}
                onClick={() => void submitPasskey()}
              >
                Sign in with a passkey
              </Button>
            </>
          )}
        </div>
      </form>

      <p className="text-kumo-subtle text-pretty">
        {t("external_signup")}{" "}
        <Link href={PLANS_HREF}>{t("external_signup_link")}</Link>
      </p>
    </div>
  )
}
