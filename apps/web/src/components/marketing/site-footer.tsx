import { Icons } from "@/components/shared/icons"
import { Footer2 } from "@/components/ui/shadcnblocks-com-footer2"
import { siteConfig } from "@/config/site"
import { getTranslations } from "next-intl/server"

async function SiteFooter() {
  const t = await getTranslations("site")

  const footerData = {
    logo: {
      src: Icons.emblem,
      alt: t("tagline"),
      title: "appbox.co",
      url: "https://www.appbox.co"
    },
    tagline: t("tagline"),
    menuItems: [
      {
        title: t("navigation.product"),
        links: [
          { text: t("words.home"), url: "/" },
          { text: t("navigation.features"), url: "/#features" },
          { text: t("navigation.apps"), url: "/apps" },
          { text: t("navigation.pricing"), url: "/#plans-section" }
        ]
      },
      {
        title: t("words.legal"),
        links: [
          {
            text: t("words.terms_of_service"),
            url: "/policies/terms-of-service"
          },
          {
            text: t("words.service_level_agreement"),
            url: "/policies/service-level-agreement"
          },
          {
            text: t("words.privacy_data_handling"),
            url: "/policies/data-handling-policy"
          },
          {
            text: t("words.global_privacy_practices"),
            url: "/policies/global-privacy-practices"
          },
          {
            text: t("words.incident_response_security"),
            url: "/policies/incident-response-and-security-policy"
          },
          { text: t("words.view_all_policies"), url: "/policies" }
        ]
      },
      {
        title: t("navigation.resources"),
        links: [
          {
            text: t("external_links.billing"),
            url: "https://billing.appbox.co",
            external: true
          },
          { text: t("external_links.control_panel"), url: "/dashboard" },
          { text: t("words.documentation_new"), url: "/docs" },
          {
            text: t("words.documentation_old"),
            url: "https://billing.appbox.co/knowledgebase",
            external: true
          },
          { text: t("navigation.blog"), url: "/blog" },
          { text: t("navigation.faq"), url: "/#faq" },
          {
            text: t("navigation.service_status"),
            url: "https://status.appbox.co",
            external: true
          }
        ]
      },
      {
        title: t("words.social"),
        links: [
          { text: "GitHub", url: siteConfig.links.github.url, external: true }
        ]
      }
    ],
    copyright: t("footer.copyright", { year: new Date().getFullYear() }),
    bottomLinks: []
  }

  return <Footer2 {...footerData} />
}

export { SiteFooter }
