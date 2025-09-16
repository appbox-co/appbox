import Image from "next/image"
import Link from "next/link"
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
    <Link href={appUrl}>
      <figure
        className={cn(
          "relative z-10 mx-2 h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
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
          <div className="flex flex-col">
            <figcaption className="text-sm font-medium dark:text-white">
              {name}
            </figcaption>
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
