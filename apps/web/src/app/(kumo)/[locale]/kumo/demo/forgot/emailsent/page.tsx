import { Suspense } from "react"
import { notFound } from "next/navigation"
import { AuthFrame } from "../../../_components/auth/auth-frame"
import { EmailSentView } from "../../../_components/auth/email-sent-view"

/** Sample version of the Kumo "check your email" page. Dev server only. */
export default function KumoDemoEmailSentPage() {
  if (process.env.NODE_ENV === "production") notFound()

  // useSearchParams (in the frame) needs a Suspense boundary above it.
  return (
    <Suspense>
      <AuthFrame demo currentDesignHref="/forgot/emailsent">
        <EmailSentView />
      </AuthFrame>
    </Suspense>
  )
}
