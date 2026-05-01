import { getTranslations } from "next-intl/server"
import { getApps } from "@/api/appbox/apps"
import { ClientAppConnections } from "./client-app-connections"

interface AppConnectionsSectionProps {
  headline1: string
  headline2: string
  description: string
}

export async function AppConnectionsSection({
  headline1,
  headline2,
  description
}: AppConnectionsSectionProps) {
  const t = await getTranslations("home.connections_section")
  // Fetch apps on the server side
  const apps = await getApps().catch(() => [])

  // Sort and select apps with icons on the server side
  const filteredApps = apps
    .filter((app) => app.icon_image)
    .slice(0, Math.min(apps.length, 8))

  return (
    <ClientAppConnections
      apps={filteredApps}
      headline1={headline1}
      headline2={headline2}
      description={description}
      visualTitle={t("visual_title")}
      visualDescription={t("visual_description")}
      highlights={[
        {
          title: t("highlights.shared_filesystem.title"),
          description: t("highlights.shared_filesystem.description")
        },
        {
          title: t("highlights.private_network.title"),
          description: t("highlights.private_network.description")
        },
        {
          title: t("highlights.cross_app_workflows.title"),
          description: t("highlights.cross_app_workflows.description")
        }
      ]}
    />
  )
}
