"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion-plus"
import { useTranslations } from "next-intl"

export function FAQSection({
  title,
  description,
  id,
}: {
  title: string
  description?: string
  id?: string
}) {
  const t = useTranslations("site.faq")
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
  ]

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
            <Accordion type="single" collapsible className="w-full">
              {questions.map((question) => (
                <AccordionItem key={question} value={question}>
                  <AccordionTrigger>
                    {/* @ts-expect-error - Dynamic translation keys */}
                    {t(`questions.${question}.title`)}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="max-w-none text-sm/[1.125rem] text-neutral-500 md:text-base/[1.375rem] dark:text-neutral-400">
                      <div
                        dangerouslySetInnerHTML={{
                          /* @ts-expect-error - Dynamic translation keys */
                          __html: t.raw(`questions.${question}.content`),
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
