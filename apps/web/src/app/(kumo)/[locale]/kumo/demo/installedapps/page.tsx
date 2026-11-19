import { notFound } from "next/navigation"
import { DemoInstalledApps } from "./demo-installed-apps"

/** Sample-data version of the Kumo installed apps page. Dev server only: it needs no session. */
export default function KumoDemoInstalledAppsPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return <DemoInstalledApps />
}
