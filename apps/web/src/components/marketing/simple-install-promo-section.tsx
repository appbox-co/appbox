import { getTranslations } from "next-intl/server"
import { getAppDetails } from "@/api/appbox/app-details"
import type { getPlans } from "@/api/appbox/plans"
import { InstallPreview } from "@/components/marketing/app-blocks/install-preview"
import { getEligiblePlanOptions } from "@/lib/appbox/eligible-plans"

const installPreviewPlaceholders = {
  username: "steve",
  password: "SecurePass123!"
}

interface SimpleInstallPromoSectionProps {
  plansData: Awaited<ReturnType<typeof getPlans>>
}

export async function SimpleInstallPromoSection({
  plansData
}: SimpleInstallPromoSectionProps) {
  const t = await getTranslations("site.simple_install_promo")
  const appDetails = await getAppDetails("Nextcloud").catch(() => null)

  if (!appDetails) return null

  const defaultVersion =
    appDetails.versions?.find((v) => v.version === appDetails.version) ??
    appDetails.versions?.[0]
  const eligiblePlans = getEligiblePlanOptions(
    plansData,
    appDetails.display_name,
    appDetails.categories
  )

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[980px] text-center">
        <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t("headline_1")}
          <br />
          <span className="bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            {t("headline_2")}
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-6xl">
        <InstallPreview
          appName={appDetails.display_name}
          appId={appDetails.id}
          placeholders={installPreviewPlaceholders}
          customFields={appDetails.customFields ?? undefined}
          appSlots={appDetails.app_slots}
          requiresDomain={appDetails.RequiresDomain === 1}
          domainPlaceholders={{
            subdomain: appDetails.subdomain,
            appboxDomain: "steve.appboxes.co",
            customDomain: "cloud.example.com"
          }}
          preinstallDescription={appDetails.custom_field_preinstall_description}
          baseMemory={defaultVersion?.memory ?? 0}
          baseCpus={defaultVersion?.cpus ?? 0}
          eligiblePlans={eligiblePlans}
          showHeader={false}
          showFooterNote={false}
          showAnnotations
          className="py-0"
        />
      </div>
    </section>
  )
}
