"use client"

import type { ReactNode } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Badge, LinkButton, Select } from "@cloudflare/kumo"
import { GlobeIcon } from "@phosphor-icons/react"
import { Icons } from "@/components/shared/icons"
import { localeNames, supportedLocales } from "@/i18n/routing"
import { ThemeToggle } from "../app-shell"
import { KumoRoutesProvider } from "../kumo-routes"
import { useChangeLocale, type Locale } from "../use-change-locale"
import { AppStrip, AppWall, useWallApps } from "./app-wall"

/** Where Appbox accounts come from: buying a plan on the main site. */
export const PLANS_HREF = "/#plans-section"

function LanguageSelect() {
  const t = useTranslations("site.buttons")
  const locale = useLocale() as Locale
  const changeLocale = useChangeLocale()

  return (
    <Select
      aria-label={t("toggle_language")}
      size="sm"
      className="w-auto"
      value={locale}
      onValueChange={(next) => {
        if (next && next !== locale) changeLocale(next as Locale)
      }}
      renderValue={(value) => (
        <span className="flex items-center gap-1.5">
          <GlobeIcon size={16} className="shrink-0 text-kumo-subtle" />
          {localeNames[value as Locale] ?? String(value)}
        </span>
      )}
    >
      {supportedLocales.map((code) => (
        <Select.Option key={code} value={code}>
          {localeNames[code]}
        </Select.Option>
      ))}
    </Select>
  )
}

interface AuthFrameProps {
  /** Sample pages link their twin among the sample pages. */
  demo: boolean
  /** The same page in the current design. */
  currentDesignHref: string
  /** Sample pages only: the state picker, shown above the page. */
  sample?: ReactNode
  children: ReactNode
}

/**
 * The signed-out pages: the form in a column of its own, and beside it a
 * panel of the catalogue's apps drifting past, since apps are what Appbox is
 * for. On a phone the panel shrinks to one row above the form.
 */
export function AuthFrame({
  demo,
  currentDesignHref,
  sample,
  children
}: AuthFrameProps) {
  const t = useTranslations("auth.login")
  const tApps = useTranslations("site.google_ads_landing.apps_section")
  const tInstall = useTranslations("site.simple_install_promo")
  const apps = useWallApps()

  return (
    <KumoRoutesProvider demo={demo}>
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex min-w-0 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 sm:px-6">
            <a href="/" aria-label="Appbox" className="rounded-md">
              <Icons.sitename className="h-6 w-auto text-kumo-default" />
            </a>
            <div className="flex items-center gap-1.5">
              <Badge variant="beta" className="hidden md:inline-flex">
                Kumo prototype
              </Badge>
              <LinkButton
                href={currentDesignHref}
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
              >
                Current design
              </LinkButton>
              <LanguageSelect />
              <ThemeToggle />
              <LinkButton
                href={PLANS_HREF}
                variant="secondary"
                size="sm"
                className="hidden sm:inline-flex"
              >
                {t("external_signup_link")}
              </LinkButton>
            </div>
          </header>

          <main className="flex flex-1 justify-center px-4 pt-4 pb-16 lg:items-center lg:pt-0">
            {/* One column that may shrink, so the drifting strip cannot widen it. */}
            <div className="grid w-full max-w-96 grid-cols-1 content-start gap-8">
              {sample}
              <div className="lg:hidden">
                <AppStrip apps={apps} />
              </div>
              {children}
            </div>
          </main>
        </div>

        <aside className="sticky top-0 hidden h-dvh p-3 lg:block">
          <div className="relative h-full overflow-hidden rounded-2xl bg-kumo-tint ring ring-kumo-hairline">
            <div className="absolute inset-0 bg-radial-[at_80%_10%] from-kumo-brand/15 to-transparent to-60%" />
            <AppWall apps={apps} />
            <div className="absolute inset-x-0 bottom-0 grid gap-1.5 bg-linear-to-t from-kumo-tint from-45% to-transparent px-10 pt-40 pb-10">
              <h2 className="text-xl font-semibold text-balance">
                {tApps("headline_1")}
              </h2>
              <p className="max-w-md text-kumo-subtle text-pretty">
                {tInstall("description")}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </KumoRoutesProvider>
  )
}

/** A page's heading, with one line under it. */
export function AuthHeading({
  title,
  description
}: {
  title: string
  description?: ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <h1 className="text-2xl font-semibold text-balance">{title}</h1>
      {description && (
        <p className="text-kumo-subtle text-balance">{description}</p>
      )}
    </div>
  )
}
