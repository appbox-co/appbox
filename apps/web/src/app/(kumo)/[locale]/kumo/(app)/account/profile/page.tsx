"use client"

import {
  use2FAStatus,
  useChangePassword,
  useProfile,
  useUpdateProfile
} from "@/api/account/hooks/use-account"
import { ROUTES } from "@/constants/routes"
import { useAuth } from "@/providers/auth-provider"
import { useAccountShell } from "../../_lib/use-account-shell"
import {
  ProfileView,
  type ProfileSummary
} from "../../../_components/account/profile-view"
import { AppShell } from "../../../_components/app-shell"
import type { Loadable } from "../../../_components/shared"

const TITLE = "Profile"

/** Kumo prototype of the profile page, on live account data. */
export default function KumoProfilePage() {
  const { user, logout } = useAuth()
  const { shell } = useAccountShell()
  const profile = useProfile(user.id)
  const { data: twoFactorStatus } = use2FAStatus()
  const updateProfile = useUpdateProfile(user.id)
  const changePassword = useChangePassword(user.id)

  // As on the current page: the session's own copy stands in until (or
  // unless) the profile request answers.
  const display = profile.data ?? {
    alias: user.alias,
    email: user.email,
    two_factor_enabled: user.two_factor_enabled,
    created_at: user.created_at
  }
  const summary: Loadable<ProfileSummary> = profile.isLoading
    ? { status: "loading" }
    : profile.error
      ? { status: "error" }
      : {
          status: "ready",
          data: {
            alias: display.alias ?? "",
            email: display.email,
            created_at: display.created_at
          }
        }

  return (
    <AppShell
      width="narrow"
      title={TITLE}
      currentDesignHref={ROUTES.PROFILE}
      {...shell}
    >
      <ProfileView
        profile={summary}
        twoFactorEnabled={
          twoFactorStatus?.enabled ?? display.two_factor_enabled
        }
        onSaveAlias={(alias) => updateProfile.mutateAsync({ alias })}
        onChangePassword={async (data) => {
          await changePassword.mutateAsync(data)
          // Every session is signed out by the API after a password change,
          // so this one follows once the confirmation has been read.
          setTimeout(() => void logout(), 1500)
        }}
      />
    </AppShell>
  )
}
