import { getTranslations } from "next-intl/server"
import { ClientFeaturesSection } from "@/components/client-features-section"

interface FeaturesSectionProps {
  title: string
  description: string
  id?: string
}

export async function FeaturesSection({
  title,
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
    <section id={id} className="scroll-mt-16 py-12">
      <div className="container">
        <div className="mx-auto mb-10 max-w-[58rem] text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-4xl">
            {title}
          </h2>
          <p className="text-muted-foreground mt-3 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            {description}
          </p>
        </div>

        <ClientFeaturesSection features={features} />
      </div>
    </section>
  )
}
