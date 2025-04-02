'use client'

import { useTranslations } from 'next-intl'
import { AppGridCard } from '@/components/app-grid-card'

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
  error: any
}

export function AppGrid({ apps, isLoading, error }: AppGridProps) {
  const t = useTranslations()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent mb-4"></div>
          <p>{t('apps.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <p>{t('apps.error')}</p>
        </div>
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>{t('apps.no_results')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
