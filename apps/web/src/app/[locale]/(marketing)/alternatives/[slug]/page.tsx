import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAlternativePage, getAlternativePages } from "@/api/appbox/alternative-pages"
import { getPlans } from "@/api/appbox/plans"
import { BlockRenderer } from "@/components/marketing/app-blocks/block-renderer"
import { VersionsTable } from "@/components/marketing/app-blocks/versions-table"
import { siteConfig } from "@/config/site"
import { routing } from "@/i18n/routing"
import { getEligiblePlanOptions } from "@/lib/appbox/eligible-plans"
import {
  extractMeta,
  markdownToPlainText,
  parseMarketingBlocks,
  renderableMarketingBlocks
} from "@/lib/marketing/marketing-content"
import { absoluteUrl } from "@/lib/utils"

interface AlternativePageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
}

function getAppIconUrl(iconImage?: string): string | undefined {
  if (!iconImage) return undefined
  if (iconImage.startsWith("http")) return iconImage
  return `https://api.appbox.co/assets/images/apps/icons/${iconImage}`
}

export async function generateStaticParams() {
  try {
    const pages = await getAlternativePages()
    return routing.locales.flatMap((locale) =>
      pages.map((page) => ({
        locale,
        slug: page.slug
      }))
    )
  } catch {
    return []
  }
}

export async function generateMetadata({
  params
}: AlternativePageProps): Promise<Metadata> {
  const { locale, slug } = await params

  try {
    const page = await getAlternativePage(slug)
    const app = page.app
    const blocks = parseMarketingBlocks(page.alternative_content)
    const meta = blocks ? extractMeta(blocks) : null
    const plainDescription = markdownToPlainText(app.description)
    const truncatedDescription =
      plainDescription.length > 155
        ? `${plainDescription.substring(0, 152)}...`
        : plainDescription
    const title =
      meta?.title ||
      `${app.display_name} as a ${page.target_keyword} - ${siteConfig.name}`
    const description =
      meta?.description ||
      `Compare ${app.display_name} with ${page.competitor_name}. ${truncatedDescription}`
    const ogImage = getAppIconUrl(app.icon_image) || siteConfig.og.image

    return {
      title,
      description,
      keywords: meta?.keywords,
      alternates: {
        canonical: absoluteUrl(`/${locale}/alternatives/${page.slug}`)
      },
      openGraph: {
        type: "website",
        title,
        url: absoluteUrl(`/${locale}/alternatives/${page.slug}`),
        description,
        images: [
          {
            url: ogImage,
            alt: `${app.display_name} - ${siteConfig.name}`
          }
        ]
      }
    }
  } catch {
    return {}
  }
}

export default async function AlternativePage({ params }: AlternativePageProps) {
  const { slug } = await params

  let page
  try {
    page = await getAlternativePage(slug)
  } catch (error) {
    console.error("Error fetching alternative page:", error)
    notFound()
  }

  if (!page?.app) {
    notFound()
  }

  const app = page.app
  const marketingBlocks = parseMarketingBlocks(page.alternative_content)
  if (!marketingBlocks) {
    notFound()
  }

  const meta = extractMeta(marketingBlocks)
  const renderBlocks = renderableMarketingBlocks(marketingBlocks)
  if (renderBlocks.length === 0) {
    notFound()
  }

  const imageUrl = getAppIconUrl(app.icon_image)
  const versions = app.versions ?? []
  const defaultVersion =
    versions.find((version) => version.version === app.version) ?? versions[0]
  const baseMemory = defaultVersion?.memory ?? 0
  const baseCpus = defaultVersion?.cpus ?? 0
  const plansData = await getPlans()
  const eligiblePlans = getEligiblePlanOptions(
    plansData,
    app.display_name,
    app.categories
  )

  return (
    <div className="max-w-container container mx-auto px-4 pt-6 sm:px-6 lg:px-8">
      <BlockRenderer
        blocks={renderBlocks}
        appName={app.display_name}
        appId={app.id}
        iconUrl={imageUrl}
        installPreview={meta?.install_preview ?? undefined}
        customFields={app.customFields ?? undefined}
        appSlots={app.app_slots}
        requiresDomain={app.RequiresDomain === 1}
        domainPlaceholders={{
          subdomain: app.subdomain,
          appboxDomain: "steve.appboxes.co",
          customDomain: "cloud.example.com"
        }}
        preinstallDescription={app.custom_field_preinstall_description}
        baseMemory={baseMemory}
        baseCpus={baseCpus}
        eligiblePlans={eligiblePlans}
      />

      {versions.length > 0 && (
        <VersionsTable versions={versions} appSlotsFallback={app.app_slots} />
      )}
    </div>
  )
}
