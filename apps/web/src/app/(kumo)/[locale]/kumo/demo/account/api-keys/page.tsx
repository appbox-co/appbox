import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoApiKeys } from "./demo-api-keys"

/** Sample-data version of the Kumo API keys page. Dev server only: it needs no session. */
export default function KumoDemoApiKeysPage() {
  if (process.env.NODE_ENV === "production") notFound()

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoApiKeys />
    </Suspense>
  )
}
