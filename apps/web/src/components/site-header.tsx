import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeModeToggle } from "@/components/theme-mode-toggle"
import { Separator } from "@/components/ui/separator"
import { siteConfig } from "@/config/site"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { getTranslations } from "next-intl/server"
import dynamic from "next/dynamic"
import { I18nToggle } from "./i18n-toggle"
import { Button, buttonVariants } from "./ui/button"

const CommandMenu = dynamic(() =>
  import("@/components/command-menu").then((mod) => mod.CommandMenu)
)

export async function SiteHeader() {
  const t = await getTranslations("site")

  return (
    <header className={"sticky top-0 z-50 w-full"}>
      <div className="absolute inset-0 backdrop-blur"></div>
      <div className="container relative flex h-14 max-w-screen-2xl items-center">
        <MainNav />

        <MobileNav
          messages={{
            menu: t("words.menu"),
            toggleMenu: t("buttons.toggle_menu"),
          }}
        />

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="hidden w-full flex-1 xl:block xl:w-auto xl:flex-none">
            <CommandMenu
              messages={{
                docs: t("words.docs"),
                blog: t("words.blog"),
                search: t("search.search"),
                noResultsFound: t("search.no_results_found"),
                typeCommandOrSearch: t("search.type_command_or_search"),
                searchDocumentation: t("search.search_documentation"),

                themes: {
                  dark: t("themes.dark"),
                  theme: t("themes.theme"),
                  light: t("themes.light"),
                  system: t("themes.system"),
                },
              }}
            />
          </div>

          <div className="mr-2 hidden items-center gap-2 md:flex">
            <Link
              href="https://billing.appbox.co"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline">Billing</Button>
            </Link>
            <Link
              href="https://www.appbox.co/login"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="defaultsm">Control Panel</Button>
            </Link>
          </div>

          <nav className="flex items-center gap-2">
            {/* Only show language and theme toggles on lg screens and up */}
            <div className="hidden items-center gap-2 lg:flex">
              <I18nToggle
                messages={{
                  toggleLanguage: t("buttons.toggle_language"),
                }}
              />

              <ThemeModeToggle
                messages={{
                  dark: t("themes.dark"),
                  light: t("themes.light"),
                  system: t("themes.system"),
                }}
              />
            </div>

            {/* Only show GitHub link on lg screens and up */}
            <div className="hidden items-center lg:flex">
              <Separator orientation="vertical" className="mx-1 h-5" />
              <SiteHeaderMenuLinks />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export function SiteHeaderMenuLinks() {
  return (
    <>
      <Link href={siteConfig.links.github.url} target="_blank" rel="noreferrer">
        <div
          className={cn(
            buttonVariants({
              variant: "ghost",
            }),
            "w-9 px-0"
          )}
        >
          <Icons.gitHub className="size-4" />
          <span className="sr-only">GitHub</span>
        </div>
      </Link>
    </>
  )
}
