"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import { AuthFrame } from "../../../../_components/auth/auth-frame"
import { ResetPasswordView } from "../../../../_components/auth/reset-password-view"

function KumoResetPassword() {
  const { token } = useParams<{ token: string }>()

  return (
    <AuthFrame
      currentDesignHref={`/forgot/verify/${encodeURIComponent(token)}`}
    >
      <ResetPasswordView token={token} />
    </AuthFrame>
  )
}

/** useSearchParams (in the frame) needs a Suspense boundary above it. */
export default function KumoResetPasswordPage() {
  return (
    <Suspense>
      <KumoResetPassword />
    </Suspense>
  )
}
