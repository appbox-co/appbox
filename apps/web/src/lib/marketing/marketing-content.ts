import type {
  AlternativeSectionsBlock,
  CalloutBlock,
  ComparisonBlock,
  ComparisonMatrixBlock,
  CtaBlock,
  DecisionQuestionsBlock,
  FaqBlock,
  FeaturesBlock,
  HeroBlock,
  MarketingContent,
  MetaBlock,
  ScreenshotsBlock
} from "@/types/marketing-blocks"
import {
  isSafeCssColor,
  isSafeExternalUrl,
  isSafeLinkUrl,
  resolveSafeScreenshotUrl
} from "./safe-urls"

type RawRecord = Record<string, unknown>

export function markdownToPlainText(content: string): string {
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

export function parseMarketingBlocks(raw: unknown): MarketingContent | null {
  let blocks = raw
  if (blocks && typeof blocks === "string") {
    try {
      blocks = JSON.parse(blocks)
    } catch {
      return null
    }
  }

  if (!Array.isArray(blocks) || blocks.length === 0) return null

  const parsed = blocks
    .map(normalizeMarketingBlock)
    .filter((block): block is MarketingContent[number] => block !== null)

  return parsed.length > 0 ? parsed : null
}

export function extractMeta(blocks: MarketingContent): MetaBlock | null {
  const meta = blocks.find((block): block is MetaBlock => block.type === "meta")
  return meta ?? null
}

export function renderableMarketingBlocks(
  blocks: MarketingContent
): MarketingContent {
  return blocks.filter((block) => block.type !== "meta")
}

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined
}

function normalizeMarketingBlock(
  block: unknown
): MarketingContent[number] | null {
  if (!isRecord(block) || typeof block.type !== "string") {
    return null
  }

  switch (block.type) {
    case "meta":
      return normalizeMetaBlock(block)
    case "hero":
      return normalizeHeroBlock(block)
    case "features":
      return normalizeFeaturesBlock(block)
    case "callout":
      return normalizeCalloutBlock(block)
    case "cta":
      return normalizeCtaBlock(block)
    case "markdown":
      return normalizeMarkdownBlock(block)
    case "screenshots":
      return normalizeScreenshotsBlock(block)
    case "faq":
      return normalizeFaqBlock(block)
    case "comparison":
      return normalizeComparisonBlock(block)
    case "decision_questions":
      return normalizeDecisionQuestionsBlock(block)
    case "comparison_matrix":
      return normalizeComparisonMatrixBlock(block)
    case "alternative_sections":
      return normalizeAlternativeSectionsBlock(block)
    default:
      return null
  }
}

function normalizeMetaBlock(block: RawRecord): MetaBlock | null {
  const meta: MetaBlock = { type: "meta" }
  const title = stringValue(block.title)
  const description = stringValue(block.description)
  const keywords = Array.isArray(block.keywords)
    ? block.keywords.filter((keyword): keyword is string =>
        Boolean(stringValue(keyword))
      )
    : undefined

  if (title) meta.title = title
  if (description) meta.description = description
  if (keywords?.length) meta.keywords = keywords

  if (isRecord(block.install_preview)) {
    const installPreview = Object.fromEntries(
      Object.entries(block.install_preview).filter(
        (entry): entry is [string, string] =>
          stringValue(entry[0]) !== undefined &&
          stringValue(entry[1]) !== undefined
      )
    )
    if (Object.keys(installPreview).length > 0) {
      meta.install_preview = installPreview
    }
  }

  return meta
}

function normalizeHeroBlock(block: RawRecord): HeroBlock | null {
  const headline = stringValue(block.headline)
  if (!headline) return null

  const hero: HeroBlock = { type: "hero", headline }
  const subheadline = stringValue(block.subheadline)
  const ctaText = stringValue(block.cta_text)
  const ctaUrl = stringValue(block.cta_url)
  const websiteUrl = stringValue(block.website_url)
  const gradientFrom = stringValue(block.gradient_from)
  const gradientTo = stringValue(block.gradient_to)
  const badge = stringValue(block.badge)

  if (subheadline) hero.subheadline = subheadline
  if (ctaText) hero.cta_text = ctaText
  if (ctaUrl && isSafeLinkUrl(ctaUrl)) hero.cta_url = ctaUrl
  if (websiteUrl && isSafeExternalUrl(websiteUrl)) {
    hero.website_url = websiteUrl
  }
  if (gradientFrom && isSafeCssColor(gradientFrom)) {
    hero.gradient_from = gradientFrom
  }
  if (gradientTo && isSafeCssColor(gradientTo)) {
    hero.gradient_to = gradientTo
  }
  if (badge) hero.badge = badge

  return hero
}

function normalizeFeaturesBlock(block: RawRecord): FeaturesBlock | null {
  if (!Array.isArray(block.items)) return null

  const items = block.items
    .filter(isRecord)
    .map((item) => ({
      icon: stringValue(item.icon) ?? "star",
      title: stringValue(item.title),
      description: stringValue(item.description)
    }))
    .filter(
      (item): item is FeaturesBlock["items"][number] =>
        item.title !== undefined && item.description !== undefined
    )

  if (items.length === 0) return null

  const columns = [2, 3, 4].includes(Number(block.columns))
    ? (Number(block.columns) as 2 | 3 | 4)
    : undefined
  const layout = block.layout === "bento" ? "bento" : "grid"

  return {
    type: "features",
    title: stringValue(block.title),
    subtitle: stringValue(block.subtitle),
    columns,
    layout,
    items
  }
}

function normalizeCalloutBlock(block: RawRecord): CalloutBlock | null {
  const title = stringValue(block.title)
  const body = stringValue(block.body)
  if (!title || !body) return null

  const variant =
    block.variant === "warning" || block.variant === "tip"
      ? block.variant
      : "info"

  return {
    type: "callout",
    icon: stringValue(block.icon),
    title,
    body,
    variant
  }
}

function normalizeCtaBlock(block: RawRecord): CtaBlock | null {
  const headline = stringValue(block.headline)
  const buttonText = stringValue(block.button_text)
  const buttonUrl = stringValue(block.button_url)
  if (!headline || !buttonText || !buttonUrl || !isSafeLinkUrl(buttonUrl)) {
    return null
  }

  return {
    type: "cta",
    headline,
    description: stringValue(block.description),
    button_text: buttonText,
    button_url: buttonUrl,
    variant: block.variant === "outline" ? "outline" : "primary"
  }
}

function normalizeMarkdownBlock(block: RawRecord) {
  const content = stringValue(block.content)
  return content ? { type: "markdown" as const, content } : null
}

function normalizeScreenshotsBlock(block: RawRecord): ScreenshotsBlock | null {
  if (!Array.isArray(block.images)) return null

  const images = block.images.filter(isRecord).flatMap((image) => {
    const screenshot = normalizeScreenshotImage(image)
    return screenshot ? [screenshot] : []
  })

  if (images.length === 0) return null

  return {
    type: "screenshots",
    title: stringValue(block.title),
    images
  }
}

function normalizeFaqBlock(block: RawRecord): FaqBlock | null {
  if (!Array.isArray(block.items)) return null

  const items = block.items
    .filter(isRecord)
    .map((item) => ({
      question: stringValue(item.question),
      answer: stringValue(item.answer)
    }))
    .filter(
      (item): item is FaqBlock["items"][number] =>
        item.question !== undefined && item.answer !== undefined
    )

  return items.length > 0
    ? { type: "faq", title: stringValue(block.title), items }
    : null
}

function normalizeComparisonBlock(block: RawRecord): ComparisonBlock | null {
  if (!Array.isArray(block.rows)) return null

  const rows = block.rows
    .filter(isRecord)
    .map((row) => ({
      feature: stringValue(row.feature),
      us: stringValue(row.us),
      them: stringValue(row.them)
    }))
    .filter(
      (row): row is ComparisonBlock["rows"][number] =>
        row.feature !== undefined &&
        row.us !== undefined &&
        row.them !== undefined
    )

  return rows.length > 0
    ? {
        type: "comparison",
        title: stringValue(block.title),
        our_name: stringValue(block.our_name),
        other_name: stringValue(block.other_name),
        rows
      }
    : null
}

function normalizeDecisionQuestionsBlock(
  block: RawRecord
): DecisionQuestionsBlock | null {
  if (!Array.isArray(block.items)) return null

  const items = block.items.filter(isRecord).flatMap((item) => {
    const question = stringValue(item.question)
    const guidance = stringValue(item.guidance)
    if (!question || !guidance) return []

    return [
      {
        question,
        guidance,
        answer: stringValue(item.answer)
      }
    ]
  })

  return items.length > 0
    ? {
        type: "decision_questions",
        title: stringValue(block.title),
        intro: stringValue(block.intro),
        items
      }
    : null
}

function normalizeComparisonMatrixBlock(
  block: RawRecord
): ComparisonMatrixBlock | null {
  if (!Array.isArray(block.columns) || !Array.isArray(block.rows)) return null

  const columns = block.columns
    .filter(isRecord)
    .map((column) => ({
      key: stringValue(column.key),
      label: stringValue(column.label)
    }))
    .filter(
      (column): column is ComparisonMatrixBlock["columns"][number] =>
        column.key !== undefined && column.label !== undefined
    )

  if (columns.length === 0) return null

  const columnKeys = new Set(columns.map((column) => column.key))
  const rows = block.rows
    .filter(isRecord)
    .map((row) => {
      const values = isRecord(row.values)
        ? Object.fromEntries(
            Object.entries(row.values).filter(
              (entry): entry is [string, string] =>
                columnKeys.has(entry[0]) && stringValue(entry[1]) !== undefined
            )
          )
        : {}

      return {
        label: stringValue(row.label),
        values
      }
    })
    .filter(
      (row): row is ComparisonMatrixBlock["rows"][number] =>
        row.label !== undefined && Object.keys(row.values).length > 0
    )

  return rows.length > 0
    ? {
        type: "comparison_matrix",
        title: stringValue(block.title),
        intro: stringValue(block.intro),
        columns,
        rows
      }
    : null
}

function normalizeAlternativeSectionsBlock(
  block: RawRecord
): AlternativeSectionsBlock | null {
  if (!Array.isArray(block.items)) return null

  const items = block.items.filter(isRecord).flatMap((item) => {
    const name = stringValue(item.name)
    const summary = stringValue(item.summary)
    if (!name || !summary) return []

    const screenshot = isRecord(item.screenshot)
      ? normalizeScreenshotImage(item.screenshot)
      : undefined
    const cta = isRecord(item.cta)
      ? normalizeAlternativeSectionCta(item.cta)
      : undefined

    return [
      {
        name,
        label: stringValue(item.label),
        summary,
        best_for: stringValue(item.best_for),
        strengths: stringArrayValue(item.strengths),
        limitations: stringArrayValue(item.limitations),
        choose_if: stringValue(item.choose_if),
        avoid_if: stringValue(item.avoid_if),
        screenshot,
        cta
      }
    ]
  })

  return items.length > 0
    ? {
        type: "alternative_sections",
        title: stringValue(block.title),
        intro: stringValue(block.intro),
        items
      }
    : null
}

function normalizeScreenshotImage(
  image: RawRecord
): ScreenshotsBlock["images"][number] | undefined {
  const src = stringValue(image.src)
  if (!src || !resolveSafeScreenshotUrl(src)) return undefined

  return {
    src,
    alt: stringValue(image.alt),
    caption: stringValue(image.caption)
  }
}

function normalizeAlternativeSectionCta(
  cta: RawRecord
): AlternativeSectionsBlock["items"][number]["cta"] | undefined {
  const label = stringValue(cta.label)
  const url = stringValue(cta.url)
  if (!label || !url || !isSafeLinkUrl(url)) return undefined

  return {
    label,
    url,
    variant: cta.variant === "outline" ? "outline" : "primary"
  }
}

function stringArrayValue(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined

  const items = value.filter(
    (item): item is string => stringValue(item) !== undefined
  )
  return items.length > 0 ? items : undefined
}
