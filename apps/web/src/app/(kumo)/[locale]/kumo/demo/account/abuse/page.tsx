import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoAbuseReports } from "./demo-abuse-reports"

/** Sample-data version of the Kumo abuse reports page. Dev server only: it needs no session. */
export default function KumoDemoAbuseReportsPage() {
  if (process.env.NODE_ENV === "production") notFound()

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoAbuseReports />
    </Suspense>
  )
}
