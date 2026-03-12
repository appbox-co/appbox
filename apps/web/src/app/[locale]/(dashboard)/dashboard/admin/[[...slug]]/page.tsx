import { notFound } from "next/navigation"
import { ADMIN_MODULE_AVAILABLE, loadAdminModule } from "@/lib/admin/bridge"
import { requireAdminSession } from "@/lib/auth/require-admin"

interface AdminPageProps {
  params: Promise<{ locale: string; slug?: string[] }>
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params
  await requireAdminSession(locale)

  if (!ADMIN_MODULE_AVAILABLE) {
    notFound()
  }

  const { Shell } = await loadAdminModule()
  if (!Shell) {
    notFound()
  }

  return <Shell />
}
