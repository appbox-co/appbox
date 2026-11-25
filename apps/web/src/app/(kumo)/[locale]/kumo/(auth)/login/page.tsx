"use client"

import { Suspense } from "react"
import { AuthFrame } from "../../_components/auth/auth-frame"
import { SignInView } from "../../_components/auth/sign-in-view"

/** useSearchParams needs a Suspense boundary above it. */
export default function KumoSignInPage() {
  return (
    <Suspense>
      <AuthFrame currentDesignHref="/login">
        <SignInView />
      </AuthFrame>
    </Suspense>
  )
}
