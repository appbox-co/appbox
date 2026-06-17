import type { Metadata } from "next"
import Script from "next/script"
import {
  getAlternativePages,
  type AlternativePageSummary
} from "@/api/appbox/alternative-pages"
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading
} from "@/components/marketing/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle
} from "@/components/ui/card"
import { CardLinkHint } from "@/components/ui/card-link-hint"
import { siteConfig } from "@/config/site"
import { Link } from "@/i18n/routing"
import { absoluteUrl } from "@/lib/utils"

interface AlternativesIndexPageProps {
  params: Promise<{
    locale: string
  }>
}

function getCompetitorInitials(name: string) {
  const initials = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return initials || name.slice(0, 2).toUpperCase()
}

function getAlternativePageMetadata(page: AlternativePageSummary) {
  return {
    description:
      page.summary ??
      page.seo_description ??
      `Compare Appbox-hosted and external options for teams evaluating ${page.competitor_name}.`,
    tags:
      page.tags && page.tags.length > 0
        ? page.tags
        : ["App comparison", "Appbox options"]
  }
}

export async function generateMetadata({
  params
}: AlternativesIndexPageProps): Promise<Metadata> {
  const { locale } = await params
  const title = `App alternatives and comparisons - ${siteConfig.name}`
  const description =
    "Compare Appbox-hosted apps with popular SaaS and self-hosted alternatives."
  const pages = await getSortedAlternativePages()
  const keywords = Array.from(
    new Set([
      "app alternatives",
      "self-hosted alternatives",
      "appbox alternatives",
      ...pages.flatMap((page) => page.seo_keywords ?? []),
      ...pages.map((page) => page.target_keyword)
    ])
  )

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: absoluteUrl(`/${locale}/alternativesto`)
    },
    openGraph: {
      type: "website",
      title,
      url: absoluteUrl(`/${locale}/alternativesto`),
      description,
      images: [
        {
          url: siteConfig.og.image,
          alt: `${siteConfig.name} app alternatives`
        }
      ]
    }
  }
}

async function getSortedAlternativePages(): Promise<AlternativePageSummary[]> {
  try {
    const pages = await getAlternativePages()
    return [...pages].sort((a, b) =>
      a.competitor_name.localeCompare(b.competitor_name)
    )
  } catch (error) {
    console.error("Error fetching alternative pages:", error)
    return []
  }
}

function getHubStructuredData(pages: AlternativePageSummary[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "App alternatives",
    description:
      "Compare Appbox-hosted apps with popular SaaS and self-hosted alternatives.",
    url: absoluteUrl("/alternativesto"),
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: absoluteUrl("/")
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: pages.map((page, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${page.competitor_name} alternatives`,
        url: absoluteUrl(`/alternativesto/${page.slug}`)
      }))
    }
  }
}

export default async function AlternativesIndexPage() {
  const pages = await getSortedAlternativePages()
  const structuredData = getHubStructuredData(pages)

  return (
    <div className="max-w-container container mx-auto space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Script
        id="alternatives-hub-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <PageHeader className="py-12 md:pb-12">
        <p className="mb-3 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          App comparisons
        </p>
        <PageHeaderHeading>App alternatives</PageHeaderHeading>
        <PageHeaderDescription>
          Compare Appbox-hosted apps with popular SaaS and self-hosted tools so
          you can choose the right level of control, convenience, and hosting.
        </PageHeaderDescription>
      </PageHeader>

      {pages.length > 0 ? (
        <section aria-label="Alternative comparison guides">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pages.map((page) => {
              const metadata = getAlternativePageMetadata(page)

              return (
                <Card
                  key={page.slug}
                  className="card-glow h-full overflow-hidden"
                >
                  <Link
                    href={`/alternativesto/${page.slug}`}
                    className="group flex h-full flex-col no-underline outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start gap-4 p-5 pb-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-linear-to-br from-primary/20 via-primary/10 to-transparent text-sm font-bold text-primary shadow-xs">
                        {getCompetitorInitials(page.competitor_name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-base leading-snug transition-colors group-hover:text-primary">
                            {page.competitor_name} alternatives
                          </CardTitle>
                          <CardLinkHint className="mt-0.5" />
                        </div>
                        <CardDescription className="mt-2 text-sm leading-6">
                          {metadata.description}
                        </CardDescription>
                      </div>
                    </div>

                    <CardContent className="flex grow flex-col justify-end px-5 pb-5 pt-0">
                      <div className="mt-2 flex flex-wrap gap-2">
                        {metadata.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed bg-card p-8 text-center shadow-sm">
          <h2 className="text-2xl font-semibold">
            Alternative guides are coming soon
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            We are preparing comparison pages for Appbox-hosted alternatives.
            Check back soon for service-by-service guidance.
          </p>
        </section>
      )}
    </div>
  )
}
