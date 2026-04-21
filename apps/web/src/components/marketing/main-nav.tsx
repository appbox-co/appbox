"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ChevronDown } from "lucide-react"
import { Icons } from "@/components/shared/icons"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { launchWeekFlags } from "@/config/launch-week-flags"
import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"

interface MenuItem {
  title: string
  href?: string
  description?: string
  icon?: React.ElementType
  children?: MenuItem[]
  external?: boolean
  translationKey?: string
  descriptionKey?: string
}

const navButtonClass = cn(
  buttonVariants({ variant: "ghost" }),
  "h-9 px-3 text-sm font-medium"
)

export function MainNav() {
  const pathname = usePathname()
  const t = useTranslations("site.navigation")

  const components: MenuItem[] = [
    {
      title: t("resources"),
      translationKey: "resources",
      children: [
        {
          title: t("features"),
          translationKey: "features",
          href: "/#features",
          icon: Icons.features,
          description: t("overview"),
          descriptionKey: "overview"
        },
        {
          title: t("documentation"),
          translationKey: "documentation",
          href: "https://billing.appbox.co/knowledgebase",
          icon: Icons.documentation,
          description: t("read_docs"),
          descriptionKey: "read_docs",
          external: true
        },
        {
          title: t("blog"),
          translationKey: "blog",
          href: "/blog",
          icon: Icons.blog,
          description: t("latest_articles"),
          descriptionKey: "latest_articles"
        },
        {
          title: t("faq"),
          translationKey: "faq",
          href: "/#faq",
          icon: Icons.faq,
          description: t("faq_description"),
          descriptionKey: "faq_description"
        },
        {
          title: t("service_status"),
          translationKey: "service_status",
          href: "https://status.appbox.co",
          icon: Icons.serviceStatus,
          description: t("check_status"),
          descriptionKey: "check_status",
          external: true
        }
      ]
    }
  ]

  const handlePricingClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault()
      const plansSection = document.getElementById("plans-section")
      if (plansSection) {
        const headerHeight = 60
        const sectionTop =
          plansSection.getBoundingClientRect().top + window.pageYOffset
        window.scrollTo({
          top: sectionTop - headerHeight,
          behavior: "smooth"
        })
      }
    }
  }

  return (
    <div className="mr-4 hidden md:flex items-center">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <Icons.sitename className="w-32" />
      </Link>

      <nav className="flex items-center gap-1">
        <Link
          href="/#plans-section"
          onClick={handlePricingClick}
          className={navButtonClass}
        >
          {t("pricing")}
        </Link>
        <Link href="/apps" className={navButtonClass}>
          {t("apps")}
        </Link>
        {launchWeekFlags.day_3 && (
          <Link href="/apps?category=VPS" className={navButtonClass}>
            {t("vps")}
          </Link>
        )}

        {components.map((group) => (
          <NavDropdown key={group.translationKey} group={group} />
        ))}
      </nav>
    </div>
  )
}

function NavDropdown({ group }: { group: MenuItem }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      {/* JS-enabled: Radix dropdown */}
      <span className="js-only-nav">
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 px-3 text-sm font-medium gap-1"
            >
              {group.title}
              <ChevronDown
                className={cn(
                  "size-3 transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[500px] p-2">
            <ul className="grid gap-1 lg:grid-cols-2">
              {group.children?.map((item) => (
                <NavDropdownItem
                  key={item.translationKey}
                  item={item}
                  onSelect={() => setOpen(false)}
                />
              ))}
            </ul>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>

      {/* No-JS fallback: native <details> dropdown */}
      <details className="noscript-only-nav hidden relative">
        <summary
          className={cn(
            navButtonClass,
            "list-none cursor-pointer gap-1 [&::-webkit-details-marker]:hidden"
          )}
        >
          {group.title}
          <ChevronDown className="size-3" />
        </summary>
        <ul className="absolute left-0 top-full z-50 mt-2 grid w-[300px] gap-1 rounded-md border bg-popover p-2 shadow-md">
          {group.children?.map((item) => {
            const linkProps = item.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {}
            return (
              <li key={item.translationKey}>
                <Link
                  href={item.href || "#"}
                  {...linkProps}
                  className="flex items-start gap-3 rounded-md p-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {item.icon && (
                    <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium leading-none">
                    {item.title}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </details>
    </>
  )
}

function NavDropdownItem({
  item,
  onSelect
}: {
  item: MenuItem
  onSelect: () => void
}) {
  const linkProps = item.external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {}

  return (
    <li>
      <Link
        href={item.href || ""}
        {...linkProps}
        onClick={onSelect}
        className="flex items-start gap-3 rounded-md p-3 hover:bg-accent hover:text-accent-foreground transition-colors select-none outline-none focus:bg-accent focus:text-accent-foreground"
      >
        {item.icon && (
          <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
        <div className="space-y-1">
          <div className="text-sm font-medium leading-none">{item.title}</div>
          {item.description && (
            <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </Link>
    </li>
  )
}
