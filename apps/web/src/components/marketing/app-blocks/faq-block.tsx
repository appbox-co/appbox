"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion-plus"
import type { FaqBlock as FaqBlockType } from "@/types/marketing-blocks"

interface FaqBlockProps {
  block: FaqBlockType
}

export function FaqBlock({ block }: FaqBlockProps) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl">
        {block.title && (
          <h2 className="mb-10 text-center font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            {block.title}
          </h2>
        )}

        <Accordion type="single" collapsible className="w-full">
          {block.items.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
