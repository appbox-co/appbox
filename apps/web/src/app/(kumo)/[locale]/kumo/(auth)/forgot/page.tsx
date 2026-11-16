"use client"

import { Suspense } from "react"
import { liveForgotPasswordActions } from "../../_components/auth/auth-actions"
import { AuthFrame } from "../../_components/auth/auth-frame"
import { ForgotPasswordView } from "../../_components/auth/forgot-password-view"

/** useSearchParams (in the frame) needs a Suspense boundary above it. */
export default function KumoForgotPasswordPage() {
  return (
    <Suspense>
      <AuthFrame demo={false} currentDesignHref="/forgot">
        <ForgotPasswordView actions={liveForgotPasswordActions} />
      </AuthFrame>
    </Suspense>
  )
}
