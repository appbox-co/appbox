"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "@/i18n/routing"

const forgotSchema = z.object({
  email: z.string().email()
})

type ForgotValues = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgot")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" }
  })

  async function onSubmit(values: ForgotValues) {
    setIsLoading(true)
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "https://api.appbox.co/v1"
      const res = await fetch(`${API_BASE_URL}/users/forgot`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ email: values.email })
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMsg =
          (typeof data.error === "string" ? data.error : data.error?.message) ||
          data.message ||
          t("error_generic")
        toast.error(errorMsg)
        return
      }

      toast.success(t("success"))
      router.push("/forgot/emailsent")
    } catch {
      toast.error(t("error_generic"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email_label")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("email_placeholder")}
            className="h-11"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{t("email_error")}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="h-11 w-full"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("submit")}
        </Button>
      </form>

      <p className="text-center text-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("back_to_login")}
        </Link>
      </p>
    </div>
  )
}
