"use client"

import { useMemo } from "react"
import {
  SAMPLE_REQUEST_STATES,
  sampleResetPasswordActions
} from "../../../_lib/sample-auth"
import { SampleStatePicker, useSampleState } from "../../../_lib/sample-state"
import { AuthFrame } from "../../../../_components/auth/auth-frame"
import { ResetPasswordView } from "../../../../_components/auth/reset-password-view"

export function DemoResetPassword({ token }: { token: string }) {
  const state = useSampleState(SAMPLE_REQUEST_STATES)
  const actions = useMemo(() => sampleResetPasswordActions(state), [state])

  return (
    <AuthFrame
      demo
      currentDesignHref={`/forgot/verify/${encodeURIComponent(token)}`}
      sample={
        <SampleStatePicker states={SAMPLE_REQUEST_STATES} value={state} />
      }
    >
      <ResetPasswordView key={state} token={token} actions={actions} />
    </AuthFrame>
  )
}
