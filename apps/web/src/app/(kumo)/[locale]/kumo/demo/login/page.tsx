import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoSignIn } from "./demo-sign-in"

/** Sample version of the Kumo sign-in page. Dev server only; nothing typed is sent. */
export default function KumoDemoSignInPage() {
  if (process.env.NODE_ENV === "production") notFound()

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoSignIn />
    </Suspense>
  )
}
