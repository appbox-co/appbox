"use client"

import { AppGridCard } from "@/components/app-grid-card"
import { useTranslations } from "next-intl"

interface App {
  display_name: string
  publisher: string
  description: string
  icon_image: string
  app_slots: number
  categories: string[]
}

interface AppGridProps {
  apps: App[]
  isLoading: boolean
  error: Error | null | unknown
}

export function AppGrid({ apps, isLoading, error }: AppGridProps) {
  const t = useTranslations()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p>{t("apps.loading")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-red-500">
          <p>{t("apps.error")}</p>
        </div>
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p>{t("apps.no_results")}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {apps.map((app) => (
        <AppGridCard
          key={app.display_name}
          name={app.display_name}
          publisher={app.publisher}
          description={app.description}
          iconUrl={app.icon_image}
          appSlots={app.app_slots}
          categories={app.categories || []}
        />
      ))}
    </div>
  )
}
