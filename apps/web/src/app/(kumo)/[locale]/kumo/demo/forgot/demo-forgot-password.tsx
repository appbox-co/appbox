"use client"

import { useMemo } from "react"
import {
  SAMPLE_REQUEST_STATES,
  sampleForgotPasswordActions
} from "../_lib/sample-auth"
import { SampleStatePicker, useSampleState } from "../_lib/sample-state"
import { AuthFrame } from "../../_components/auth/auth-frame"
import { ForgotPasswordView } from "../../_components/auth/forgot-password-view"

export function DemoForgotPassword() {
  const state = useSampleState(SAMPLE_REQUEST_STATES)
  const actions = useMemo(() => sampleForgotPasswordActions(state), [state])

  return (
    <AuthFrame
      demo
      currentDesignHref="/forgot"
      sample={
        <SampleStatePicker states={SAMPLE_REQUEST_STATES} value={state} />
      }
    >
      <ForgotPasswordView key={state} actions={actions} />
    </AuthFrame>
  )
}
