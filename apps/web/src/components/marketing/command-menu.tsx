"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { useLocale } from "next-intl"
import { useTheme } from "next-themes"
import type { AlertDialogProps } from "@radix-ui/react-alert-dialog"
import {
  CircleIcon,
  FileIcon,
  FileTextIcon,
  LaptopIcon,
  MoonIcon,
  SunIcon
} from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/routing"
import type { Blog } from "@/lib/content"
import { useBlogConfig } from "@/lib/opendocs/hooks/use-blog-config"
import type { DocsConfig } from "@/lib/opendocs/types/docs"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"
import type { NavItemWithChildren } from "@/lib/opendocs/types/nav"
import { getObjectValueByLocale } from "@/lib/opendocs/utils/locale"
import { cn } from "@/lib/utils"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "../ui/command"

export type BlogSearchItem = Pick<
  Blog,
  "_id" | "title" | "excerpt" | "tags" | "slugAsParams"
>

function DocsCommandMenu({
  docs,
  locale,
  runCommand,
  messages
}: {
  docs: DocsConfig
  locale: LocaleOptions
  runCommand: (command: () => unknown) => void
  messages: {
    docs: string
  }
}) {
  const router = useRouter()

  function renderItems(items: NavItemWithChildren[]) {
    return items.map((navItem) => {
      if (!navItem.href) {
        return (
          <Fragment key={getObjectValueByLocale(navItem.title, locale)}>
            <CommandGroup
              heading={getObjectValueByLocale(navItem.title, locale)}
            >
              {renderItems(navItem.items)}
            </CommandGroup>
          </Fragment>
        )
      }

      return (
        <Fragment key={navItem.href}>
          <CommandItem
            value={getObjectValueByLocale(navItem.title, locale)}
            onSelect={() => {
              runCommand(() => router.push(navItem.href as string))
            }}
          >
            <div className="mr-2 flex size-4 items-center justify-center">
              <CircleIcon className="size-3" />
            </div>

            {getObjectValueByLocale(navItem.title, locale)}
          </CommandItem>

          {navItem?.items?.length > 0 && (
            <CommandGroup>{renderItems(navItem.items)}</CommandGroup>
          )}
        </Fragment>
      )
    })
  }

  return (
    <CommandGroup heading={messages.docs}>
      {docs.sidebarNav.map((group) => (
        <CommandGroup
          key={getObjectValueByLocale(group.title, locale)}
          heading={getObjectValueByLocale(group.title, locale)}
        >
          {renderItems(group.items)}
        </CommandGroup>
      ))}
    </CommandGroup>
  )
}

function BlogCommandMenu({
  posts,
  runCommand,
  messages
}: {
  posts: BlogSearchItem[]
  runCommand: (command: () => unknown) => void
  messages: {
    blog: string
  }
}) {
  const router = useRouter()

  return (
    <CommandGroup heading={messages.blog}>
      {posts.map((post) => (
        <CommandItem
          key={post._id}
          value={`${post.title} ${post.excerpt} ${post.tags.join(" ")}`}
          onSelect={() => {
            const [, ...slugs] = post.slugAsParams.split("/")
            const slug = slugs.join("/")

            runCommand(() => router.push(`/blog/${slug}`))
          }}
        >
          <div className="mx-1 flex size-4 items-center justify-center">
            <FileTextIcon className="size-4" />
          </div>

          <div className="flex w-full flex-col gap-1 p-2">
            <h1 className="text-lg">{post.title}</h1>
            <p className="truncate">{post.excerpt}</p>
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

interface CommandMenuProps extends AlertDialogProps {
  docs: DocsConfig
  /** Blog posts in the current locale */
  blogPosts: BlogSearchItem[]
  messages: {
    docs: string
    blog: string
    search: string
    noResultsFound: string
    searchDocumentation: string
    typeCommandOrSearch: string

    themes: {
      theme: string
      dark: string
      light: string
      system: string
    }
  }
}

export function CommandMenu({
  docs,
  blogPosts,
  messages,
  ...props
}: CommandMenuProps) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const locale = useLocale() as LocaleOptions
  const blogConfig = useBlogConfig()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)

    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  const mainNavs = useMemo(
    () => [...docs.mainNav, ...blogConfig.blog.mainNav],
    [docs, blogConfig]
  )

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "bg-card-primary text-muted-foreground relative h-8 w-full justify-start rounded-lg text-sm font-normal shadow-none sm:pr-12 md:w-40 lg:w-64"
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className="hidden lg:inline-flex">
          {messages.searchDocumentation}...
        </span>

        <span className="inline-flex lg:hidden">{messages.search}...</span>

        <kbd className="bg-muted pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={`${messages.typeCommandOrSearch}...`} />

        <CommandList>
          <CommandEmpty>{messages.noResultsFound}.</CommandEmpty>

          <CommandGroup heading="Links">
            {mainNavs
              .filter((navitem) => !navitem.external)
              .map((navItem) => (
                <CommandItem
                  key={navItem.href}
                  value={getObjectValueByLocale(navItem.title, locale)}
                  onSelect={() =>
                    runCommand(() => router.push(navItem.href as string))
                  }
                >
                  <FileIcon className="mr-2 size-4" />

                  {getObjectValueByLocale(navItem.title, locale)}
                </CommandItem>
              ))}
          </CommandGroup>

          <DocsCommandMenu
            docs={docs}
            locale={locale}
            runCommand={runCommand}
            messages={{
              docs: messages.docs
            }}
          />

          <CommandSeparator className="my-1" />

          <BlogCommandMenu
            posts={blogPosts}
            runCommand={runCommand}
            messages={{
              blog: messages.blog
            }}
          />

          <CommandSeparator className="my-1" />

          <CommandGroup heading={messages.themes.theme}>
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <SunIcon className="mr-2 size-4" />
              {messages.themes.light}
            </CommandItem>

            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <MoonIcon className="mr-2 size-4" />
              {messages.themes.dark}
            </CommandItem>

            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <LaptopIcon className="mr-2 size-4" />
              {messages.themes.system}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
