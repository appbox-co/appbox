"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu"
import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"

// -----------------------------------------------------------------------
// Added a new interface to support nested menu items.
interface MenuItem {
  title: string
  href?: string
  description?: string
  icon?: React.ElementType // icon component from Icons
  children?: MenuItem[]
  external?: boolean // New property to indicate external links
  translationKey?: string // Added translationKey for translations
  descriptionKey?: string // Added descriptionKey for translations
}

// -----------------------------------------------------------------------
// Replaced the flat "components" array with a nested structure.
// Grouping new items into three parent groups.
// Now using translation keys
export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("site.navigation")

  // Define the components array inside the component to access translations
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

  // Handle pricing button click
  const handlePricingClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

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

  const handleAppsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    router.push("/apps")
  }

  return (
    <div className="mr-4 hidden md:flex">
      {/* ----------------------------------------------------------------
            (The upper-left logo Link is unchanged)
      ---------------------------------------------------------------- */}
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <Icons.sitename className="w-32" />
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          {/* Add standalone pricing button */}
          <NavigationMenuItem>
            <Button
              variant="ghost"
              className={navigationMenuTriggerStyle()}
              onClick={handlePricingClick}
            >
              {t("pricing")}
            </Button>
            <Button
              variant="ghost"
              className={navigationMenuTriggerStyle()}
              onClick={handleAppsClick}
            >
              {t("apps")}
            </Button>
          </NavigationMenuItem>

          {/* Rest of navigation items */}
          {components.map((group) => (
            <NavigationMenuItem key={group.translationKey}>
              <NavigationMenuTrigger>{group.title}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                  {group.children?.map((item) => (
                    <ListItem
                      key={item.translationKey}
                      title={
                        <div className="flex items-center">
                          {item.icon && <item.icon className="mr-2 size-4" />}
                          <span>{item.title}</span>
                        </div>
                      }
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                    >
                      {item.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

interface ListItemProps {
  title: React.ReactNode
  children: React.ReactNode
  href?: string
  className?: string
  target?: string
  rel?: string
}

function ListItem({
  className,
  title,
  children,
  href,
  ...props
}: ListItemProps) {
  return (
    <li className="row-span-3">
      <NavigationMenuLink asChild>
        <Link
          data-slot="navigation-link"
          className={cn(
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-hidden transition-colors",
            className
          )}
          href={href || ""}
          {...props}
        >
          <div data-slot="title" className="text-sm font-medium leading-none">
            {title}
          </div>
          <p
            data-slot="description"
            className="text-muted-foreground line-clamp-2 text-sm leading-snug"
          >
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
ListItem.displayName = "ListItem"
