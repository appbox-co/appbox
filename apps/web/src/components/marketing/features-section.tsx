import { getTranslations } from "next-intl/server"
import { ClientFeaturesSection } from "@/components/marketing/client-features-section"

interface FeaturesSectionProps {
  headline1: string
  headline2: string
  description: string
  id?: string
}

export async function FeaturesSection({
  headline1,
  headline2,
  description,
  id
}: FeaturesSectionProps) {
  const t = await getTranslations("site.features")

  const features = {
    root_access: {
      title: t("root_access.title"),
      description: t("root_access.description")
    },
    remote_desktop: {
      title: t("remote_desktop.title"),
      description: t("remote_desktop.description")
    },
    one_click: {
      title: t("one_click.title"),
      description: t("one_click.description")
    },
    community: {
      title: t("community.title"),
      description: t("community.description")
    },
    security: {
      title: t("security.title"),
      description: t("security.description")
    },
    deploy_fast: {
      title: t("deploy_fast.title"),
      description: t("deploy_fast.description")
    },
    custom_hardware: {
      title: t("custom_hardware.title"),
      description: t("custom_hardware.description")
    },
    custom_network: {
      title: t("custom_network.title"),
      description: t("custom_network.description")
    },
    support: {
      title: t("support.title"),
      description: t("support.description")
    },
    documentation: {
      title: t("documentation.title"),
      description: t("documentation.description")
    }
  }

  return (
    <section id={id} className="scroll-mt-16 py-20 sm:py-28">
      <div>
        <div className="mx-auto max-w-[980px] text-center">
          <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {headline1}
            <br />
            <span className="bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {headline2}
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-16">
          <ClientFeaturesSection features={features} />
        </div>
      </div>
    </section>
  )
}
