"use client"

import { useState } from "react"
import { ROUTES } from "@/constants/routes"
import { SampleStatePicker, useSampleState } from "../../_lib/sample-state"
import {
  ProfileView,
  type ProfileSummary
} from "../../../_components/account/profile-view"
import { AppShell } from "../../../_components/app-shell"
import { buildSearchGroups } from "../../../_components/quick-search"
import type { Loadable } from "../../../_components/shared"
import { appsByCylo, cylos, demoUser } from "../../fixtures"

const STATES = [
  { value: "normal", label: "Two-factor not set up" },
  { value: "protected", label: "Two-factor enabled" },
  { value: "loading", label: "Loading" },
  { value: "error", label: "Failed to load" }
] as const

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The profile page on sample data. Saving the name changes local state only,
 * and nothing typed into the password form is sent anywhere: any current
 * password is accepted except "wrong".
 */
export function DemoProfile() {
  const state = useSampleState(STATES)
  const [alias, setAlias] = useState(demoUser.name)

  const profile: Loadable<ProfileSummary> =
    state === "loading"
      ? { status: "loading" }
      : state === "error"
        ? { status: "error" }
        : {
            status: "ready",
            data: {
              alias,
              email: demoUser.email,
              created_at: "2024-01-15T09:00:00Z"
            }
          }

  return (
    <AppShell
      demo
      width="narrow"
      title="Profile"
      currentDesignHref={ROUTES.PROFILE}
      user={demoUser}
      search={buildSearchGroups(cylos, appsByCylo, true)}
    >
      <div className="grid grid-cols-1 gap-6">
        <SampleStatePicker states={STATES} value={state} />
        <ProfileView
          profile={profile}
          twoFactorEnabled={state === "protected"}
          onSaveAlias={async (next) => {
            await wait(600)
            setAlias(next)
          }}
          onChangePassword={async ({ current_password }) => {
            await wait(800)
            if (current_password === "wrong") throw new Error("sample failure")
          }}
        />
      </div>
    </AppShell>
  )
}
