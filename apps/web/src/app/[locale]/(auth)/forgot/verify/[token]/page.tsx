"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const resetSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"]
  })

type ResetValues = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const t = useTranslations("auth.reset")
  const router = useRouter()
  const params = useParams<{ token: string }>()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" }
  })

  async function onSubmit(values: ResetValues) {
    setIsLoading(true)
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "https://api.appbox.co/v1"
      const res = await fetch(`${API_BASE_URL}/users/forgot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          mail_token: params.token,
          password: values.password
        })
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
      router.push("/login")
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
          <Label htmlFor="password">{t("password_label")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder={t("password_placeholder")}
            className="h-11"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{t("password_error")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("confirm_password_label")}</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t("confirm_password_placeholder")}
            className="h-11"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {t("confirm_password_error")}
            </p>
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
    </div>
  )
}
