"use client"

import { Suspense } from "react"
import { AuthFrame } from "../../../_components/auth/auth-frame"
import { EmailSentView } from "../../../_components/auth/email-sent-view"

/** useSearchParams (in the frame) needs a Suspense boundary above it. */
export default function KumoEmailSentPage() {
  return (
    <Suspense>
      <AuthFrame demo={false} currentDesignHref="/forgot/emailsent">
        <EmailSentView />
      </AuthFrame>
    </Suspense>
  )
}
