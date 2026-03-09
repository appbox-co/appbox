"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { LogOut, Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ROUTES } from "@/constants/routes"
import { useAuth } from "@/providers/auth-provider"

export function UserMenu() {
  const { user, logout } = useAuth()
  const t = useTranslations("dashboard.header")

  const avatarInitial =
    user.alias?.[0]?.toUpperCase() || user.email[0].toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <div
            data-anonymize-initial
            className="flex size-8 items-center justify-center rounded-full bg-[hsl(var(--sidebar-avatar-bg,239_84%_67%))] text-white text-xs font-bold"
          >
            {avatarInitial}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 p-2">
          <div
            data-anonymize-initial
            className="flex size-8 items-center justify-center rounded-full bg-[hsl(var(--sidebar-avatar-bg,239_84%_67%))] text-white text-xs font-bold"
          >
            {avatarInitial}
          </div>
          <div className="flex flex-col">
            <span data-anonymize className="text-sm font-medium">
              {user.alias || user.email}
            </span>
            <span data-anonymize className="text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.PROFILE}>
            <User className="mr-2 size-4" />
            {t("profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.TWO_FACTOR_SETUP}>
            <Shield className="mr-2 size-4" />
            {t("security")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 size-4" />
          {t("sign_out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
