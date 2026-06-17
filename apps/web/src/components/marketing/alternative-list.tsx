import Image from "next/image"
import type { AlternativeEntry } from "@/api/appbox/alternative-pages"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Link } from "@/i18n/routing"
import { isSafeExternalUrl } from "@/lib/marketing/safe-urls"

interface AlternativeListProps {
  competitorName: string
  alternatives: AlternativeEntry[]
}

function appIconUrl(iconImage?: string): string | null {
  if (!iconImage) return null
  const imageUrl = iconImage.startsWith("http")
    ? iconImage
    : `https://api.appbox.co/assets/images/apps/icons/${iconImage}`

  return isSafeExternalUrl(imageUrl) ? imageUrl : null
}

function AlternativeCard({ item }: { item: AlternativeEntry }) {
  const isAppbox = item.type === "appbox_app"
  const name = isAppbox ? item.app.display_name : item.name
  const description =
    item.description ||
    (isAppbox ? item.app.short_description || item.app.description : undefined)
  const iconUrl = isAppbox ? appIconUrl(item.app.icon_image) : null
  const appHref = isAppbox
    ? `/apps/${encodeURIComponent(item.app.display_name)}`
    : null
  const externalHref =
    !isAppbox && item.website_url && isSafeExternalUrl(item.website_url)
      ? item.website_url
      : null

  return (
    <Card className="flex h-full flex-col border-border/70 bg-background/70">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {iconUrl && (
              <Image
                src={iconUrl}
                alt=""
                width={40}
                height={40}
                className="rounded-lg"
              />
            )}
            <div>
              <CardTitle className="text-xl">{name}</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={isAppbox ? "default" : "secondary"}>
                  {isAppbox ? "On Appbox" : "External tool"}
                </Badge>
                {item.rank && <Badge variant="outline">#{item.rank}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {item.best_for && (
          <p className="text-sm font-medium text-foreground">
            Best for: {item.best_for}
          </p>
        )}

        {description && (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        )}

        {item.highlights && item.highlights.length > 0 && (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {item.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-2">
                <span aria-hidden="true" className="text-primary">
                  •
                </span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        )}

        {item.caveat && (
          <p className="rounded-lg border border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
            {item.caveat}
          </p>
        )}
      </CardContent>

      {(appHref || externalHref) && (
        <CardFooter>
          <Button asChild variant={isAppbox ? "default" : "outline"}>
            {appHref ? (
              <Link href={appHref}>View Appbox app</Link>
            ) : (
              <a href={externalHref ?? "#"} target="_blank" rel="noopener noreferrer">
                Visit website
              </a>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export function AlternativeList({
  competitorName,
  alternatives
}: AlternativeListProps) {
  if (alternatives.length === 0) {
    return null
  }

  return (
    <section className="py-14">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Alternatives
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Best {competitorName} alternatives
        </h2>
        <p className="mt-4 text-muted-foreground">
          A ranked mix of Appbox-hosted apps and external tools, with each option
          labeled clearly.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {alternatives.map((item, index) => (
          <AlternativeCard key={`${item.type}-${item.rank ?? index}`} item={item} />
        ))}
      </div>
    </section>
  )
}
