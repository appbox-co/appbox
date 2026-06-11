import { SiteFooter } from "@/components/marketing/site-footer"
import { SiteHeader } from "@/components/marketing/site-header"

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="overflow-x-clip">
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />

        <main className="flex-1">{children}</main>

        <SiteFooter />
      </div>

      <div className="pointer-events-none fixed left-0 top-0 size-full bg-linear-to-b from-[#a277ff] via-transparent to-transparent opacity-10" />
    </div>
  )
}
