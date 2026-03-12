import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth/session"

export async function requireAdminSession(locale: string) {
  const session = await getServerSession()

  if (!session) {
    redirect(`/${locale}/login`)
  }

  if (session.user.roles !== "admin") {
    redirect(`/${locale}/dashboard`)
  }

  return session
}
