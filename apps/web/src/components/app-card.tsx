import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface AppCardProps {
  name: string
  publisher: string
  description: string
  iconUrl: string
  categories: string[]
}

export function AppCard({
  name,
  publisher,
  description,
  iconUrl,
  categories,
}: AppCardProps) {
  // Format the URL-friendly app name
  const appUrl = `/apps/${encodeURIComponent(name)}`

  return (
    <Link href={appUrl}>
      <figure
        className={cn(
          'relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4 mx-2 z-10',
          'backdrop-blur-sm backdrop-saturate-150',
          // light styles
          'border-gray-950/[.1] bg-gray-950/[.03] hover:bg-gray-950/[.06]',
          // dark styles
          'dark:border-gray-50/[.1] dark:bg-gray-50/[.12] dark:hover:bg-gray-50/[.17]'
        )}
      >
        <div className="flex flex-row items-center gap-2">
          <div className="w-10 h-10 rounded-md overflow-hidden relative">
            <Image
              src={`https://api.appbox.co/assets/images/apps/icons/${iconUrl}`}
              alt={`${name} icon`}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <figcaption className="text-sm font-medium dark:text-white">
              {name}
            </figcaption>
            <p className="text-xs font-medium dark:text-white/40">
              {publisher}
            </p>
          </div>
        </div>
        <blockquote className="mt-2 text-sm line-clamp-3">
          {description}
        </blockquote>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {categories.map((category) => (
              <span
                key={category}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary"
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </figure>
    </Link>
  )
}
