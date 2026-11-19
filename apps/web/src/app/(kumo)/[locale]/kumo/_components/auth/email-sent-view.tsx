"use client"

import { useTranslations } from "next-intl"
import { LinkButton } from "@cloudflare/kumo"
import { EnvelopeSimpleIcon } from "@phosphor-icons/react"
import { useKumoRoutes } from "../kumo-routes"
import { AuthHeading } from "./auth-frame"

/** Shown once a reset link has been sent. */
export function EmailSentView() {
  const t = useTranslations("auth.email_sent")
  const routes = useKumoRoutes()

  return (
    <div className="grid gap-8">
      <div className="grid justify-items-start gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl bg-kumo-tint text-kumo-default ring ring-kumo-hairline">
          <EnvelopeSimpleIcon size={24} aria-hidden="true" />
        </span>
        <AuthHeading title={t("title")} description={t("description")} />
      </div>

      <p className="text-kumo-subtle text-pretty">{t("check_inbox")}</p>

      <LinkButton
        href={routes.signIn}
        variant="secondary"
        className="w-full justify-center"
      >
        {t("back_to_login")}
      </LinkButton>
    </div>
  )
}
