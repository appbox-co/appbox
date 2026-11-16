import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoDomains } from "./demo-domains"

/** Sample-data version of the Kumo custom domains page. Dev server only: it needs no session. */
export default function KumoDemoDomainsPage() {
  if (process.env.NODE_ENV === "production") notFound()

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoDomains />
    </Suspense>
  )
}
