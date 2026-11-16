import type { ReactNode } from "react"
import { WallAppsProvider } from "../../_components/auth/app-wall"
import { toWallApps } from "../../_components/auth/wall-apps"
import { catalogue } from "../fixtures"

const apps = toWallApps(catalogue)

/** The sample catalogue for the signed-out pages' app wall. */
export function SampleWall({ children }: { children: ReactNode }) {
  return <WallAppsProvider apps={apps}>{children}</WallAppsProvider>
}
