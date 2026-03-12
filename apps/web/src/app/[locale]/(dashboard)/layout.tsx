import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { RouteHistoryTracker } from "@/components/dashboard/navigation/route-history-tracker"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { UiUpdateRefreshDialog } from "@/components/dashboard/ui-update-refresh-dialog"
import { WsEventBridge } from "@/components/dashboard/ws-event-bridge"
import { Toaster } from "@/components/ui/sonner"
import { getServerSession } from "@/lib/auth/session"
import { AdminModeProvider } from "@/providers/admin-mode-provider"
import { AuthProvider } from "@/providers/auth-provider"
import { TanstackQueryProvider } from "@/providers/query-provider"
import { WebSocketProvider } from "@/providers/websocket-provider"

interface DashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function DashboardLayout({
  children,
  params
}: DashboardLayoutProps) {
  const { locale } = await params
  const session = await getServerSession()

  if (!session) {
    redirect(`/${locale}/login`)
  }

  return (
    <TanstackQueryProvider>
      <AuthProvider user={session.user} cylos={session.cylos}>
        <AdminModeProvider>
          <WebSocketProvider>
            <WsEventBridge />
            <UiUpdateRefreshDialog />
            <RouteHistoryTracker />
            <div className="relative min-h-screen bg-background">
              <DashboardSidebar />
              <DashboardHeader />
              <main className="transition-all duration-300 lg:ml-[250px] pt-[75px]">
                <div className="p-6">{children}</div>
              </main>
              <Toaster />
            </div>
          </WebSocketProvider>
        </AdminModeProvider>
      </AuthProvider>
    </TanstackQueryProvider>
  )
}
