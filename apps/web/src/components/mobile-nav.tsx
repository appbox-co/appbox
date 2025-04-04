"use client"

import { useState } from "react"
import * as React from "react"
import { useTranslations } from "next-intl"
import { Icons } from "@/components/icons"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import { siteConfig } from "@/config/site"
import { usePathname, useRouter } from "@/i18n/routing"
import { useDocsConfig } from "@/lib/opendocs/hooks/use-docs-config"
import { DocsSidebarNav } from "./docs/sidebar-nav"
import { MobileLink } from "./mobile-link"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"

// Navigation items shared with main-nav
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

interface MobileNavProps {
  messages: {
    menu: string
    toggleMenu: string
  }
}

export function MobileNav({ messages }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const docsConfig = useDocsConfig()
  const [open, setOpen] = useState(false)
  const t = useTranslations("site.navigation")
  const tExt = useTranslations("site.external_links")

  // Navigation structure using translations
  const mobileNavItems: MenuItem[] = [
    {
      title: t("product"),
      translationKey: "product",
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
          title: t("pricing"),
          translationKey: "pricing",
          href: "/#plans-section",
          icon: Icons.pricing,
          description: t("view_pricing"),
          descriptionKey: "view_pricing"
        },
        {
          title: t("apps"),
          translationKey: "apps",
          href: "/apps",
          icon: Icons.apps,
          description: t("explore_apps"),
          descriptionKey: "explore_apps"
        }
      ]
    },
    {
      title: t("resources"),
      translationKey: "resources",
      children: [
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

  const shouldDisplayDocsSidebarContent = pathname.startsWith("/docs")

  // Handle pricing button click (mirroring main-nav.tsx)
  const handlePricingClick = () => {
    setOpen(false)

    // If on homepage, scroll to plans section
    if (pathname === "/") {
      const plansSection = document.getElementById("plans-section")
      if (plansSection) {
        // Scroll with offset to account for sticky header
        const headerHeight = 60
        const sectionTop =
          plansSection.getBoundingClientRect().top + window.pageYOffset
        window.scrollTo({
          top: sectionTop - headerHeight,
          behavior: "smooth"
        })
      }
    } else {
      // If on another page, navigate to homepage with hash
      router.push("/#plans-section")
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Icons.menu className="size-5" />
          <span className="sr-only">{messages.toggleMenu}</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="pr-0">
        <SheetTitle className="sr-only">{messages.menu}</SheetTitle>

        <MobileLink
          href="/"
          className="flex items-center"
          onOpenChange={setOpen}
        >
          <Icons.emblem className="mr-2 size-4" />
          <span className="font-bold">{siteConfig.name}</span>
        </MobileLink>

        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          {/* Control panel links */}
          <div className="mb-6 flex flex-col space-y-3">
            {/* Add Billing and Control Panel buttons */}
            <MobileLink
              href="https://billing.appbox.co"
              target="_blank"
              rel="noreferrer"
              onOpenChange={setOpen}
              className="flex items-center font-medium"
            >
              {tExt("billing")}
            </MobileLink>

            <MobileLink
              href="https://www.appbox.co/login"
              target="_blank"
              rel="noreferrer"
              onOpenChange={setOpen}
              className="flex items-center font-medium"
            >
              {tExt("control_panel")}
            </MobileLink>
          </div>

          {/* Add Product & Resources categories */}
          <div className="mb-6 flex flex-col space-y-5">
            {mobileNavItems.map((category) => (
              <div
                key={category.translationKey}
                className="flex flex-col space-y-3"
              >
                <h3 className="text-muted-foreground text-sm font-medium">
                  {category.title}
                </h3>
                <div className="flex flex-col space-y-2 pl-2">
                  {category.children?.map((item) => (
                    <MobileLink
                      key={item.translationKey}
                      href={item.href || "#"}
                      onOpenChange={setOpen}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      // Add special handling for pricing link
                      onClick={
                        item.title === t("pricing")
                          ? handlePricingClick
                          : undefined
                      }
                      className="flex items-center"
                    >
                      {item.icon && <item.icon className="mr-2 size-4" />}
                      <span>{item.title}</span>
                    </MobileLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col space-y-2">
            {shouldDisplayDocsSidebarContent && (
              <DocsSidebarNav
                isMobile
                locale={docsConfig.currentLocale}
                items={docsConfig.docs.sidebarNav}
                handleMobileSidebar={setOpen}
              />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
