"use client"

import { useMemo } from "react"
import { useRouter } from "@/i18n/routing"
import { sampleSignInActions, type SampleSignIn } from "../_lib/sample-auth"
import { SampleStatePicker, useSampleState } from "../_lib/sample-state"
import { AuthFrame } from "../../_components/auth/auth-frame"
import { SignInView } from "../../_components/auth/sign-in-view"

const STATES = [
  { value: "straight", label: "Signs in straight away" },
  { value: "two-factor", label: "Asks for a two-factor code" },
  { value: "refused", label: "Refuses the password" },
  { value: "install", label: "Sent by an app's Install button" }
] as const satisfies readonly { value: SampleSignIn; label: string }[]

export function DemoSignIn() {
  const state = useSampleState(STATES)
  const router = useRouter()
  const actions = useMemo(
    () => sampleSignInActions(state, (destination) => router.push(destination)),
    [state, router]
  )

  return (
    <AuthFrame
      demo
      currentDesignHref="/login"
      sample={<SampleStatePicker states={STATES} value={state} />}
    >
      {/* Remounted per state, so a half-finished sign-in starts over. */}
      <SignInView
        key={state}
        actions={actions}
        fromAppInstall={state === "install" || undefined}
      />
    </AuthFrame>
  )
}
