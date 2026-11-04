import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { OAuthConsent } from "./_components/oauth-consent"

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "oauth.consent" })
  return { title: t("metaTitle") }
}

// Client-rendered: the consent request and session are checked in the browser
// with a same-site request (see ../layout.tsx).
export default function OAuthConsentPage() {
  return (
    <Suspense>
      <OAuthConsent />
    </Suspense>
  )
}
