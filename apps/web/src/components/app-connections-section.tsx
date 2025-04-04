import { getApps } from "@/lib/appbox/api/getApps"
import { ClientAppConnections } from "./client-app-connections"

interface AppConnectionsSectionProps {
  title: string
  description: string
}

export async function AppConnectionsSection({
  title,
  description
}: AppConnectionsSectionProps) {
  // Fetch apps on the server side
  const apps = await getApps().catch(() => [])

  // Sort and select apps with icons on the server side
  const filteredApps = apps
    .filter((app) => app.icon_image)
    .slice(0, Math.min(apps.length, 8))

  return (
    <ClientAppConnections
      apps={filteredApps}
      title={title}
      description={description}
    />
  )
}
