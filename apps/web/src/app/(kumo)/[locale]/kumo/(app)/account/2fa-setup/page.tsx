"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  use2FAStatus,
  useDisable2FA,
  useGenerate2FA,
  useProfile,
  useRegenerateRecoveryCodes,
  useVerify2FA
} from "@/api/account/hooks/use-account"
import { ROUTES } from "@/constants/routes"
import { useRouter } from "@/i18n/routing"
import { useAuth } from "@/providers/auth-provider"
import { postReauth } from "../../_lib/reauth"
import { useAccountApps } from "../../_lib/use-account-apps"
import { PasskeysPanel } from "../../../_components/account/passkeys-panel"
import { TwoFactorView } from "../../../_components/account/two-factor-view"
import { AppShell } from "../../../_components/app-shell"
import { LIVE_PASSKEYS } from "../../../_components/auth/auth-actions"

const TITLE = "Two-factor authentication"

/** Kumo prototype of the two-factor authentication page, on live account data. */
export default function KumoTwoFactorPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, logout } = useAuth()
  const { searchGroups } = useAccountApps()
  const [sessionCleared, setSessionCleared] = useState(false)
  const { data: profile } = useProfile(sessionCleared ? 0 : user.id)
  const { data: twoFactorStatus } = use2FAStatus(!sessionCleared)

  const generate2FA = useGenerate2FA()
  const verify2FA = useVerify2FA()
  const regenerate = useRegenerateRecoveryCodes()
  const disable2FA = useDisable2FA()

  // As on the current page: the session's own flag is checked fresh on every
  // page load, so it is safe to show at once; the status request overrides it
  // when it answers, and adds the detail.
  const enabled =
    twoFactorStatus?.enabled ??
    profile?.two_factor_enabled ??
    user.two_factor_enabled

  const userName = user.alias || user.firstname || user.email

  return (
    <AppShell
      width="narrow"
      title={TITLE}
      currentDesignHref={ROUTES.TWO_FACTOR_SETUP}
      user={{ name: userName, email: user.email }}
      search={searchGroups}
      onSignOut={() => void logout()}
    >
      <TwoFactorView
        enabled={enabled}
        status={twoFactorStatus}
        onStartSetup={() => generate2FA.mutateAsync()}
        // The current page's steps, unchanged: turning two-factor on ends the
        // session on the server, so this page stops asking it for anything
        // and clears its own copy before the recovery codes are shown.
        onVerify={async (code) => {
          const result = await verify2FA.mutateAsync({ code })
          setSessionCleared(true)
          await queryClient.cancelQueries()
          queryClient.clear()
          await fetch("/api/auth/logout?local=1", {
            method: "POST",
            credentials: "include",
            cache: "no-store"
          }).catch(() => {})
          return result
        }}
        onSetupDone={() => router.replace(ROUTES.LOGIN)}
        onRegenerate={(code) => regenerate.mutateAsync({ code })}
        onDisable={(code) => disable2FA.mutateAsync({ code })}
        onDisabled={() => logout()}
        reauth={postReauth}
        passkeys={LIVE_PASSKEYS && <PasskeysPanel reauth={postReauth} />}
      />
    </AppShell>
  )
}
