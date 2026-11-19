import type { ReactNode } from "react"
import { SampleWall } from "../_lib/sample-wall"

export default function Layout({ children }: { children: ReactNode }) {
  return <SampleWall>{children}</SampleWall>
}
