import type { ReactNode } from "react"
import { getApps } from "@/api/appbox/apps"
import { WallAppsProvider } from "../_components/auth/app-wall"
import { toWallApps } from "../_components/auth/wall-apps"

/**
 * The signed-out pages' app wall, from the public catalogue (no session
 * needed; cached for an hour, as on the marketing pages).
 */
export default async function KumoAuthLayout({
  children
}: {
  children: ReactNode
}) {
  const apps = toWallApps(await getApps(true))

  return <WallAppsProvider apps={apps}>{children}</WallAppsProvider>
}
