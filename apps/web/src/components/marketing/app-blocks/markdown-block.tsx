import { MarkdownDescription } from "@/components/ui/markdown-description"
import type { MarkdownBlock as MarkdownBlockType } from "@/types/marketing-blocks"

interface MarkdownBlockProps {
  block: MarkdownBlockType
}

export function MarkdownBlock({ block }: MarkdownBlockProps) {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-3xl">
        <MarkdownDescription
          content={block.content}
          className="text-foreground prose-lg"
        />
      </div>
    </section>
  )
}
