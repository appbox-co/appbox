"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion-plus"

export function FAQSection({
  title,
  description,
  id
}: {
  title: string
  description?: string
  id?: string
}) {
  const t = useTranslations("site.faq")
  const [openItem, setOpenItem] = useState<string>("")
  const searchParams = useSearchParams()
  const router = useRouter()

  const questions = [
    "payment_methods",
    "deployment_time",
    "server_location",
    "root_access",
    "security",
    "data_access",
    "additional_software",
    "fuse_rclone",
    "refund_policy",
    "custom_domain",
    "upgrade_after_purchase",
    "resource_multipliers",
    "excluded_app_categories"
  ]

  useEffect(() => {
    // Check if there's a faq query parameter
    const faqParam = searchParams.get("faq")
    if (faqParam && questions.includes(faqParam)) {
      setOpenItem(faqParam)
      // Small delay to ensure the accordion opens before scrolling
      setTimeout(() => {
        const element = document.getElementById("faq")
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 100)

      // Clean up the URL by removing the query parameter
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete("faq")
      const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}#faq`
      router.replace(newUrl)
    }
  }, [searchParams, questions, router])

  return (
    <section id={id} className="scroll-mt-16 py-16">
      <div className="container">
        <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
              {title}
            </h2>
            {description && (
              <p className="text-muted-foreground mt-4">{description}</p>
            )}
          </div>
          <div className="divide-border divide-y">
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
          </div>
        </div>
      </div>
    </section>
  )
}
