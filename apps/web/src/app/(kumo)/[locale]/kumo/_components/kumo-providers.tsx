"use client"

import { forwardRef, type AnchorHTMLAttributes } from "react"
import { useTheme } from "next-themes"
import { LinkProvider, TooltipProvider } from "@cloudflare/kumo"
import { Toaster } from "sonner"
import { Link } from "@/i18n/routing"

type AppLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }

const EXTERNAL_HREF = /^([a-z][a-z0-9+.-]*:|\/\/|#)/i

/** Routes Kumo links through the locale-aware Next.js link. */
const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink(
  { href, to, ...rest },
  ref
) {
  const target = href ?? to ?? "#"
  if (EXTERNAL_HREF.test(target)) {
    return <a ref={ref} href={target} {...rest} />
  }
  return <Link ref={ref} href={target} {...rest} />
})

/**
 * The shared data hooks report failures and confirmations through sonner
 * toasts, so the prototype needs a place to show them, drawn with Kumo tokens.
 */
function Toasts() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg! border-0! bg-kumo-base! font-sans! text-base! text-kumo-default! shadow-lg! ring! ring-kumo-line!",
          description: "text-kumo-subtle!"
        }
      }}
    />
  )
}

export function KumoProviders({ children }: { children: React.ReactNode }) {
  return (
    <LinkProvider component={AppLink}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toasts />
    </LinkProvider>
  )
}
