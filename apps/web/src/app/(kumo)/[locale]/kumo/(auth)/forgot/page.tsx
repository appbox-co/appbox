"use client"

import { Suspense } from "react"
import { AuthFrame } from "../../_components/auth/auth-frame"
import { ForgotPasswordView } from "../../_components/auth/forgot-password-view"

/** useSearchParams (in the frame) needs a Suspense boundary above it. */
export default function KumoForgotPasswordPage() {
  return (
    <Suspense>
      <AuthFrame currentDesignHref="/forgot">
        <ForgotPasswordView />
      </AuthFrame>
    </Suspense>
  )
}
