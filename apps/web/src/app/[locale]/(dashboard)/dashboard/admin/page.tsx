import { notFound } from "next/navigation"
import {
  ADMIN_MODULE_AVAILABLE,
  loadAdminDashboardModule
} from "@/lib/admin/bridge"
import { requireAdminSession } from "@/lib/auth/require-admin"

interface AdminPageProps {
  params: Promise<{ locale: string }>
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params
  await requireAdminSession(locale)

  if (!ADMIN_MODULE_AVAILABLE) {
    notFound()
  }

  const AdminDashboardModule = await loadAdminDashboardModule()
  if (!AdminDashboardModule) {
    notFound()
  }

  return <AdminDashboardModule />
}
