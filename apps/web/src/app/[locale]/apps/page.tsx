import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AppFilterClient } from "@/components/app-filter-client"
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading
} from "@/components/page-header"
import { siteConfig } from "@/config/site"
import { getApps } from "@/lib/appbox/api/getApps"
import { App } from "@/lib/appbox/api/useApps"
import { absoluteUrl } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations("apps")

  const title = `${t("title")} - ${siteConfig.name}`
  const description = t("meta_description")

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      url: absoluteUrl(`/${params.locale}/apps`),
      description,
      images: [
        {
          ...siteConfig.og.size,
          url: siteConfig.og.image,
          alt: siteConfig.name
        }
      ]
    }
  }
}

export default async function AppsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations("apps")

  // Fetch all apps on the server
  let apps: App[] = []
  try {
    apps = await getApps(true)
  } catch (error) {
    console.error("Error fetching apps:", error)
  }

  // Get filter parameters from URL - properly await searchParams
  const params = await searchParams
  const categoryFilter = params.category as string | undefined
  const searchFilter = params.search as string | undefined

  // Extract all unique categories
  const categories = apps
    .reduce((allCategories: string[], app: App) => {
      if (app.categories && app.categories.length) {
        app.categories.forEach((category: string) => {
          if (!allCategories.includes(category)) {
            allCategories.push(category)
          }
        })
      }
      return allCategories
    }, [])
    .sort()

  return (
    <div className="container relative">
      <PageHeader>
        <PageHeaderHeading>{t("title")}</PageHeaderHeading>
        <PageHeaderDescription>{t("description")}</PageHeaderDescription>
      </PageHeader>

      <AppFilterClient
        initialApps={apps}
        categories={categories}
        initialCategory={categoryFilter}
        initialSearch={searchFilter}
      />
    </div>
  )
}
