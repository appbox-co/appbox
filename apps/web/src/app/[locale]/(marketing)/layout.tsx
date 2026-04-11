import Script from "next/script"
import { SiteFooter } from "@/components/marketing/site-footer"
import { SiteHeader } from "@/components/marketing/site-header"

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="overflow-x-clip">
      <Script
        type="text/javascript"
        src="//embeds.iubenda.com/widgets/03e26262-624c-4f5b-8687-f85ec29afd9f.js"
        strategy="afterInteractive"
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />

        <main className="flex-1">{children}</main>

        <SiteFooter />
      </div>

      <div className="fixed left-0 top-0 size-full bg-linear-to-b from-[#a277ff] via-transparent to-transparent opacity-10" />
    </div>
  )
}
