"use client"

import { useMemo } from "react"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

interface ThemeModeToggleProps {
  messages: {
    dark: string
    light: string
    system: string
  }
}

export function ThemeModeToggle({ messages }: ThemeModeToggleProps) {
  const { theme, setTheme } = useTheme()

  const themes = useMemo(() => {
    return [
      { label: messages.dark, value: "dark" },
      { label: messages.light, value: "light" },
      { label: messages.system, value: "system" }
    ]
  }, [messages])

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="w-fit gap-1 px-2 py-4 flex">
            <SunIcon className="size-[1.2rem] rotate-0 scale-100 transition-all dark:hidden dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="hidden size-[1.2rem] rotate-90 scale-0 transition-all dark:flex dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </NavigationMenuTrigger>
          <NavigationMenuContent className="flex flex-col items-center p-2">
            <div className="w-full">
              {themes.map(({ label, value }) => (
                <Button
                  key={value}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    theme === value && "font-bold"
                  )}
                  disabled={theme === value}
                  onClick={() => setTheme(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
