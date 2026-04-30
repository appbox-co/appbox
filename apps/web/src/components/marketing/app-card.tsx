import Image from "next/image"
import Link from "next/link"
import { CardLinkHint } from "@/components/ui/card-link-hint"
import { cn } from "@/lib/utils"

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
  categories
}: AppCardProps) {
  // Format the URL-friendly app name
  const appUrl = `/apps/${encodeURIComponent(name)}`

  return (
    <Link href={appUrl} className="group block h-full">
      <figure
        className={cn(
          "relative z-10 mx-2 h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-lg",
          // solid backgrounds
          "bg-card text-card-foreground dark:bg-[#0b0d10]",
          // consistent borders
          "border-border"
        )}
      >
        <div className="flex flex-row items-center gap-2">
          <div className="relative size-10 overflow-hidden rounded-md">
            <Image
              src={`https://api.appbox.co/assets/images/apps/icons/${iconUrl}`}
              alt={`${name} icon`}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <figcaption className="min-w-0 truncate text-sm font-medium transition-colors duration-200 group-hover:text-primary dark:text-white dark:group-hover:text-primary">
                {name}
              </figcaption>
              <CardLinkHint />
            </div>
            <p className="text-xs font-medium dark:text-white/40">
              {publisher}
            </p>
          </div>
        </div>
        <blockquote className="mt-2 line-clamp-3 text-sm overflow-hidden text-ellipsis max-h-[4.5em]">
          {description}
        </blockquote>
        {categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {categories.map((category) => (
              <span
                key={category}
                className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs"
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
