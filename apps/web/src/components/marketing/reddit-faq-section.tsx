"use client"

import { Suspense, useEffect, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion-plus"

type RedditFaq = {
  id: string
  question: string
  answer: string
}

interface RedditFAQSectionProps {
  title: string
  description: string
  items: RedditFaq[]
}

export function RedditFAQSection({
  title,
  description,
  items
}: RedditFAQSectionProps) {
  return (
    <section id="faq" className="scroll-mt-16 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
            {title}
          </h2>
          <p className="mt-4 text-muted-foreground">{description}</p>
        </div>

        <RedditFAQAccordion items={items} />
      </div>
    </section>
  )
}

function RedditFAQAccordion({ items }: { items: RedditFaq[] }) {
  const [openItem, setOpenItem] = useState("")
  const itemIds = items.map((item) => item.id)

  return (
    <>
      <Suspense fallback={null}>
        <RedditFAQQueryHandler itemIds={itemIds} setOpenItem={setOpenItem} />
      </Suspense>

      <Accordion
        type="single"
        collapsible
        className="divide-y divide-border"
        value={openItem}
        onValueChange={setOpenItem}
      >
          {items.map((item) => (
            <AccordionItem
              key={item.question}
              value={item.id}
              className="border-border"
              id={`faq-${item.id}`}
            >
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent className="text-sm leading-6 text-muted-foreground md:text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
    </>
  )
}

function RedditFAQQueryHandler({
  itemIds,
  setOpenItem
}: {
  itemIds: string[]
  setOpenItem: Dispatch<SetStateAction<string>>
}) {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const faqParam = searchParams.get("faq")
    if (!faqParam || !itemIds.includes(faqParam)) {
      return
    }

    queueMicrotask(() => setOpenItem(faqParam))

    setTimeout(() => {
      document
        .getElementById("faq")
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete("faq")
    const newUrl = `${window.location.pathname}${
      newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""
    }#faq`

    router.replace(newUrl)
  }, [itemIds, router, searchParams, setOpenItem])

  return null
}
