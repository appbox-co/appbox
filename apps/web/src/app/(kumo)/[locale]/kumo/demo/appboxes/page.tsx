import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoAppboxes } from "./demo-appboxes"

/** Sample-data version of the Kumo Appboxes page. Dev server only: it needs no session. */
export default function KumoDemoAppboxesPage() {
  if (process.env.NODE_ENV === "production") notFound()

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoAppboxes />
    </Suspense>
  )
}
