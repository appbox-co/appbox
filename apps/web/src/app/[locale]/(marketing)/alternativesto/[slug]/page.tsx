import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Script from "next/script"
import {
  getAlternativePage,
  getAlternativePages,
  type AlternativePageDetails
} from "@/api/appbox/alternative-pages"
import { AlternativeList } from "@/components/marketing/alternative-list"
import { BlockRenderer } from "@/components/marketing/app-blocks/block-renderer"
import { siteConfig } from "@/config/site"
import { routing } from "@/i18n/routing"
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

function getAlternativeName(
  alternative: AlternativePageDetails["alternatives"][number]
) {
  return alternative.type === "appbox_app"
    ? alternative.app.display_name
    : alternative.name
}

function getAlternativePageStructuredData(
  page: AlternativePageDetails,
  locale: string
) {
  const title =
    page.seo_title ||
    `Best ${page.competitor_name} alternatives - ${siteConfig.name}`
  const description =
    page.seo_description ||
    page.summary ||
    `Compare ${page.competitor_name} alternatives, including Appbox apps and external tools.`
  const url = absoluteUrl(`/${locale}/alternativesto/${page.slug}`)

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    keywords: page.seo_keywords,
    url,
    mainEntityOfPage: url,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: absoluteUrl("/")
    },
    about: {
      "@type": "Thing",
      name: `${page.competitor_name} alternatives`
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: page.alternatives.map((alternative, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: getAlternativeName(alternative)
      }))
    }
  }
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
    const blocks = parseMarketingBlocks(page.content)
    const meta = blocks ? extractMeta(blocks) : null
    const firstMarkdown = blocks?.find((block) => block.type === "markdown")
    const plainDescription =
      firstMarkdown?.type === "markdown"
        ? markdownToPlainText(firstMarkdown.content)
        : ""
    const truncatedDescription =
      plainDescription.length > 155
        ? `${plainDescription.substring(0, 152)}...`
        : plainDescription
    const title =
      page.seo_title ||
      meta?.title ||
      `Best ${page.competitor_name} alternatives - ${siteConfig.name}`
    const description =
      page.seo_description ||
      meta?.description ||
      truncatedDescription ||
      `Compare ${page.competitor_name} alternatives, including Appbox apps and external tools.`
    const keywords =
      page.seo_keywords && page.seo_keywords.length > 0
        ? page.seo_keywords
        : meta?.keywords

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical: absoluteUrl(`/${locale}/alternativesto/${page.slug}`)
      },
      openGraph: {
        type: "website",
        title,
        url: absoluteUrl(`/${locale}/alternativesto/${page.slug}`),
        description,
        images: [
          {
            url: siteConfig.og.image,
            alt: `${page.competitor_name} alternatives - ${siteConfig.name}`
          }
        ]
      }
    }
  } catch {
    return {}
  }
}

export default async function AlternativePage({
  params
}: AlternativePageProps) {
  const { locale, slug } = await params

  let page
  try {
    page = await getAlternativePage(slug)
  } catch (error) {
    console.error("Error fetching alternative page:", error)
    notFound()
  }

  const marketingBlocks = parseMarketingBlocks(page.content)
  if (!marketingBlocks) {
    notFound()
  }

  const renderBlocks = renderableMarketingBlocks(marketingBlocks)
  if (renderBlocks.length === 0 && page.alternatives.length === 0) {
    notFound()
  }
  const hasStructuredAlternativeSections = renderBlocks.some(
    (block) => block.type === "alternative_sections"
  )
  const structuredData = getAlternativePageStructuredData(page, locale)

  return (
    <div className="max-w-container container mx-auto px-4 pt-6 sm:px-6 lg:px-8">
      <Script
        id="alternative-page-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {renderBlocks.length > 0 && (
        <BlockRenderer blocks={renderBlocks} appName="" appId={0} />
      )}

      {!hasStructuredAlternativeSections && (
        <AlternativeList
          competitorName={page.competitor_name}
          alternatives={page.alternatives}
        />
      )}
    </div>
  )
}
