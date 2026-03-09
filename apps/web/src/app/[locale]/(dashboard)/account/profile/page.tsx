"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import {
  AlertCircle,
  Calendar,
  Check,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  X
} from "lucide-react"
import { toast } from "sonner"
import {
  use2FAStatus,
  useProfile,
  useUpdateProfile
} from "@/api/account/hooks/use-account"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ROUTES } from "@/constants/routes"
import { useAuth } from "@/providers/auth-provider"
import { PasswordChangeForm } from "./_components/password-change-form"

/* -------------------------------------------------------------------------- */
/*  Avatar with initials fallback                                              */
/* -------------------------------------------------------------------------- */

function ProfileAvatar({
  alias,
  avatarUrl
}: {
  alias: string
  avatarUrl: string | null
}) {
  const initials = alias
    ? alias
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={alias}
        width={80}
        height={80}
        unoptimized
        className="size-20 rounded-full border-2 border-border object-cover"
      />
    )
  }

  return (
    <div className="flex size-20 items-center justify-center rounded-full border-2 border-border bg-muted text-xl font-bold text-muted-foreground">
      {initials}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                           */
/* -------------------------------------------------------------------------- */

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[400px] animate-pulse rounded-xl border bg-muted" />
        <div className="h-[400px] animate-pulse rounded-xl border bg-muted" />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function ProfilePage() {
  const t = useTranslations("account")
  const tc = useTranslations("common")
  const locale = useLocale()
  const { user } = useAuth()
  const { data: profile, isLoading, error } = useProfile(user.id)
  const { data: twoFactorStatus } = use2FAStatus()
  const updateProfile = useUpdateProfile(user.id)

  const [isEditingAlias, setIsEditingAlias] = useState(false)
  const [aliasValue, setAliasValue] = useState("")

  if (isLoading) return <ProfileSkeleton />

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        {tc("errors.loadProfileFailed")}
      </div>
    )
  }

  const displayProfile = profile ?? {
    id: user.id,
    email: user.email,
    alias: user.alias,
    avatar_url: user.avatar,
    two_factor_enabled: user.two_factor_enabled,
    created_at: user.created_at
  }

  function startEditing() {
    setAliasValue(displayProfile.alias ?? "")
    setIsEditingAlias(true)
  }

  async function saveAlias() {
    if (!aliasValue.trim()) return
    try {
      await updateProfile.mutateAsync({ alias: aliasValue.trim() })
      toast.success(tc("toast.displayNameUpdated"))
      setIsEditingAlias(false)
    } catch {
      toast.error(tc("toast.displayNameFailed"))
    }
  }

  function cancelEditing() {
    setIsEditingAlias(false)
    setAliasValue("")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("profile.title")}
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------------------------------------------------------------- */}
        {/*  Profile Info Card                                                */}
        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4 text-muted-foreground" />
              {t("profile.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <ProfileAvatar
                alias={displayProfile.alias ?? ""}
                avatarUrl={displayProfile.avatar_url}
              />
              <div className="min-w-0 flex-1">
                {isEditingAlias ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={aliasValue}
                      onChange={(e) => setAliasValue(e.target.value)}
                      placeholder={t("profile.aliasPlaceholder")}
                      className="h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveAlias()
                        if (e.key === "Escape") cancelEditing()
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 shrink-0"
                      onClick={saveAlias}
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 shrink-0"
                      onClick={cancelEditing}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-lg font-semibold">
                      {displayProfile.alias}
                    </h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 shrink-0"
                      onClick={startEditing}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {displayProfile.email}
                </p>
              </div>
            </div>

            <Separator />

            {/* Email (read-only) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="size-4" />
                {t("profile.email")}
              </div>
              <p className="text-sm">{displayProfile.email}</p>
            </div>

            {/* 2FA Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Shield className="size-4" />
                {t("profile.twoFactorStatus")}
              </div>
              <div className="flex items-center gap-3">
                {(twoFactorStatus?.enabled ??
                displayProfile.two_factor_enabled) ? (
                  <>
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    >
                      <ShieldCheck className="size-3.5" />
                      {t("profile.twoFactorEnabled")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      asChild
                    >
                      <Link href={ROUTES.TWO_FACTOR_SETUP}>
                        {t("profile.manage2FA")}
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    >
                      <ShieldAlert className="size-3.5" />
                      {t("profile.twoFactorDisabled")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      asChild
                    >
                      <Link href={ROUTES.TWO_FACTOR_SETUP}>
                        {t("profile.enable2FA")}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Member since */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="size-4" />
                {t("profile.memberSince")}
              </div>
              <p className="text-sm">
                {new Date(displayProfile.created_at).toLocaleDateString(
                  locale,
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/*  Password Change Card                                             */}
        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="size-4 text-muted-foreground" />
              {t("password.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordChangeForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
