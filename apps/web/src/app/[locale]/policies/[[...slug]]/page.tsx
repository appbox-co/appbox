import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { allPolicies } from "contentlayer/generated"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"
import "@/styles/mdx.css"
import { Mdx } from "@/components/docs/mdx"
import { DocumentNotFound } from "@/components/docs/not-found"
import { DashboardTableOfContents } from "@/components/docs/toc"
import { PolicyBreadcrumb } from "@/components/policies/breadcrumb"
import { PolicyHeading } from "@/components/policies/heading"
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
import { getPolicyFromParams } from "@/lib/opendocs/utils/policy"
import { getTableOfContents } from "@/lib/opendocs/utils/toc"
import { absoluteUrl } from "@/lib/utils"

export const dynamicParams = true

interface PolicyPageProps {
  params: Promise<{
    slug?: string[]
    locale: LocaleOptions
  }>
}

export async function generateMetadata(
  props: PolicyPageProps
): Promise<Metadata> {
  const params = await props.params
  const locale = params.locale

  setRequestLocale(locale || routing.defaultLocale)

  const policy = await getPolicyFromParams({ params })

  if (!policy) {
    return {}
  }

  const [, ...policySlugList] = policy.slugAsParams.split("/")
  const policySlug = policySlugList.join("/") || ""

  return {
    title: policy.title,
    description: policy.description,

    openGraph: {
      type: "article",
      title: policy.title,
      url: absoluteUrl(`/${locale}/policies/${policySlug}`),
      description: policy.description,

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
  { slug?: string[]; locale: LocaleOptions }[]
> {
  const policies = allPolicies.map((policy) => {
    const [locale, ...slugs] = policy.slugAsParams.split("/")

    return {
      slug: slugs,
      locale: locale as LocaleOptions
    }
  })

  // Return plain objects, not Promises
  return policies
}

export default async function PolicyPage(props: PolicyPageProps) {
  const params = await props.params
  setRequestLocale(params.locale || routing.defaultLocale)

  // If no slug is provided, render a policy index page
  if (!params.slug || params.slug.length === 0) {
    const policies = allPolicies
      .filter((policy) => policy.slugAsParams.startsWith(params.locale || "en"))
      .sort((a, b) => a.title.localeCompare(b.title)) // Sort alphabetically by title

    return (
      <main className="relative py-6 lg:gap-10 lg:py-8">
        <div className="mx-auto w-full min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Policies</h1>

          <div className="mb-8 mt-4">
            <p className="text-muted-foreground text-lg">
              These policies govern your use of Appbox services and outline our
              commitments to you. They include important information about
              privacy, security, and your responsibilities as a user.
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Policy</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => {
                const [_locale, ...slugs] = policy.slugAsParams.split("/")
                const policySlug = slugs.join("/")

                return (
                  <TableRow key={policy._id}>
                    <TableCell className="font-medium">
                      {policy.title}
                    </TableCell>
                    <TableCell>{policy.description}</TableCell>
                    <TableCell className="text-right">
                      <a
                        href={`/${params.locale}/policies/${policySlug}`}
                        className="focus-visible:ring-ring ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      >
                        View
                      </a>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </main>
    )
  }

  const policy = await getPolicyFromParams({ params })
  const t = await getTranslations("docs")

  if (!policy) {
    return (
      <DocumentNotFound
        messages={{
          title: t("not_found.title"),
          description: t("not_found.description")
        }}
      />
    )
  }

  const toc = await getTableOfContents(policy.body.raw)

  const policyWithToc = {
    ...policy,
    notAvailable: false
  }

  return (
    <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
      <div className="mx-auto w-full min-w-0">
        <PolicyBreadcrumb policy={policy} locale={params.locale} />

        <PolicyHeading policy={policyWithToc} locale={params.locale} />

        <div className="pb-12 pt-8">
          <Mdx code={policy.body.code} />
        </div>
      </div>

      {toc && toc.items && toc.items.length > 0 && (
        <div className="hidden text-sm xl:block">
          <div className="sticky top-16 -mt-10 pt-4">
            <ScrollArea className="pb-10">
              <div className="sticky top-16 -mt-10 h-fit py-12">
                <DashboardTableOfContents
                  toc={toc}
                  sourceFilePath={policy._raw.sourceFilePath}
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
