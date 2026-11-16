import { notFound } from "next/navigation"
import { DemoHome } from "./demo-home"

/**
 * Sample-data version of the Kumo home prototype. It needs no session, so it
 * is only served by the dev server.
 */
export default function KumoDemoPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return <DemoHome />
}
