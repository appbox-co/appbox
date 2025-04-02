'use client'

import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import React from 'react'
import { siteConfig } from '@/config/site'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

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
export function MainNav({
  messages,
}: {
  messages: { docs: string; blog: string }
}) {
  const pathname = usePathname()
  const router = useRouter()

  // Wrap this in a try/catch to handle cases where the translation is not available
  let t: any
  try {
    t = useTranslations('site.navigation')
  } catch (error) {
    // Fallback translations if the hook fails
    t = (key: string) => {
      const fallbacks: Record<string, string> = {
        product: 'Product',
        resources: 'Resources',
        pricing: 'Pricing',
        features: 'Features',
        apps: 'Apps',
        documentation: 'Documentation',
        blog: 'Blog',
        faq: 'FAQ',
        service_status: 'Service Status',
        overview: 'Overview of features',
        explore_apps: 'Explore our apps',
        read_docs: 'Read the docs',
        latest_articles: 'Latest articles and news',
        faq_description: 'Frequently asked questions',
        check_status: 'Check our service status',
      }
      return fallbacks[key] || key
    }
  }

  // Define the components array inside the component to access translations
  const components: MenuItem[] = [
    {
      title: t('product'),
      translationKey: 'product',
      children: [
        {
          title: t('features'),
          translationKey: 'features',
          href: '/#features',
          icon: Icons.features,
          description: t('overview'),
          descriptionKey: 'overview',
        },
        {
          title: t('apps'),
          translationKey: 'apps',
          href: '/apps',
          icon: Icons.apps,
          description: t('explore_apps'),
          descriptionKey: 'explore_apps',
        },
      ],
    },
    {
      title: t('resources'),
      translationKey: 'resources',
      children: [
        {
          title: t('documentation'),
          translationKey: 'documentation',
          href: 'https://billing.appbox.co/knowledgebase',
          icon: Icons.documentation,
          description: t('read_docs'),
          descriptionKey: 'read_docs',
          external: true,
        },
        {
          title: t('blog'),
          translationKey: 'blog',
          href: '/blog',
          icon: Icons.blog,
          description: t('latest_articles'),
          descriptionKey: 'latest_articles',
        },
        {
          title: t('faq'),
          translationKey: 'faq',
          href: '/#faq',
          icon: Icons.faq,
          description: t('faq_description'),
          descriptionKey: 'faq_description',
        },
        {
          title: t('service_status'),
          translationKey: 'service_status',
          href: 'https://status.appbox.co',
          icon: Icons.serviceStatus,
          description: t('check_status'),
          descriptionKey: 'check_status',
          external: true,
        },
      ],
    },
  ]

  // Handle pricing button click
  const handlePricingClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    // If on homepage, scroll to plans section
    if (pathname === '/') {
      const plansSection = document.getElementById('plans-section')
      if (plansSection) {
        // Scroll with offset to account for sticky header
        const headerHeight = 60
        const sectionTop =
          plansSection.getBoundingClientRect().top + window.pageYOffset
        window.scrollTo({
          top: sectionTop - headerHeight,
          behavior: 'smooth',
        })
      }
    } else {
      // If on another page, navigate to homepage with hash
      router.push('/#plans-section')
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
              {t('pricing')}
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
                          {item.icon && <item.icon className="w-4 h-4 mr-2" />}
                          <span>{item.title}</span>
                        </div>
                      }
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
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
  extends Omit<React.ComponentPropsWithoutRef<'a'>, 'title'> {
  title: React.ReactNode
  children: React.ReactNode
}

const ListItem = React.forwardRef<React.ElementRef<'a'>, ListItemProps>(
  ({ className, title, children, ...props }, ref) => {
    // Check if this is an external link from props
    const isExternal = 'target' in props && props.target === '_blank'

    return (
      <li className="row-span-3">
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  }
)
ListItem.displayName = 'ListItem'
