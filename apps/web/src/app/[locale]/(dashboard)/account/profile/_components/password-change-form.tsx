"use client"

import { useTranslations } from "next-intl"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { useChangePassword } from "@/api/account/hooks/use-account"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/providers/auth-provider"

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Required"),
    new_password: z.string().min(8),
    confirm_password: z.string().min(1, "Required")
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ["confirm_password"]
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

export function PasswordChangeForm() {
  const t = useTranslations("account")
  const { user, logout } = useAuth()
  const changePassword = useChangePassword(user.id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: ""
    }
  })

  async function onSubmit(data: PasswordFormValues) {
    try {
      await changePassword.mutateAsync({
        current_password: data.current_password,
        new_password: data.new_password
      })
      toast.success(t("password.successSigningOut"))
      reset()
      // All JWTs are invalidated on the backend after a password change.
      // Log out this session so the user re-authenticates with the new password.
      setTimeout(() => logout(), 1500)
    } catch {
      toast.error(
        "Failed to change password. Please check your current password."
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Warning: changing password signs out all sessions */}
      <div className="flex gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-700 dark:text-amber-400">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>{t("password.sessionWarning")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="current_password">{t("password.current")}</Label>
        <Input
          id="current_password"
          type="password"
          autoComplete="current-password"
          {...register("current_password")}
        />
        {errors.current_password && (
          <p className="text-sm text-destructive">
            {errors.current_password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_password">{t("password.new")}</Label>
        <Input
          id="new_password"
          type="password"
          autoComplete="new-password"
          {...register("new_password")}
        />
        {errors.new_password && (
          <p className="text-sm text-destructive">{t("password.minLength")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">{t("password.confirm")}</Label>
        <Input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          {...register("confirm_password")}
        />
        {errors.confirm_password && (
          <p className="text-sm text-destructive">{t("password.mismatch")}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        {t("password.change")}
      </Button>
    </form>
  )
}
