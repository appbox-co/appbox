"use client"

import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import React from "react"

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

  // Wrap this in a try/catch to handle cases where the translation is not available
  // let t: any
  // try {
  //   t = useTranslations("site.navigation")
  // } catch (error) {
  //   // Fallback translations if the hook fails
  //   t = (key: string) => {
  //     const fallbacks: Record<string, string> = {
  //       product: "Product",
  //       resources: "Resources",
  //       pricing: "Pricing",
  //       features: "Features",
  //       apps: "Apps",
  //       documentation: "Documentation",
  //       blog: "Blog",
  //       faq: "FAQ",
  //       service_status: "Service Status",
  //       overview: "Overview of features",
  //       explore_apps: "Explore our apps",
  //       read_docs: "Read the docs",
  //       latest_articles: "Latest articles and news",
  //       faq_description: "Frequently asked questions",
  //       check_status: "Check our service status",
  //     }
  //     return fallbacks[key] || key
  //   }
  // }

  // Define the components array inside the component to access translations
  const components: MenuItem[] = [
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
          descriptionKey: "overview",
        },
        {
          title: t("apps"),
          translationKey: "apps",
          href: "/apps",
          icon: Icons.apps,
          description: t("explore_apps"),
          descriptionKey: "explore_apps",
        },
      ],
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
          external: true,
        },
        {
          title: t("blog"),
          translationKey: "blog",
          href: "/blog",
          icon: Icons.blog,
          description: t("latest_articles"),
          descriptionKey: "latest_articles",
        },
        {
          title: t("faq"),
          translationKey: "faq",
          href: "/#faq",
          icon: Icons.faq,
          description: t("faq_description"),
          descriptionKey: "faq_description",
        },
        {
          title: t("service_status"),
          translationKey: "service_status",
          href: "https://status.appbox.co",
          icon: Icons.serviceStatus,
          description: t("check_status"),
          descriptionKey: "check_status",
          external: true,
        },
      ],
    },
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
          behavior: "smooth",
        })
      }
    } else {
      // If on another page, navigate to homepage with hash
      router.push("/#plans-section")
    }
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

interface ListItemProps
  extends Omit<React.ComponentPropsWithoutRef<"a">, "title"> {
  title: React.ReactNode
  children: React.ReactNode
}

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li className="row-span-3">
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
              {children}
            </p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  }
)
ListItem.displayName = "ListItem"
