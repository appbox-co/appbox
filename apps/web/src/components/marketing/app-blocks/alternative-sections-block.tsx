import { CheckCircle2, CircleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import type {
  AlternativeSectionItem,
  AlternativeSectionsBlock as AlternativeSectionsBlockType
} from "@/types/marketing-blocks"
import { AlternativeScreenshotLightbox } from "./alternative-screenshot-lightbox"

interface AlternativeSectionsBlockProps {
  block: AlternativeSectionsBlockType
}

function Screenshot({ item }: { item: AlternativeSectionItem }) {
  if (!item.screenshot) return null

  return (
    <AlternativeScreenshotLightbox
      name={item.name}
      screenshot={item.screenshot}
    />
  )
}

function DetailList({
  title,
  items,
  variant
}: {
  title: string
  items?: string[]
  variant: "strength" | "limitation"
}) {
  if (!items?.length) return null

  const Icon = variant === "strength" ? CheckCircle2 : CircleAlert
  const iconClassName =
    variant === "strength"
      ? "text-green-600 dark:text-green-400"
      : "text-amber-600 dark:text-amber-400"

  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h4>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-sm leading-6 text-muted-foreground"
          >
            <Icon className={cn("mt-0.5 size-4 shrink-0", iconClassName)} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Cta({ item }: { item: AlternativeSectionItem }) {
  if (!item.cta) return null

  const variant = item.cta.variant === "outline" ? "outline" : "primary"
  const isExternal = item.cta.url.startsWith("http")

  return (
    <Button asChild variant={variant}>
      {isExternal ? (
        <a href={item.cta.url} target="_blank" rel="noopener noreferrer">
          {item.cta.label}
        </a>
      ) : (
        <Link href={item.cta.url}>{item.cta.label}</Link>
      )}
    </Button>
  )
}

function AlternativeSection({
  item,
  index
}: {
  item: AlternativeSectionItem
  index: number
}) {
  const imageFirst = index % 2 === 1
  const hasScreenshot = Boolean(item.screenshot)

  return (
    <article className="rounded-3xl border border-border/70 bg-background/70 p-6 shadow-sm md:p-8">
      <div
        className={cn(
          "grid gap-8 lg:items-center",
          hasScreenshot && "lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]"
        )}
      >
        <div className={cn("space-y-6", imageFirst && "lg:order-2")}>
          <div className="space-y-4">
            {item.label && (
              <Badge variant="secondary" className="w-fit">
                {item.label}
              </Badge>
            )}
            <div>
              <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
                {item.name}
              </h3>
              {item.best_for && (
                <p className="mt-2 text-sm font-medium text-primary">
                  Best for: {item.best_for}
                </p>
              )}
            </div>
            <p className="text-base leading-8 text-muted-foreground">
              {item.summary}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailList
              title="Strengths"
              items={item.strengths}
              variant="strength"
            />
            <DetailList
              title="Limitations"
              items={item.limitations}
              variant="limitation"
            />
          </div>

          {(item.choose_if || item.avoid_if) && (
            <div className="grid gap-4 md:grid-cols-2">
              {item.choose_if && (
                <div className="rounded-2xl border border-green-200 bg-green-50/50 p-4 text-sm leading-6 dark:border-green-900 dark:bg-green-950/20">
                  <h4 className="font-semibold text-foreground">
                    Choose this if
                  </h4>
                  <p className="mt-2 text-muted-foreground">{item.choose_if}</p>
                </div>
              )}
              {item.avoid_if && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-sm leading-6 dark:border-amber-900 dark:bg-amber-950/20">
                  <h4 className="font-semibold text-foreground">
                    Avoid this if
                  </h4>
                  <p className="mt-2 text-muted-foreground">{item.avoid_if}</p>
                </div>
              )}
            </div>
          )}

          <Cta item={item} />
        </div>

        {hasScreenshot && (
          <div className={cn(imageFirst && "lg:order-1")}>
            <Screenshot item={item} />
          </div>
        )}
      </div>
    </article>
  )
}

export function AlternativeSectionsBlock({
  block
}: AlternativeSectionsBlockProps) {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-6xl">
        {(block.title || block.intro) && (
          <div className="mx-auto mb-10 max-w-3xl text-center">
            {block.title && (
              <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
                {block.title}
              </h2>
            )}
            {block.intro && (
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                {block.intro}
              </p>
            )}
          </div>
        )}

        <div className="space-y-8">
          {block.items.map((item, index) => (
            <AlternativeSection
              key={`${item.name}-${index}`}
              item={item}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
