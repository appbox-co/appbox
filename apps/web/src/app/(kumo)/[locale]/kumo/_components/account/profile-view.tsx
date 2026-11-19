"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Badge,
  Banner,
  Button,
  Input,
  LinkButton,
  SkeletonLine
} from "@cloudflare/kumo"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  PencilSimpleIcon,
  UserCircleIcon,
  WarningCircleIcon,
  WarningIcon
} from "@phosphor-icons/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { useKumoRoutes } from "../kumo-routes"
import { Panel } from "../panel"
import type { Loadable } from "../shared"
import { AccountHeader, SettingList, SettingRow } from "./setting-list"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  details: "Account details",
  displayName: "Display name",
  displayNameHint: "The name shown in the dashboard and on your comments.",
  edit: "Edit",
  save: "Save",
  cancel: "Cancel",
  twoFactor: "Two-factor authentication",
  twoFactorHint: "A code from an authenticator app each time you sign in.",
  setUp: "Set up",
  manage: "Manage",
  password: "Change password",
  currentPassword: "Current password",
  newPassword: "New password",
  confirmPassword: "Confirm new password",
  // The current form's own message, which has no translation string.
  passwordFailed:
    "Failed to change password. Please check your current password."
} as const

export interface ProfileSummary {
  alias: string
  email: string
  created_at: string
}

export interface ProfileViewProps {
  profile: Loadable<ProfileSummary>
  twoFactorEnabled: boolean
  /** Saves a new display name. Rejects if that fails. */
  onSaveAlias: (alias: string) => Promise<unknown>
  /** Changes the password. Rejects if that fails. */
  onChangePassword: (data: {
    current_password: string
    new_password: string
  }) => Promise<unknown>
}

/* -------------------------------------------------------------------------- */
/*  Display name                                                               */
/* -------------------------------------------------------------------------- */

/** The display name, editable in place: Enter saves, Escape cancels. */
function DisplayName({
  alias,
  onSave
}: {
  alias: string
  onSave: (alias: string) => Promise<unknown>
}) {
  const t = useTranslations("account")
  const tc = useTranslations("common")
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("")
  const [saving, setSaving] = useState(false)

  const cancel = () => {
    setEditing(false)
    setValue("")
  }

  const save = async () => {
    if (!value.trim() || saving) return
    setSaving(true)
    try {
      await onSave(value.trim())
      toast.success(tc("toast.displayNameUpdated"))
      setEditing(false)
    } catch {
      toast.error(tc("toast.displayNameFailed"))
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <>
        <span className="min-w-0 truncate">{alias}</span>
        <Button
          size="sm"
          icon={PencilSimpleIcon}
          onClick={() => {
            setValue(alias ?? "")
            setEditing(true)
          }}
        >
          {COPY.edit}
        </Button>
      </>
    )
  }

  return (
    <>
      <Input
        aria-label={COPY.displayName}
        className="w-56 max-w-full"
        value={value}
        placeholder={t("profile.aliasPlaceholder")}
        autoFocus
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void save()
          if (event.key === "Escape") cancel()
        }}
      />
      <Button
        variant="primary"
        loading={saving}
        disabled={saving}
        onClick={() => void save()}
      >
        {COPY.save}
      </Button>
      <Button variant="ghost" disabled={saving} onClick={cancel}>
        {COPY.cancel}
      </Button>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Password                                                                   */
/* -------------------------------------------------------------------------- */

// The current form's rules, unchanged.
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

function PasswordForm({
  onChangePassword
}: Pick<ProfileViewProps, "onChangePassword">) {
  const t = useTranslations("account")
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

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      await onChangePassword({
        current_password: data.current_password,
        new_password: data.new_password
      })
      toast.success(t("password.successSigningOut"))
      reset()
    } catch {
      toast.error(COPY.passwordFailed)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-5"
      noValidate
    >
      <Banner
        variant="alert"
        icon={<WarningIcon weight="fill" />}
        description={t("password.sessionWarning")}
      />
      <div className="grid max-w-sm grid-cols-1 gap-4">
        <Input
          type="password"
          label={COPY.currentPassword}
          autoComplete="current-password"
          error={errors.current_password?.message}
          {...register("current_password")}
        />
        <Input
          type="password"
          label={COPY.newPassword}
          autoComplete="new-password"
          error={errors.new_password ? t("password.minLength") : undefined}
          {...register("new_password")}
        />
        <Input
          type="password"
          label={COPY.confirmPassword}
          autoComplete="new-password"
          error={errors.confirm_password ? t("password.mismatch") : undefined}
          {...register("confirm_password")}
        />
      </div>
      <div className="flex">
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {COPY.password}
        </Button>
      </div>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

function ProfileSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="divide-y divide-kumo-hairline rounded-lg bg-kumo-base shadow-xs ring ring-kumo-line"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-5 py-5">
          <SkeletonLine className="h-2.5 w-32 rounded-full" />
          <SkeletonLine className="ms-auto h-2.5 w-40 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/**
 * The account's own details as a list of settings (name, email, two-factor,
 * age), then the password form. One column, as Cloudflare lays out a profile.
 */
export function ProfileView({
  profile,
  twoFactorEnabled,
  onSaveAlias,
  onChangePassword
}: ProfileViewProps) {
  const t = useTranslations("account")
  const tc = useTranslations("common")
  const locale = useLocale()
  const routes = useKumoRoutes()

  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        icon={<UserCircleIcon aria-hidden="true" size={24} />}
        title={t("profile.title")}
        description={t("profile.description")}
      />

      {profile.status === "loading" && <ProfileSkeleton />}

      {profile.status === "error" && (
        <Banner
          variant="error"
          icon={<WarningCircleIcon weight="fill" />}
          title={tc("errors.loadProfileFailed")}
        />
      )}

      {profile.status === "ready" && (
        <>
          <Panel title={COPY.details} flush>
            <SettingList>
              <SettingRow label={COPY.displayName} hint={COPY.displayNameHint}>
                <DisplayName alias={profile.data.alias} onSave={onSaveAlias} />
              </SettingRow>
              <SettingRow label={t("profile.email")}>
                <span className="font-mono text-[0.9em] break-all">
                  {profile.data.email}
                </span>
              </SettingRow>
              <SettingRow label={COPY.twoFactor} hint={COPY.twoFactorHint}>
                <Badge
                  variant={twoFactorEnabled ? "success" : "warning"}
                  appearance="dot"
                >
                  {twoFactorEnabled
                    ? t("profile.twoFactorEnabled")
                    : t("profile.twoFactorDisabled")}
                </Badge>
                <LinkButton
                  href={routes.twoFactor}
                  size="sm"
                  variant="secondary"
                >
                  {twoFactorEnabled ? COPY.manage : COPY.setUp}
                </LinkButton>
              </SettingRow>
              <SettingRow label={t("profile.memberSince")}>
                <time
                  dateTime={profile.data.created_at}
                  className="tabular-nums"
                  suppressHydrationWarning
                >
                  {new Date(profile.data.created_at).toLocaleDateString(
                    locale,
                    { month: "long", day: "numeric", year: "numeric" }
                  )}
                </time>
              </SettingRow>
            </SettingList>
          </Panel>

          <Panel title={COPY.password}>
            <PasswordForm onChangePassword={onChangePassword} />
          </Panel>
        </>
      )}
    </div>
  )
}
