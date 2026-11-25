"use client"

import { useState, type FormEvent } from "react"
import { useTranslations } from "next-intl"
import { Banner, Button } from "@cloudflare/kumo"
import { WarningCircleIcon } from "@phosphor-icons/react"
import { useRouter } from "@/i18n/routing"
import { kumoRoutes } from "../kumo-routes"
import { postReset } from "./auth-actions"
import { AuthHeading } from "./auth-frame"
import { PasswordInput } from "./password-input"
import { PASSWORD_RESET_PARAM } from "./sign-in-view"

/** Same rule as the current design's reset page. */
const MIN_PASSWORD_LENGTH = 8

/**
 * Sets a new password from the link in the reset email. What is sent is the
 * current design's reset page, unchanged; once it works, the sign-in page says
 * so in place of a toast.
 */
export function ResetPasswordView({
  token
}: {
  /** From the link in the reset email. */
  token: string
}) {
  const t = useTranslations("auth.reset")
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string
    confirm?: string
  }>({})
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = {
      password:
        password.length >= MIN_PASSWORD_LENGTH
          ? undefined
          : t("password_error"),
      confirm:
        confirm.length >= MIN_PASSWORD_LENGTH && confirm === password
          ? undefined
          : t("confirm_password_error")
    }
    setFieldErrors(errors)
    if (errors.password || errors.confirm || isPending) return

    setIsPending(true)
    setError("")
    try {
      const result = await postReset(token, password)
      if (!result.ok) {
        setError(result.message || t("error_generic"))
        return
      }
      router.push(`${kumoRoutes.signIn}?${PASSWORD_RESET_PARAM}=done`)
    } catch {
      setError(t("error_generic"))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="grid gap-8">
      <AuthHeading title={t("title")} description={t("description")} />

      <form onSubmit={submit} noValidate className="grid gap-5">
        <PasswordInput
          id="reset-password"
          label={t("password_label")}
          placeholder={t("password_placeholder")}
          value={password}
          onChange={(value) => {
            setPassword(value)
            setFieldErrors((current) => ({ ...current, password: undefined }))
          }}
          error={fieldErrors.password}
          autoComplete="new-password"
          autoFocus
        />
        <PasswordInput
          id="reset-password-confirm"
          label={t("confirm_password_label")}
          placeholder={t("confirm_password_placeholder")}
          value={confirm}
          onChange={(value) => {
            setConfirm(value)
            setFieldErrors((current) => ({ ...current, confirm: undefined }))
          }}
          error={fieldErrors.confirm}
          autoComplete="new-password"
        />

        {error && (
          <Banner
            variant="error"
            icon={<WarningCircleIcon weight="fill" />}
            description={error}
          />
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full justify-center"
          disabled={isPending}
          loading={isPending}
        >
          {t("submit")}
        </Button>
      </form>
    </div>
  )
}
