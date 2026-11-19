import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoInstalledApp } from "./demo-installed-app"

interface KumoDemoInstalledAppPageProps {
  params: Promise<{ id: string }>
}

/** Sample-data version of the Kumo installed app page. Dev server only: it needs no session. */
export default async function KumoDemoInstalledAppPage({
  params
}: KumoDemoInstalledAppPageProps) {
  if (process.env.NODE_ENV === "production") notFound()
  const { id } = await params

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoInstalledApp id={Number(id)} />
    </Suspense>
  )
}
