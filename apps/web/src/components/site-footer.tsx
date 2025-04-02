import { Icons } from "@/components/icons"
import { Footer2 } from "@/components/ui/shadcnblocks-com-footer2"
import { siteConfig } from "@/config/site"

// import { getTranslations } from "next-intl/server"

const demoData = {
  logo: {
    src: Icons.emblem,
    alt: "App hosting made easy",
    title: "appbox.co",
    url: "https://www.appbox.co",
  },
  tagline: "App hosting made easy.",
  menuItems: [
    {
      title: "Product",
      links: [
        { text: "Home", url: "/" },
        { text: "Features", url: "/#features" },
        { text: "Apps", url: "/apps" },
        { text: "Pricing", url: "/#plans-section" },
      ],
    },
    {
      title: "Legal",
      links: [
        { text: "Terms of Service", url: "/policies/terms-of-service" },
        {
          text: "Service Level Agreement",
          url: "/policies/service-level-agreement",
        },
        {
          text: "Privacy & Data Handling",
          url: "/policies/data-handling-policy",
        },
        {
          text: "Global Privacy Practices",
          url: "/policies/global-privacy-practices",
        },
        {
          text: "Incident Response & Security",
          url: "/policies/incident-response-and-security-policy",
        },
        { text: "View All Policies", url: "/policies" },
      ],
    },
    {
      title: "Resources",
      links: [
        { text: "Billing", url: "https://billing.appbox.co", external: true },
        {
          text: "Control Panel",
          url: "https://www.appbox.co/login",
          external: true,
        },
        { text: "Documentation (new)", url: "/docs" },
        {
          text: "Documentation (old)",
          url: "https://billing.appbox.co/knowledgebase",
          external: true,
        },
        { text: "Blog", url: "/blog" },
        { text: "FAQ", url: "/#faq" },
        {
          text: "Service Status",
          url: "https://status.appbox.co",
          external: true,
        },
      ],
    },
    {
      title: "Social",
      links: [
        { text: "GitHub", url: siteConfig.links.github.url, external: true },
      ],
    },
  ],
  copyright: `© ${new Date().getFullYear()} Copyright. All rights reserved.`,
  bottomLinks: [],
}

function SiteFooter() {
  return <Footer2 {...demoData} />
}

export { SiteFooter }
