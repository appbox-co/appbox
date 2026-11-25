"use client"

import { Suspense, useMemo } from "react"
import { useLocale } from "next-intl"
import { localiseDestination } from "../_lib/localise-destination"
import { signInActions } from "../../_components/auth/auth-actions"
import { AuthFrame } from "../../_components/auth/auth-frame"
import { SignInView } from "../../_components/auth/sign-in-view"

function KumoSignIn() {
  const locale = useLocale()
  const actions = useMemo(
    () =>
      signInActions((destination) => localiseDestination(destination, locale)),
    [locale]
  )

  return (
    <AuthFrame currentDesignHref="/login">
      <SignInView actions={actions} />
    </AuthFrame>
  )
}

/** useSearchParams needs a Suspense boundary above it. */
export default function KumoSignInPage() {
  return (
    <Suspense>
      <KumoSignIn />
    </Suspense>
  )
}
