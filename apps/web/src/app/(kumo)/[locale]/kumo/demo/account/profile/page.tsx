import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoProfile } from "./demo-profile"

/** Sample-data version of the Kumo profile page. Dev server only: it needs no session. */
export default function KumoDemoProfilePage() {
  if (process.env.NODE_ENV === "production") notFound()

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoProfile />
    </Suspense>
  )
}
