'use client'

import { PlusIcon, MinusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion-plus'

export function FAQSection({
  title,
  description,
  id,
}: {
  title: string
  description?: string
  id?: string
}) {
  const t = useTranslations('site.faq')
  const questions = [
    'payment_methods',
    'deployment_time',
    'server_location',
    'root_access',
    'security',
    'data_access',
    'additional_software',
    'fuse_rclone',
    'refund_policy',
    'custom_domain',
  ]

  return (
    <section id={id} className="py-16 scroll-mt-16">
      <div className="container">
        <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
              {title}
            </h2>
            {description && (
              <p className="mt-4 text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="divide-y divide-border">
            <Accordion type="single" collapsible className="w-full">
              {questions.map((question) => (
                <AccordionItem key={question} value={question}>
                  <AccordionTrigger>
                    {t(`questions.${question}.title` as any)}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-neutral-500 dark:text-neutral-400 max-w-none text-sm/[1.125rem] md:text-base/[1.375rem]">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: t.raw(`questions.${question}.content` as any),
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
