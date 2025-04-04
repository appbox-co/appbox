import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { allDocs } from "contentlayer/generated"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"
import "@/styles/mdx.css"
import { DocBreadcrumb } from "@/components/docs/breadcrumb"
import { DocHeading } from "@/components/docs/heading"
import { DocLinks } from "@/components/docs/links"
import { Mdx } from "@/components/docs/mdx"
import { DocumentNotFound } from "@/components/docs/not-found"
import { DocsPager } from "@/components/docs/pager"
import { DashboardTableOfContents } from "@/components/docs/toc"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { siteConfig } from "@/config/site"
import { routing } from "@/i18n/routing"
import { DocPageProps } from "@/lib/opendocs/types/docs"
import { getDocFromParams } from "@/lib/opendocs/utils/doc"
import { getTableOfContents } from "@/lib/opendocs/utils/toc"
import { absoluteUrl } from "@/lib/utils"

export const dynamicParams = true

export async function generateMetadata(props: DocPageProps): Promise<Metadata> {
  const params = await props.params
  const locale = params.locale

  setRequestLocale(locale || routing.defaultLocale)

  const doc = await getDocFromParams({ params })

  if (!doc) {
    return {}
  }

  const [, ...docSlugList] = doc.slugAsParams.split("/")
  const docSlug = docSlugList.join("/") || ""

  return {
    title: doc.title,
    description: doc.description,

    openGraph: {
      type: "article",
      title: doc.title,
      url: absoluteUrl(`/${locale}/docs/${docSlug}`),
      description: doc.description,

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

export async function generateStaticParams(): Promise<
  DocPageProps["params"][]
> {
  const docs = allDocs.map((doc) => {
    const [locale, ...slugs] = doc.slugAsParams.split("/")

    return {
      slug: slugs,
      locale: locale as LocaleOptions
    }
  })

  return docs
}

export default async function DocPage(props: DocPageProps) {
  const params = await props.params
  setRequestLocale(params.locale || routing.defaultLocale)
  const t = await getTranslations("docs")

  // If no slug is provided, render a documentation index page with sections
  if (!params.slug || params.slug.length === 0) {
    // Get unique sections from all docs and track their first documents
    const docsBySection = new Map<
      string,
      {
        title: string
        description: string
        count: number
        firstDocSlug: string
        lowestSortValue?: number
      }
    >()

    const docsInLocale = allDocs.filter((doc) =>
      doc.slugAsParams.startsWith(params.locale || "en")
    )

    // First pass to identify sections and their first documents
    docsInLocale.forEach((doc) => {
      const [, section, ...rest] = doc.slugAsParams.split("/")

      if (section) {
        const docPath =
          rest.length > 0 ? `${section}/${rest.join("/")}` : section

        if (!docsBySection.has(section)) {
          docsBySection.set(section, {
            title: section.charAt(0).toUpperCase() + section.slice(1),
            description: `Documentation about ${section}`,
            count: 1,
            firstDocSlug: docPath,
            lowestSortValue:
              doc.sort !== undefined ? doc.sort : Number.MAX_SAFE_INTEGER
          })
        } else {
          const existing = docsBySection.get(section)!

          // Update the firstDocSlug if this document has a lower sort value
          // or if no sort values exist, keep the original behavior
          let newFirstDocSlug = existing.firstDocSlug
          let newLowestSortValue = existing.lowestSortValue

          if (
            doc.sort !== undefined &&
            (existing.lowestSortValue === undefined ||
              doc.sort < existing.lowestSortValue)
          ) {
            newFirstDocSlug = docPath
            newLowestSortValue = doc.sort
          }

          docsBySection.set(section, {
            ...existing,
            count: existing.count + 1,
            firstDocSlug: newFirstDocSlug,
            lowestSortValue: newLowestSortValue
          })
        }
      }
    })

    const sections = Array.from(docsBySection.entries())

    return (
      <main className="relative py-6 lg:gap-10 lg:py-8">
        <div className="mx-auto w-full min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("index.title")}
          </h1>

          <div className="mb-8 mt-4">
            <p className="text-muted-foreground text-lg">
              {t("index_description")}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  {t("index.section")}
                </TableHead>
                <TableHead>{t("index.description")}</TableHead>
                <TableHead className="w-[100px] text-right">
                  {t("index.documents")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map(([section, info]) => (
                <TableRow key={section}>
                  <TableCell className="font-medium">{info.title}</TableCell>
                  <TableCell>{info.description}</TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`/${params.locale}/docs/${info.firstDocSlug}`}
                      className="focus-visible:ring-ring ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {t("index.view")}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    )
  }

  const doc = await getDocFromParams({ params })

  if (!doc) {
    return (
      <DocumentNotFound
        messages={{
          title: t("not_found.title"),
          description: t("not_found.description")
        }}
      />
    )
  }

  const toc = await getTableOfContents(doc.body.raw)

  return (
    <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
      <div className="mx-auto w-full min-w-0">
        <DocBreadcrumb
          doc={doc}
          messages={{
            docs: t("docs")
          }}
        />

        <DocHeading doc={doc} locale={params.locale} />
        <DocLinks doc={doc} />

        <div className="pb-12 pt-8">
          <Mdx code={doc.body.code} />
        </div>

        <DocsPager doc={doc} locale={params.locale} />
      </div>

      {doc.toc && (
        <div className="hidden text-sm xl:block">
          <div className="sticky top-16 -mt-10 pt-4">
            <ScrollArea className="pb-10">
              <div className="sticky top-16 -mt-10 h-fit py-12">
                <DashboardTableOfContents
                  toc={toc}
                  sourceFilePath={doc._raw.sourceFilePath}
                  messages={{
                    onThisPage: t("on_this_page"),
                    editPageOnGitHub: t("edit_page_on_github"),
                    startDiscussionOnGitHub: t("start_discussion_on_github")
                  }}
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </main>
  )
}
