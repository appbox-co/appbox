import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoAppStore } from "./demo-app-store"

/** Sample-data version of the Kumo App Store. Dev server only: it needs no session. */
export default function KumoDemoAppStorePage() {
  if (process.env.NODE_ENV === "production") notFound()

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoAppStore />
    </Suspense>
  )
}
