"use client"

import { Suspense, useEffect, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion-plus"

export function FAQAccordion({
  questions,
  sectionId
}: {
  questions: string[]
  sectionId: string
}) {
  const t = useTranslations("site.faq")
  const [openItem, setOpenItem] = useState<string>("")

  return (
    <>
      <Suspense fallback={null}>
        <FAQAccordionQueryHandler
          questions={questions}
          sectionId={sectionId}
          setOpenItem={setOpenItem}
        />
      </Suspense>
      <Accordion
        type="single"
        collapsible
        className="w-full"
        value={openItem}
        onValueChange={setOpenItem}
      >
        {questions.map((question) => (
          <AccordionItem key={question} value={question}>
            <AccordionTrigger>
              {t(`questions.${question}.title`)}
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-w-none text-sm/[1.125rem] text-neutral-500 md:text-base/[1.375rem] dark:text-neutral-400">
                <div
                  dangerouslySetInnerHTML={{
                    __html: t.raw(`questions.${question}.content`)
                  }}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  )
}

function FAQAccordionQueryHandler({
  questions,
  sectionId,
  setOpenItem
}: {
  questions: string[]
  sectionId: string
  setOpenItem: Dispatch<SetStateAction<string>>
}) {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const faqParam = searchParams.get("faq")
    if (!faqParam || !questions.includes(faqParam)) {
      return
    }

    queueMicrotask(() => setOpenItem(faqParam))

    setTimeout(() => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete("faq")
    const newUrl = `${window.location.pathname}${
      newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""
    }#${sectionId}`

    router.replace(newUrl)
  }, [questions, router, searchParams, sectionId, setOpenItem])

  return null
}
