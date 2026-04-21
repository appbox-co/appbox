import { useTranslations } from "next-intl"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardFooter } from "@/components/ui/card"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"

interface AppGridCardProps {
  name: string
  publisher: string
  description: string
  iconUrl: string
  appSlots: number
  categories: string[]
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

export function AppGridCard({
  name,
  publisher,
  description,
  iconUrl,
  appSlots,
  categories
}: AppGridCardProps) {
  const t = useTranslations()

  let imageUrl
  try {
    if (iconUrl) {
      if (iconUrl.startsWith("http")) {
        imageUrl = iconUrl
      } else {
        imageUrl = `https://api.appbox.co/assets/images/apps/icons/${iconUrl}`
      }
      new URL(imageUrl)
    } else {
      imageUrl = "https://api.appbox.co/assets/images/apps/placeholder.png"
    }
  } catch (_e) {
    imageUrl = "https://api.appbox.co/assets/images/apps/placeholder.png"
  }

  const descriptionPreview = markdownToPlainText(description)

  return (
    <Link
      href={`/apps/${encodeURIComponent(name)}`}
      className="block h-full no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
    >
      <Card
        className={cn(
          "flex h-full cursor-pointer flex-col overflow-hidden transition-all duration-200 hover:shadow-lg",
          "hover:border-primary/50 border-gray-950/[.1]",
          "dark:hover:border-primary/50 dark:border-gray-50/[.1]"
        )}
      >
        <div className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-white p-0.5 shadow-xs dark:bg-gray-100">
              <Image
                src={imageUrl}
                alt={`${name} icon`}
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="line-clamp-1 text-base font-medium">{name}</h3>
              <p className="text-muted-foreground text-xs">{publisher}</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-3 line-clamp-3 text-sm overflow-hidden text-ellipsis max-h-[4.5em]">
            {descriptionPreview}
          </p>

          {categories.length > 0 && (
            <div className="my-2 flex flex-wrap gap-1">
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

        <CardFooter className="mt-auto flex items-center justify-between border-t p-3">
          <div className="text-muted-foreground text-xs">
            {t("apps.card.app_slots")}:{" "}
            <span className="font-medium">{appSlots}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
