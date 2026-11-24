"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties
} from "react"
import { useLocale } from "next-intl"
import { Button, cn, DropdownMenu, LinkButton } from "@cloudflare/kumo"
import {
  CaretDownIcon,
  CaretUpDownIcon,
  ListIcon,
  MagnifyingGlassIcon,
  ReceiptIcon,
  SquaresFourIcon,
  TranslateIcon
} from "@phosphor-icons/react"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"
import { Icons } from "@/components/shared/icons"
import { Link, localeNames, supportedLocales } from "@/i18n/routing"
import { ThemeToggle } from "../app-shell"
import { useQuickSearch } from "../quick-search"
import { useChangeLocale, type Locale } from "../use-change-locale"
import {
  ACCOUNT_LINKS,
  MORE_LINKS,
  SITE_LINKS,
  siteMenus,
  type MenuLink
} from "./site-links"

const COPY = {
  home: "Appbox home",
  billing: "Billing",
  controlPanel: "Control panel",
  getAppbox: "Get an Appbox",
  search: "Search",
  searchTitle: "Search (⌘K)",
  menu: "Menu",
  account: "Your account",
  more: "More",
  language: (name: string) => `Language: ${name}`
} as const

/** One menu link. Takes extra props and a ref, so Radix's Link can wrap it. */
const MenuItem = forwardRef<
  HTMLAnchorElement,
  { link: MenuLink } & Omit<ComponentPropsWithoutRef<"a">, "href">
>(function MenuItem({ link, className, ...rest }, ref) {
  const Icon = link.icon
  return (
    <Link
      ref={ref}
      href={link.href}
      className={cn("ks-item", className)}
      {...rest}
    >
      <Icon size={18} className="ks-item-icon" aria-hidden="true" />
      <span className="grid gap-0.5">
        <span className="font-medium text-kumo-default">{link.title}</span>
        <span className="text-kumo-subtle">{link.text}</span>
      </span>
    </Link>
  )
})

/** The language picker: a Kumo dropdown menu of every locale the site has. */
function LanguageMenu({ variant }: { variant: "code" | "name" }) {
  const locale = useLocale() as Locale
  const changeLocale = useChangeLocale()
  const name = localeNames[locale] ?? locale

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={
          <button
            type="button"
            className="ks-lang"
            aria-label={COPY.language(name)}
          />
        }
      >
        <TranslateIcon size={16} className="shrink-0" aria-hidden="true" />
        <span>{variant === "code" ? locale.toUpperCase() : name}</span>
        <CaretDownIcon
          size={12}
          className="shrink-0 text-kumo-subtle"
          aria-hidden="true"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align={variant === "code" ? "end" : "start"}
        className="max-h-96 overflow-y-auto"
      >
        <DropdownMenu.RadioGroup
          value={locale}
          onValueChange={(next) => {
            if (next !== locale) changeLocale(next as Locale)
          }}
        >
          {supportedLocales.map((code) => (
            <DropdownMenu.RadioItem key={code} value={code} lang={code}>
              <span dir="auto">{localeNames[code]}</span>
              <DropdownMenu.RadioItemIndicator className="ms-auto" />
            </DropdownMenu.RadioItem>
          ))}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}

/**
 * The Products and Resources menus, after cloudflare.com: Radix's navigation
 * menu, so one shared panel resizes to each menu, the content slides in from
 * the side the pointer moved to, and a highlight follows the open trigger.
 * Only the look lives in kumo-site.css.
 */
function MainNav({ appCount }: { appCount: number }) {
  return (
    <NavigationMenu.Root delayDuration={80}>
      <NavigationMenu.List className="ks-nav">
        {siteMenus(appCount).map((menu) => (
          <NavigationMenu.Item key={menu.key} value={menu.key}>
            <NavigationMenu.Trigger className="ks-trigger">
              {menu.label}
              <CaretUpDownIcon
                size={14}
                className="opacity-70"
                aria-hidden="true"
              />
            </NavigationMenu.Trigger>
            <NavigationMenu.Content
              className="ks-content"
              style={{ "--cols": menu.groups.length } as CSSProperties}
            >
              {menu.groups.map((group) => (
                <div key={group.title} className="ks-col">
                  <p className="ks-col-head">{group.title}</p>
                  {group.links.map((link) => (
                    <NavigationMenu.Link key={link.title} asChild>
                      <MenuItem link={link} />
                    </NavigationMenu.Link>
                  ))}
                </div>
              ))}
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        ))}
        {SITE_LINKS.map((link) => (
          <NavigationMenu.Item key={link.href}>
            <NavigationMenu.Link asChild>
              <Link href={link.href} className="ks-trigger">
                {link.title}
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        ))}
        <NavigationMenu.Indicator className="ks-ind" />
      </NavigationMenu.List>
      <div className="ks-viewport-pos">
        <NavigationMenu.Viewport className="ks-viewport" />
      </div>
    </NavigationMenu.Root>
  )
}

/** The phone menu: every menu's links in one sheet under the header. */
function MenuSheet({
  appCount,
  open,
  onClose,
  burgerRef
}: {
  appCount: number
  open: boolean
  onClose: () => void
  burgerRef: React.RefObject<HTMLButtonElement | null>
}) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        !sheetRef.current?.contains(target) &&
        !burgerRef.current?.contains(target)
      ) {
        onClose()
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("click", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("click", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open, onClose, burgerRef])

  return (
    <div
      ref={sheetRef}
      id="ks-sheet"
      className={cn("ks-sheet", open && "ks-open")}
    >
      <div className="ks-sheet-account gap-0.5">
        <p className="ks-sheet-head">{COPY.account}</p>
        <MenuItem
          onClick={onClose}
          link={{
            icon: ReceiptIcon,
            title: COPY.billing,
            text: "Invoices, plans and payment",
            href: ACCOUNT_LINKS.billing
          }}
        />
        <MenuItem
          onClick={onClose}
          link={{
            icon: SquaresFourIcon,
            title: COPY.controlPanel,
            text: "Manage your apps and Appbox",
            href: ACCOUNT_LINKS.controlPanel
          }}
        />
      </div>
      {siteMenus(appCount).flatMap((menu) =>
        menu.groups.map((group) => (
          <div key={group.title} className="grid gap-0.5">
            <p className="ks-sheet-head">{group.title}</p>
            {group.links.map((link) => (
              <MenuItem key={link.title} link={link} onClick={onClose} />
            ))}
          </div>
        ))
      )}
      <div className="grid gap-0.5">
        <p className="ks-sheet-head">{COPY.more}</p>
        {MORE_LINKS.map((link) => (
          <MenuItem key={link.title} link={link} onClick={onClose} />
        ))}
      </div>
      <div className="ks-sheet-prefs">
        <LanguageMenu variant="name" />
        <ThemeToggle />
      </div>
    </div>
  )
}

export function SiteHeader({ appCount }: { appCount: number }) {
  const openSearch = useQuickSearch()
  const [sheet, setSheet] = useState(false)
  const closeSheet = useCallback(() => setSheet(false), [])
  const burgerRef = useRef<HTMLButtonElement>(null)

  return (
    <header className="ks-head">
      <Link href="/kumo" aria-label={COPY.home}>
        <Icons.sitename className="h-6 w-auto text-kumo-default" />
      </Link>
      <MainNav appCount={appCount} />
      <div className="ks-head-end">
        <span className="ks-head-prefs flex items-center gap-2">
          <LanguageMenu variant="code" />
          <ThemeToggle />
        </span>
        <LinkButton
          href={ACCOUNT_LINKS.billing}
          variant="secondary"
          className="ks-account"
          external
        >
          {COPY.billing}
        </LinkButton>
        <LinkButton
          href={ACCOUNT_LINKS.controlPanel}
          variant="secondary"
          className="ks-account"
        >
          {COPY.controlPanel}
        </LinkButton>
        <LinkButton href="/kumo#plans" variant="primary">
          {COPY.getAppbox}
        </LinkButton>
        <Button
          variant="secondary"
          shape="square"
          aria-label={COPY.search}
          aria-haspopup="dialog"
          aria-keyshortcuts="Meta+K Control+K"
          title={COPY.searchTitle}
          onClick={openSearch}
        >
          <MagnifyingGlassIcon size={18} aria-hidden="true" />
        </Button>
        <Button
          ref={burgerRef}
          variant="ghost"
          shape="square"
          className="ks-burger"
          aria-label={COPY.menu}
          aria-expanded={sheet}
          aria-controls="ks-sheet"
          onClick={() => setSheet((current) => !current)}
        >
          <ListIcon size={20} aria-hidden="true" />
        </Button>
      </div>
      <MenuSheet
        appCount={appCount}
        open={sheet}
        onClose={closeSheet}
        burgerRef={burgerRef}
      />
    </header>
  )
}
