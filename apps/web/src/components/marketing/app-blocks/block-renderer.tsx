import type { CustomField } from "@/api/apps/app-store"
import type { MarketingBlock, MarketingContent } from "@/types/marketing-blocks"
import { CalloutBlock } from "./callout-block"
import { ComparisonBlock } from "./comparison-block"
import { CtaBlock } from "./cta-block"
import { FaqBlock } from "./faq-block"
import { FeaturesBlock } from "./features-block"
import { HeroBlock } from "./hero-block"
import { InstallPreview } from "./install-preview"
import { MarkdownBlock } from "./markdown-block"
import { ScreenshotsBlock } from "./screenshots-block"

interface BlockRendererProps {
  blocks: MarketingContent
  appName: string
  appId: number
  iconUrl?: string
  installPreview?: Record<string, string>
  customFields?: Record<string, CustomField>
  appSlots?: number
  preinstallDescription?: string | null
  baseMemory?: number
  baseCpus?: number
}

function renderBlock(
  block: MarketingBlock,
  appName: string,
  appId: number,
  iconUrl?: string
) {
  switch (block.type) {
    case "hero":
      return (
        <HeroBlock
          block={block}
          appName={appName}
          appId={appId}
          iconUrl={iconUrl}
        />
      )
    case "features":
      return <FeaturesBlock block={block} />
    case "callout":
      return <CalloutBlock block={block} />
    case "cta":
      return <CtaBlock block={block} appId={appId} />
    case "markdown":
      return <MarkdownBlock block={block} />
    case "screenshots":
      return <ScreenshotsBlock block={block} />
    case "faq":
      return <FaqBlock block={block} />
    case "comparison":
      return <ComparisonBlock block={block} />
    case "meta":
      return null
    default:
      return null
  }
}

export function BlockRenderer({
  blocks,
  appName,
  appId,
  iconUrl,
  installPreview,
  customFields,
  appSlots,
  preinstallDescription,
  baseMemory,
  baseCpus
}: BlockRendererProps) {
  const lastScreenshotIndex = blocks.reduce(
    (last, block, i) => (block.type === "screenshots" ? i : last),
    -1
  )

  const showInstallPreview =
    (customFields && Object.keys(customFields).length > 0) ||
    (installPreview && Object.keys(installPreview).length > 0)

  const installPreviewElement = showInstallPreview ? (
    <InstallPreview
      appName={appName}
      placeholders={installPreview}
      customFields={customFields}
      appSlots={appSlots}
      preinstallDescription={preinstallDescription}
      baseMemory={baseMemory}
      baseCpus={baseCpus}
    />
  ) : null

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => (
        <div key={`${block.type}-${i}`}>
          {renderBlock(block, appName, appId, iconUrl)}
          {i === lastScreenshotIndex && installPreviewElement}
        </div>
      ))}
      {lastScreenshotIndex === -1 && installPreviewElement}
    </div>
  )
}
