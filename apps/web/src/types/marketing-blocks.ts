export interface HeroBlock {
  type: "hero"
  headline: string
  subheadline?: string
  cta_text?: string
  cta_url?: string
  website_url?: string
  gradient_from?: string
  gradient_to?: string
  badge?: string
}

export interface FeatureItem {
  icon: string
  title: string
  description: string
}

export interface FeaturesBlock {
  type: "features"
  title?: string
  subtitle?: string
  columns?: 2 | 3 | 4
  layout?: "grid" | "bento"
  items: FeatureItem[]
}

export interface CalloutBlock {
  type: "callout"
  icon?: string
  title: string
  body: string
  variant?: "info" | "warning" | "tip"
}

export interface CtaBlock {
  type: "cta"
  headline: string
  description?: string
  button_text: string
  button_url: string
  variant?: "primary" | "outline"
}

export interface MarkdownBlock {
  type: "markdown"
  content: string
}

export interface ScreenshotImage {
  src: string
  alt?: string
  caption?: string
}

export interface ScreenshotsBlock {
  type: "screenshots"
  title?: string
  images: ScreenshotImage[]
}

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqBlock {
  type: "faq"
  title?: string
  items: FaqItem[]
}

export interface ComparisonRow {
  feature: string
  us: string
  them: string
}

export interface ComparisonBlock {
  type: "comparison"
  title?: string
  our_name?: string
  other_name?: string
  rows: ComparisonRow[]
}

export interface DecisionQuestionItem {
  question: string
  guidance: string
  answer?: string
}

export interface DecisionQuestionsBlock {
  type: "decision_questions"
  title?: string
  intro?: string
  items: DecisionQuestionItem[]
}

export interface ComparisonMatrixColumn {
  key: string
  label: string
}

export interface ComparisonMatrixRow {
  label: string
  values: Record<string, string>
}

export interface ComparisonMatrixBlock {
  type: "comparison_matrix"
  title?: string
  intro?: string
  columns: ComparisonMatrixColumn[]
  rows: ComparisonMatrixRow[]
}

export interface AlternativeSectionCta {
  label: string
  url: string
  variant?: "primary" | "outline"
}

export interface AlternativeSectionItem {
  name: string
  label?: string
  summary: string
  best_for?: string
  strengths?: string[]
  limitations?: string[]
  choose_if?: string
  avoid_if?: string
  screenshot?: ScreenshotImage
  cta?: AlternativeSectionCta
}

export interface AlternativeSectionsBlock {
  type: "alternative_sections"
  title?: string
  intro?: string
  items: AlternativeSectionItem[]
}

export interface MetaBlock {
  type: "meta"
  title?: string
  description?: string
  keywords?: string[]
  install_preview?: Record<string, string>
}

export type MarketingBlock =
  | MetaBlock
  | HeroBlock
  | FeaturesBlock
  | CalloutBlock
  | CtaBlock
  | MarkdownBlock
  | ScreenshotsBlock
  | FaqBlock
  | ComparisonBlock
  | DecisionQuestionsBlock
  | ComparisonMatrixBlock
  | AlternativeSectionsBlock

export type MarketingContent = MarketingBlock[]
