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
    <Link href={appUrl} className="group/card block h-full">
      <figure
        className={cn(
          "relative isolate z-10 mx-2 h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4 shadow-sm shadow-slate-200/80 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 group-focus-visible/card:-translate-y-0.5 group-focus-visible/card:border-primary/50 group-focus-visible/card:shadow-md group-focus-visible/card:shadow-primary/10 dark:shadow-black/30 [&>*:not(.app-card-bg)]:relative [&>*:not(.app-card-bg)]:z-10",
          // clean technical card surface
          "bg-slate-50/90 text-card-foreground dark:bg-[#070912]",
          // consistent borders
          "border-slate-200/80 dark:border-white/10"
        )}
      >
        <div className="app-card-bg pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-size-[48px_48px] opacity-70 mask-[linear-gradient(180deg,black,rgba(0,0,0,0.84)_52%,transparent_88%)] dark:bg-[linear-gradient(rgba(255,255,255,0.056)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.056)_1px,transparent_1px)] dark:opacity-70" />
        <div className="app-card-bg pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-linear-to-r from-transparent via-white/80 to-transparent dark:via-white/20" />
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
              <figcaption className="min-w-0 truncate text-sm font-medium transition-colors duration-200 group-hover/card:text-primary dark:text-white dark:group-hover/card:text-primary">
                {name}
              </figcaption>
              <CardLinkHint hoverScope="card" />
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
