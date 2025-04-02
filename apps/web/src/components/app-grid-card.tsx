import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

interface AppGridCardProps {
  name: string
  publisher: string
  description: string
  iconUrl: string
  appSlots: number
  categories: string[]
}

export function AppGridCard({
  name,
  publisher,
  description,
  iconUrl,
  appSlots,
  categories,
}: AppGridCardProps) {
  const t = useTranslations()
  const router = useRouter()

  // Process the iconUrl to ensure it's valid
  let imageUrl
  try {
    // Try to create a URL object to validate
    if (iconUrl) {
      // If it's a full URL already
      if (iconUrl.startsWith('http')) {
        imageUrl = iconUrl
      } else {
        // If it's just a filename
        imageUrl = `https://api.appbox.co/assets/images/apps/icons/${iconUrl}`
      }
      // Test if it's a valid URL
      new URL(imageUrl)
    } else {
      // Fallback if no iconUrl provided
      imageUrl = 'https://api.appbox.co/assets/images/apps/placeholder.png'
    }
  } catch (e) {
    // If URL construction fails, use a placeholder
    imageUrl = 'https://api.appbox.co/assets/images/apps/placeholder.png'
  }

  const handleClick = () => {
    router.push(`/apps/${encodeURIComponent(name)}`)
  }

  return (
    <Card
      className={cn(
        'overflow-hidden h-full flex flex-col transition-all duration-200 hover:shadow-lg cursor-pointer',
        'border-gray-950/[.1] hover:border-primary/50',
        'dark:border-gray-50/[.1] dark:hover:border-primary/50'
      )}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-md overflow-hidden relative flex-shrink-0 bg-white dark:bg-gray-100 p-0.5 shadow-sm">
            <Image
              src={imageUrl}
              alt={`${name} icon`}
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="font-medium text-base line-clamp-1">{name}</h3>
            <p className="text-xs text-muted-foreground">{publisher}</p>
          </div>
        </div>

        <p className="text-sm line-clamp-3 mb-3 text-muted-foreground">
          {description}
        </p>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 mb-2">
            {categories.slice(0, 3).map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
            {categories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{categories.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      <CardFooter className="flex justify-between items-center border-t p-3 mt-auto">
        <div className="text-xs text-muted-foreground">
          {t('apps.card.app_slots')}:{' '}
          <span className="font-medium">{appSlots}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
