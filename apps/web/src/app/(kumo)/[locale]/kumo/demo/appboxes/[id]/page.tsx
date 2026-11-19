import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoAppbox } from "./demo-appbox"

interface KumoDemoAppboxPageProps {
  params: Promise<{ id: string }>
}

/** Sample-data version of the Kumo Appbox page. Dev server only: it needs no session. */
export default async function KumoDemoAppboxPage({
  params
}: KumoDemoAppboxPageProps) {
  if (process.env.NODE_ENV === "production") notFound()
  const { id } = await params

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoAppbox id={Number(id)} />
    </Suspense>
  )
}
