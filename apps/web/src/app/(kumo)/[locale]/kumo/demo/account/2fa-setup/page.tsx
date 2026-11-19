import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoTwoFactor } from "./demo-two-factor"

/** Sample-data version of the Kumo two-factor page. Dev server only: it needs no session. */
export default function KumoDemoTwoFactorPage() {
  if (process.env.NODE_ENV === "production") notFound()

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoTwoFactor />
    </Suspense>
  )
}
