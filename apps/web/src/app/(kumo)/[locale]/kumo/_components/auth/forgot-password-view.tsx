"use client"

import { useState, type FormEvent } from "react"
import { useTranslations } from "next-intl"
import { Banner, Button, Input, Link } from "@cloudflare/kumo"
import { WarningCircleIcon } from "@phosphor-icons/react"
import { z } from "zod"
import { useRouter } from "@/i18n/routing"
import { useKumoRoutes } from "../kumo-routes"
import type { ForgotPasswordActions } from "./auth-actions"
import { AuthHeading } from "./auth-frame"

const emailSchema = z.string().email()

/**
 * Asks for an email address and sends a reset link to it. What is sent is the
 * current design's forgot password page, unchanged.
 */
export function ForgotPasswordView({
  actions
}: {
  /** How the request is sent. Sample pages pass a stand-in. */
  actions: ForgotPasswordActions
}) {
  const t = useTranslations("auth.forgot")
  const routes = useKumoRoutes()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [fieldError, setFieldError] = useState<string>()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!emailSchema.safeParse(email).success) {
      setFieldError(t("email_error"))
      return
    }
    if (isPending) return

    setIsPending(true)
    setError("")
    try {
      const result = await actions.requestReset(email)
      if (!result.ok) {
        setError(result.message || t("error_generic"))
        return
      }
      router.push(routes.resetEmailSent)
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
        <Input
          id="forgot-email"
          type="email"
          label={t("email_label")}
          placeholder={t("email_placeholder")}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setFieldError(undefined)
          }}
          error={fieldError}
          aria-invalid={fieldError ? true : undefined}
          autoComplete="email"
          autoFocus
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

      <p className="text-kumo-subtle">
        <Link href={routes.signIn}>{t("back_to_login")}</Link>
      </p>
    </div>
  )
}
