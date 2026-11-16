import { notFound } from "next/navigation"
import { DemoAppDetail } from "./demo-app-detail"

interface PageProps {
  params: Promise<{ id: string }>
}

/** Sample-data version of the Kumo app page. Dev server only: it needs no session. */
export default async function KumoDemoAppPage({ params }: PageProps) {
  if (process.env.NODE_ENV === "production") notFound()

  const { id } = await params
  return <DemoAppDetail id={Number(id)} />
}
