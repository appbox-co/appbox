import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, ArrowLeft, ChevronLeft } from 'lucide-react'

import { getAppDetails } from '@/lib/appbox/api/getAppDetails'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { StarRating } from '@/components/ui/star-rating'
import { cn } from '@/lib/utils'

// Make the StarRating component a Client Component since it's interactive
import ClientStarRating from '@/components/client-star-rating'

interface AppDetailPageProps {
  params: {
    appName: string
    locale: string
  }
}

export default async function AppDetailPage({ params }: AppDetailPageProps) {
  const appName = decodeURIComponent(params.appName)
  const t = await getTranslations('apps')

  // Get app details on the server
  let appDetails
  try {
    appDetails = await getAppDetails(appName)
  } catch (error) {
    console.error('Error fetching app details:', error)
    notFound()
  }

  if (!appDetails) {
    notFound()
  }

  // Process the icon URL to ensure it's valid
  let imageUrl = ''
  if (appDetails.icon_image) {
    try {
      if (appDetails.icon_image.startsWith('http')) {
        imageUrl = appDetails.icon_image
      } else {
        imageUrl = `https://api.appbox.co/assets/images/apps/icons/${appDetails.icon_image}`
      }
    } catch (e) {
      imageUrl = 'https://api.appbox.co/assets/images/apps/placeholder.png'
    }
  }

  // Calculate star rating from upvotes and downvotes
  const calculateStarRating = () => {
    const totalVotes = appDetails.upvotes + appDetails.downvotes

    // If no votes, return 0
    if (totalVotes === 0) return 0

    // Calculate percentage of positive votes
    const positivePercentage = appDetails.upvotes / totalVotes

    // Convert to 5-star scale and round to nearest 0.5
    return Math.round(positivePercentage * 5 * 2) / 2
  }

  const starRating = calculateStarRating()

  return (
    <div className="container mx-auto max-w-container px-4 pt-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar - Increased column span and added min-width */}
        <div className="md:col-span-4 lg:col-span-3 order-2 md:order-1">
          <div className="sticky top-6 space-y-6 w-full">
            {/* App logo positioned outside and full width */}
            <div className="w-full aspect-square rounded-lg overflow-hidden relative bg-white dark:bg-gray-100 p-6 shadow-sm border">
              <Image
                src={imageUrl}
                alt={`${appDetails.display_name} icon`}
                fill
                className="object-contain"
              />
            </div>

            {/* Deploy button moved outside */}
            <Button className="w-full" size="lg">
              {t('detail.deploy_app')}
            </Button>

            {/* App information card */}
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h3 className="font-medium text-lg mb-4">
                {t('detail.app_info')}
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('detail.version')}
                  </p>
                  <p className="font-medium">{appDetails.version}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('detail.app_slots')}
                  </p>
                  <p className="font-medium">{appDetails.app_slots}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('detail.released')}
                  </p>
                  <p className="font-medium">
                    {new Date(appDetails.created_at).toLocaleDateString()}
                  </p>
                </div>

                {appDetails.devsite && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {t('detail.developer_site')}
                    </p>
                    <a
                      href={appDetails.devsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 inline-flex items-center"
                    >
                      {t('detail.visit_site')}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Community ratings */}
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h3 className="font-medium text-lg mb-4">
                {t('detail.community_ratings')}
              </h3>

              <div className="flex flex-col items-center mb-4">
                <ClientStarRating
                  value={starRating}
                  showcase={true}
                  wrapperClassName="justify-center mb-2"
                />
                <div className="text-sm text-muted-foreground">
                  {starRating
                    ? `${Number.isInteger(starRating) ? starRating : starRating.toFixed(1)}/5`
                    : t('detail.no_ratings_yet')}
                </div>
              </div>

              <div className="flex justify-between">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('detail.upvotes')}
                  </p>
                  <p className="font-medium">{appDetails.upvotes}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('detail.downvotes')}
                  </p>
                  <p className="font-medium">{appDetails.downvotes}</p>
                </div>
              </div>
            </div>

            {/* Back to apps button - moved here */}
            <div>
              <Link
                href="/apps"
                className={buttonVariants({ variant: 'outline' })}
              >
                <ChevronLeft className="mr-2 size-4" />
                {t('back_to_apps')}
              </Link>
            </div>
          </div>
        </div>

        {/* Main content - Adjusted column span */}
        <div className="md:col-span-8 lg:col-span-9 order-1 md:order-2">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{appDetails.display_name}</h1>
            <p className="text-base text-muted-foreground">
              {t('detail.by')} {appDetails.publisher}
            </p>
            {appDetails.categories?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
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
              <h2 className="text-xl font-semibold mb-3">
                {t('detail.description')}
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                {appDetails.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
