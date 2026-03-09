"use client"

import { useTranslations } from "next-intl"
import { ArrowLeft, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"

export default function EmailSentPage() {
  const t = useTranslations("auth.email_sent")

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">{t("check_inbox")}</p>

      <Button asChild variant="outline" className="h-11 w-full">
        <Link href="/login">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back_to_login")}
        </Link>
      </Button>
    </div>
  )
}
