import { Icons } from "@/components/shared/icons"
import { siteConfig } from "@/config/site"
import { Link } from "@/i18n/routing"

interface FooterColumn {
  title: string
  links: { title: string; href: string }[]
}

/** Pages without a Kumo version yet open in the current design. */
const COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { title: "Apps", href: "/apps" },
      { title: "Plans", href: "/kumo#plans" },
      { title: "VPS", href: "/apps?category=VPS" },
      { title: "OpenClaw", href: `/apps/${encodeURIComponent("OpenClaw")}` }
    ]
  },
  {
    title: "Resources",
    links: [
      { title: "Docs", href: "/docs" },
      { title: "Blog", href: "/blog" },
      { title: "Alternatives", href: "/alternativesto" }
    ]
  },
  {
    title: "Support",
    links: [
      { title: "Contact us", href: "https://billing.appbox.co/contact.php" },
      {
        title: "Knowledgebase",
        href: "https://billing.appbox.co/knowledgebase"
      },
      { title: "Service status", href: "https://status.appbox.co" }
    ]
  },
  {
    title: "Legal",
    links: [
      { title: "Terms of service", href: "/policies/terms-of-service" },
      { title: "Privacy", href: "/policies/global-privacy-practices" },
      { title: "All policies", href: "/policies" }
    ]
  }
]

export function SiteFooter() {
  return (
    <footer className="ks-cell ks-foot">
      <div>
        <Icons.sitename className="h-5 w-auto text-kumo-default" />
        <p className="mt-2.5 max-w-[26ch] text-kumo-subtle">
          Self-hosted apps on hardware we own.
        </p>
      </div>
      {COLUMNS.map((column) => (
        <div key={column.title}>
          <h2 className="mb-2.5 text-sm font-normal text-kumo-subtle">
            {column.title}
          </h2>
          <ul>
            {column.links.map((link) => (
              <li key={link.title}>
                <Link href={link.href}>{link.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="ks-foot-bar">
        <span>© {new Date().getFullYear()} Appbox</span>
        <a href={siteConfig.links.github.url} target="_blank" rel="noreferrer">
          {siteConfig.links.github.label}
        </a>
      </div>
    </footer>
  )
}
