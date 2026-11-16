import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoForgotPassword } from "./demo-forgot-password"

/** Sample version of the Kumo forgot password page. Dev server only; nothing typed is sent. */
export default function KumoDemoForgotPasswordPage() {
  if (process.env.NODE_ENV === "production") notFound()

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoForgotPassword />
    </Suspense>
  )
}
