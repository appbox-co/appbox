import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ExternalLink } from "lucide-react"
import { getAppDetails } from "@/api/appbox/app-details"
import { getPlans } from "@/api/appbox/plans"
import { BlockRenderer } from "@/components/marketing/app-blocks/block-renderer"
import { VersionsTable } from "@/components/marketing/app-blocks/versions-table"
import ClientStarRating from "@/components/marketing/client-star-rating"
import DeployButton from "@/components/marketing/deploy-button"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { MarkdownDescription } from "@/components/ui/markdown-description"
import { Separator } from "@/components/ui/separator"
import { siteConfig } from "@/config/site"
import { getEligiblePlanOptions } from "@/lib/appbox/eligible-plans"
import { absoluteUrl } from "@/lib/utils"
import type { MetaBlock } from "@/types/marketing-blocks"

interface AppDetailPageProps {
  params: Promise<{
    appName: string
    locale: string
  }>
}

function markdownToPlainText(content: string): string {
  return content
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function parseMarketingBlocks(raw: unknown) {
  let blocks = raw
  if (blocks && typeof blocks === "string") {
    try {
      blocks = JSON.parse(blocks)
    } catch {
      return null
    }
  }
  if (!Array.isArray(blocks) || blocks.length === 0) return null
  return blocks
}

function extractMeta(blocks: unknown[]): MetaBlock | null {
  const meta = blocks.find(
    (b): b is MetaBlock =>
      typeof b === "object" && b !== null && (b as MetaBlock).type === "meta"
  )
  return meta ?? null
}

export async function generateMetadata({
  params
}: AppDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const appName = resolvedParams.appName
  const locale = resolvedParams.locale

  try {
    const appDetails = await getAppDetails(appName)

    if (!appDetails) {
      return {}
    }

    const blocks = parseMarketingBlocks(appDetails.marketing_content)
    const meta = blocks ? extractMeta(blocks) : null

    const plainDescription = markdownToPlainText(appDetails.description)
    const truncatedDescription =
      plainDescription.length > 155
        ? plainDescription.substring(0, 152) + "..."
        : plainDescription

    const title =
      meta?.title ||
      `${appDetails.display_name} Hosting - Install and deploy with one click on ${siteConfig.name}`
    const description =
      meta?.description ||
      `${truncatedDescription} Deploy ${appDetails.display_name} with one click on Appbox.`

    let ogImage = siteConfig.og.image
    if (appDetails.icon_image) {
      if (appDetails.icon_image.startsWith("http")) {
        ogImage = appDetails.icon_image
      } else {
        ogImage = `https://api.appbox.co/assets/images/apps/icons/${appDetails.icon_image}`
      }
    }

    return {
      title,
      description,
      keywords: meta?.keywords,
      openGraph: {
        type: "website",
        title,
        url: absoluteUrl(`/${locale}/apps/${appName}`),
        description,
        images: [
          {
            url: ogImage,
            alt: `${appDetails.display_name} - ${siteConfig.name}`
          }
        ]
      }
    }
  } catch {
    return {}
  }
}

export default async function AppDetailPage({ params }: AppDetailPageProps) {
  const resolvedParams = await params
  const appName = resolvedParams.appName
  const t = await getTranslations("apps")

  let appDetails
  try {
    appDetails = await getAppDetails(appName)
  } catch (error) {
    console.error("Error fetching app details:", error)
    notFound()
  }

  if (!appDetails) {
    notFound()
  }

  let imageUrl = ""
  if (appDetails.icon_image) {
    try {
      if (appDetails.icon_image.startsWith("http")) {
        imageUrl = appDetails.icon_image
      } else {
        imageUrl = `https://api.appbox.co/assets/images/apps/icons/${appDetails.icon_image}`
      }
    } catch (_e) {
      imageUrl = "https://api.appbox.co/assets/images/apps/placeholder.png"
    }
  }

  const calculateStarRating = () => {
    const totalVotes = appDetails.upvotes + appDetails.downvotes
    if (totalVotes === 0) return 0
    const positivePercentage = appDetails.upvotes / totalVotes
    return Math.round(positivePercentage * 5 * 2) / 2
  }

  const starRating = calculateStarRating()

  const marketingBlocks = parseMarketingBlocks(appDetails.marketing_content)
  const hasMarketingContent = marketingBlocks !== null
  const plansData = await getPlans()
  const eligiblePlans = getEligiblePlanOptions(
    plansData,
    appDetails.display_name,
    appDetails.categories
  )

  if (hasMarketingContent) {
    const meta = extractMeta(marketingBlocks)
    const versions = appDetails.versions ?? []
    const renderBlocks = marketingBlocks.filter(
      (b: { type: string }) => b.type !== "meta"
    )

    const defaultVersion =
      versions.find((v) => v.version === appDetails.version) ?? versions[0]
    const baseMemory = defaultVersion?.memory ?? 0
    const baseCpus = defaultVersion?.cpus ?? 0

    return (
      <div className="max-w-container container mx-auto px-4 pt-6 sm:px-6 lg:px-8">
        <BlockRenderer
          blocks={renderBlocks}
          appName={appDetails.display_name}
          appId={appDetails.id}
          iconUrl={imageUrl}
          installPreview={meta?.install_preview ?? undefined}
          customFields={appDetails.customFields ?? undefined}
          appSlots={appDetails.app_slots}
          requiresDomain={appDetails.RequiresDomain === 1}
          domainPlaceholders={{
            subdomain: appDetails.subdomain,
            appboxDomain: "steve.appboxes.co",
            customDomain: "cloud.example.com"
          }}
          preinstallDescription={appDetails.custom_field_preinstall_description}
          baseMemory={baseMemory}
          baseCpus={baseCpus}
          eligiblePlans={eligiblePlans}
        />

        {versions.length > 0 && (
          <VersionsTable
            versions={versions}
            appSlotsFallback={appDetails.app_slots}
          />
        )}

        {/* App info footer */}
        <section className="border-t py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-3">
              <div className="relative mx-auto aspect-square w-32 overflow-hidden rounded-lg border bg-white p-4 shadow-xs dark:bg-gray-100">
                <Image
                  src={imageUrl}
                  alt={`${appDetails.display_name} icon`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="md:col-span-5">
              <h2 className="text-xl font-semibold">
                {appDetails.display_name}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("detail.by")} {appDetails.publisher}
              </p>

              {appDetails.categories?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {appDetails.categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {t("detail.version")}:{" "}
                  </span>
                  <span className="font-medium">{appDetails.version}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("detail.app_slots")}:{" "}
                  </span>
                  <span className="font-medium">{appDetails.app_slots}</span>
                </div>
                {appDetails.devsite && (
                  <a
                    href={appDetails.devsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 inline-flex items-center"
                  >
                    {t("detail.visit_site")}
                    <ExternalLink className="ml-1 size-3" />
                  </a>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4">
                <ClientStarRating
                  value={starRating}
                  showcase={true}
                  wrapperClassName="justify-start"
                />
                <span className="text-muted-foreground text-sm">
                  {starRating
                    ? `${Number.isInteger(starRating) ? starRating : starRating.toFixed(1)}/5`
                    : t("detail.no_ratings_yet")}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:col-span-4">
              <DeployButton
                appId={appDetails.id}
                deployText={t("detail.deploy_app")}
                dialogTitle={t("detail.deploy_dialog.title")}
                dialogQuestion={t("detail.deploy_dialog.question")}
                yesText={t("detail.deploy_dialog.yes")}
                noText={t("detail.deploy_dialog.no")}
                eligiblePlans={eligiblePlans}
              />
              <Link
                href="/apps"
                className={buttonVariants({ variant: "outline" })}
              >
                <ChevronLeft className="mr-2 size-4" />
                {t("back_to_apps")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="max-w-container container mx-auto px-4 pt-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Sidebar */}
        <div className="order-2 md:order-1 md:col-span-4 lg:col-span-3">
          <div className="sticky top-6 w-full space-y-6">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-white p-6 shadow-xs dark:bg-gray-100">
              <Image
                src={imageUrl}
                alt={`${appDetails.display_name} icon`}
                fill
                className="object-contain"
              />
            </div>

            <DeployButton
              appId={appDetails.id}
              deployText={t("detail.deploy_app")}
              dialogTitle={t("detail.deploy_dialog.title")}
              dialogQuestion={t("detail.deploy_dialog.question")}
              yesText={t("detail.deploy_dialog.yes")}
              noText={t("detail.deploy_dialog.no")}
              eligiblePlans={eligiblePlans}
            />

            <div className="bg-card rounded-lg border p-6 shadow-xs">
              <h3 className="mb-4 text-lg font-medium">
                {t("detail.app_info")}
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    {t("detail.version")}
                  </p>
                  <p className="font-medium">{appDetails.version}</p>
                </div>

                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    {t("detail.app_slots")}
                  </p>
                  <p className="font-medium">{appDetails.app_slots}</p>
                </div>

                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    {t("detail.released")}
                  </p>
                  <p className="font-medium">
                    {new Date(appDetails.created_at).toLocaleDateString()}
                  </p>
                </div>

                {appDetails.devsite && (
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm">
                      {t("detail.developer_site")}
                    </p>
                    <a
                      href={appDetails.devsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 inline-flex items-center"
                    >
                      {t("detail.visit_site")}
                      <ExternalLink className="ml-1 size-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6 shadow-xs">
              <h3 className="mb-4 text-lg font-medium">
                {t("detail.community_ratings")}
              </h3>

              <div className="mb-4 flex flex-col items-center">
                <ClientStarRating
                  value={starRating}
                  showcase={true}
                  wrapperClassName="justify-center mb-2"
                />
                <div className="text-muted-foreground text-sm">
                  {starRating
                    ? `${Number.isInteger(starRating) ? starRating : starRating.toFixed(1)}/5`
                    : t("detail.no_ratings_yet")}
                </div>
              </div>

              <div className="flex justify-between">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">
                    {t("detail.upvotes")}
                  </p>
                  <p className="font-medium">{appDetails.upvotes}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">
                    {t("detail.downvotes")}
                  </p>
                  <p className="font-medium">{appDetails.downvotes}</p>
                </div>
              </div>
            </div>

            <div>
              <Link
                href="/apps"
                className={buttonVariants({ variant: "outline" })}
              >
                <ChevronLeft className="mr-2 size-4" />
                {t("back_to_apps")}
              </Link>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="order-1 md:order-2 md:col-span-8 lg:col-span-9">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{appDetails.display_name}</h1>
            <p className="text-muted-foreground text-base">
              {t("detail.by")} {appDetails.publisher}
            </p>
            {appDetails.categories?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {appDetails.categories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <div>
              <h2 className="mb-3 text-xl font-semibold">
                {t("detail.description")}
              </h2>
              <MarkdownDescription content={appDetails.description} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
