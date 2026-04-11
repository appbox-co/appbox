"use client"

import { motion } from "framer-motion"
import { MarkdownDescription } from "@/components/ui/markdown-description"
import type { MarkdownBlock as MarkdownBlockType } from "@/types/marketing-blocks"

interface MarkdownBlockProps {
  block: MarkdownBlockType
}

export function MarkdownBlock({ block }: MarkdownBlockProps) {
  return (
    <section className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl"
      >
        <MarkdownDescription
          content={block.content}
          className="text-foreground prose-lg"
        />
      </motion.div>
    </section>
  )
}
