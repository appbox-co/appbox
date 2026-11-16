import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoAbuseReport } from "./demo-abuse-report"

interface KumoDemoAbuseReportPageProps {
  params: Promise<{ id: string }>
}

/** Sample-data version of the Kumo abuse report page. Dev server only: it needs no session. */
export default async function KumoDemoAbuseReportPage({
  params
}: KumoDemoAbuseReportPageProps) {
  if (process.env.NODE_ENV === "production") notFound()
  const { id } = await params

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoAbuseReport id={Number(id)} />
    </Suspense>
  )
}
