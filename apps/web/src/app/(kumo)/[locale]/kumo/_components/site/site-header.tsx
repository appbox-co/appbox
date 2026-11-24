"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties
} from "react"
import { useLocale } from "next-intl"
import { useTheme } from "next-themes"
import { Button, cn, DropdownMenu, LinkButton } from "@cloudflare/kumo"
import {
  CaretDownIcon,
  CaretUpDownIcon,
  ListIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  ReceiptIcon,
  SquaresFourIcon,
  SunIcon,
  TranslateIcon
} from "@phosphor-icons/react"
import {
  Link,
  localeNames,
  supportedLocales,
  usePathname,
  useRouter
} from "@/i18n/routing"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"
import { useQuickSearch } from "../quick-search"
import {
  ACCOUNT_LINKS,
  MORE_LINKS,
  SITE_LINKS,
  siteMenus,
  type MenuLink
} from "./site-links"

const COPY = {
  home: "Appbox home",
  main: "Main",
  billing: "Billing",
  controlPanel: "Control panel",
  getAppbox: "Get an Appbox",
  search: "Search",
  searchTitle: "Search (⌘K)",
  menu: "Menu",
  account: "Your account",
  more: "More",
  language: (name: string) => `Language: ${name}`,
  theme: "Switch between light and dark"
} as const

function MenuItem({ link }: { link: MenuLink }) {
  const Icon = link.icon
  return (
    <Link className="ks-item" href={link.href}>
      <Icon size={18} className="ks-item-icon" aria-hidden="true" />
      <span className="grid gap-0.5">
        <span className="font-medium text-kumo-default">{link.title}</span>
        <span className="text-kumo-subtle">{link.text}</span>
      </span>
    </Link>
  )
}

function persistLocale(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`
}

/** The language picker: a Kumo dropdown menu of every locale the site has. */
function LanguageMenu({ variant }: { variant: "code" | "name" }) {
  const locale = useLocale() as LocaleOptions
  const router = useRouter()
  const pathname = usePathname()
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
            persistLocale(String(next))
            router.replace(pathname, { locale: next as LocaleOptions })
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

/** Both icons render; the stylesheet shows the one for the current mode. */
function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      shape="square"
      aria-label={COPY.theme}
      className={className}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon size={18} className="ks-sun" aria-hidden="true" />
      <MoonIcon size={18} className="ks-moon" aria-hidden="true" />
    </Button>
  )
}

/**
 * The Products and Resources menus, after cloudflare.com: one shared panel
 * under the nav. Moving from one menu to the other keeps the panel open,
 * resizes it to the new content and slides the content in from the side the
 * pointer moved to, while the highlight slides to the new trigger.
 */
function MainNav({ appCount }: { appCount: number }) {
  const menus = siteMenus(appCount)
  const triggers = useRef<(HTMLButtonElement | null)[]>([])
  const contents = useRef<(HTMLDivElement | null)[]>([])
  const navRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [from, setFrom] = useState<"left" | "right" | null>(null)
  const [leaving, setLeaving] = useState<{ index: number; dir: number } | null>(
    null
  )
  const [jump, setJump] = useState(false)
  const [size, setSize] = useState({ width: 600, height: 200 })
  const [highlight, setHighlight] = useState({ x: 0, width: 0 })
  const timers = useRef<{ open?: number; close?: number; clear?: number }>({})

  const show = useCallback(
    (index: number) => {
      window.clearTimeout(timers.current.close)
      window.clearTimeout(timers.current.clear)
      if (open && index === active) return
      if (!open || active === -1) {
        setJump(true)
        setFrom(null)
        setLeaving(null)
      } else {
        const dir = index > active ? 1 : -1
        setJump(false)
        setLeaving({ index: active, dir })
        setFrom(dir > 0 ? "right" : "left")
      }
      setActive(index)
      setOpen(true)
    },
    [open, active]
  )

  const hide = useCallback(() => {
    window.clearTimeout(timers.current.open)
    setOpen(false)
    window.clearTimeout(timers.current.clear)
    // Keep the content until the panel has faded out.
    timers.current.clear = window.setTimeout(() => {
      setActive(-1)
      setLeaving(null)
    }, 160)
  }, [])

  const hideSoon = useCallback(() => {
    window.clearTimeout(timers.current.close)
    timers.current.close = window.setTimeout(hide, 180)
  }, [hide])

  useLayoutEffect(() => {
    if (!open || active === -1) return
    const content = contents.current[active]
    const trigger = triggers.current[active]
    if (content) {
      setSize({
        width: content.offsetWidth + 10,
        height: content.offsetHeight + 10
      })
    }
    if (trigger) {
      setHighlight({ x: trigger.offsetLeft, width: trigger.offsetWidth })
    }
  }, [open, active])

  useEffect(() => {
    if (!jump) return
    const frame = requestAnimationFrame(() => setJump(false))
    return () => cancelAnimationFrame(frame)
  }, [jump])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element
      const inside =
        navRef.current?.contains(target) ||
        viewportRef.current?.contains(target)
      if (!inside || target.closest(".ks-item")) hide()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !open) return
      triggers.current[active]?.focus()
      hide()
    }
    document.addEventListener("click", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("click", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [hide, open, active])

  const canHover = () =>
    matchMedia("(hover: hover) and (pointer: fine)").matches

  return (
    <>
      <nav
        ref={navRef}
        className="ks-nav"
        aria-label={COPY.main}
        onMouseLeave={() => canHover() && hideSoon()}
      >
        <span
          aria-hidden="true"
          className={cn("ks-ind", open && "ks-on", jump && "ks-jump")}
          style={
            {
              "--ix": `${highlight.x}px`,
              "--iw": `${highlight.width}px`
            } as CSSProperties
          }
        />
        {menus.map((menu, index) => (
          <button
            key={menu.key}
            ref={(element) => {
              triggers.current[index] = element
            }}
            type="button"
            className="ks-trigger"
            aria-expanded={open && active === index}
            aria-controls={`ks-menu-${menu.key}`}
            onClick={() => (open && active === index ? hide() : show(index))}
            onMouseEnter={() => {
              if (!canHover()) return
              window.clearTimeout(timers.current.open)
              timers.current.open = window.setTimeout(
                () => show(index),
                open ? 0 : 80
              )
            }}
          >
            {menu.label}
            <CaretUpDownIcon
              size={14}
              className="opacity-70"
              aria-hidden="true"
            />
          </button>
        ))}
        {SITE_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="ks-trigger"
            onMouseEnter={() => canHover() && hideSoon()}
          >
            {link.title}
          </Link>
        ))}
      </nav>
      <div
        ref={viewportRef}
        className={cn("ks-viewport", open && "ks-open", jump && "ks-jump")}
        style={
          {
            "--vw": `${size.width}px`,
            "--vh": `${size.height}px`
          } as CSSProperties
        }
        onMouseEnter={() => window.clearTimeout(timers.current.close)}
        onMouseLeave={() => canHover() && hideSoon()}
      >
        <div className="ks-vp-in">
          {menus.map((menu, index) => {
            const isActive = index === active
            const out =
              leaving?.index === index ? `${-leaving.dir * 48}px` : "0px"
            return (
              <div
                key={menu.key}
                id={`ks-menu-${menu.key}`}
                ref={(element) => {
                  contents.current[index] = element
                }}
                className={`ks-content ks-cols-${menu.groups.length}`}
                data-state={isActive ? "active" : "inactive"}
                data-from={isActive && from ? from : undefined}
                style={{ "--out": out } as CSSProperties}
              >
                {menu.groups.map((group) => (
                  <div key={group.title} className="ks-col">
                    <p className="ks-col-head">{group.title}</p>
                    {group.links.map((link) => (
                      <MenuItem key={link.title} link={link} />
                    ))}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export function SiteHeader({ appCount }: { appCount: number }) {
  const openSearch = useQuickSearch()
  const [sheet, setSheet] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!sheet) return
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element
      if (burgerRef.current?.contains(target)) return
      if (!sheetRef.current?.contains(target) || target.closest(".ks-item")) {
        setSheet(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheet(false)
    }
    document.addEventListener("click", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("click", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [sheet])

  return (
    <header className="ks-head">
      <Link className="ks-logo" href="/kumo" aria-label={COPY.home} />
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
      <div
        ref={sheetRef}
        id="ks-sheet"
        className={cn("ks-sheet", sheet && "ks-open")}
      >
        <div className="ks-sheet-account gap-0.5">
          <p className="ks-sheet-head">{COPY.account}</p>
          <MenuItem
            link={{
              icon: ReceiptIcon,
              title: COPY.billing,
              text: "Invoices, plans and payment",
              href: ACCOUNT_LINKS.billing
            }}
          />
          <MenuItem
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
                <MenuItem key={link.title} link={link} />
              ))}
            </div>
          ))
        )}
        <div className="grid gap-0.5">
          <p className="ks-sheet-head">{COPY.more}</p>
          {MORE_LINKS.map((link) => (
            <MenuItem key={link.title} link={link} />
          ))}
        </div>
        <div className="ks-sheet-prefs">
          <LanguageMenu variant="name" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
