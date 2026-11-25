import { redirect } from "next/navigation"
import { WsEventBridge } from "@/components/shared/ws-event-bridge"
import { getServerSession } from "@/lib/auth/session"
import { AuthProvider } from "@/providers/auth-provider"
import { TanstackQueryProvider } from "@/providers/query-provider"
import { WebSocketProvider } from "@/providers/websocket-provider"
import { kumoRoutes } from "../_components/kumo-routes"

interface KumoAppLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

/** Authenticated prototype pages: same session and data providers as the dashboard. */
export default async function KumoAppLayout({
  children,
  params
}: KumoAppLayoutProps) {
  const { locale } = await params
  const session = await getServerSession()

  if (!session) {
    redirect(`/${locale}${kumoRoutes.signIn}`)
  }

  return (
    <TanstackQueryProvider>
      <AuthProvider
        user={session.user}
        cylos={session.cylos}
        signInPath={kumoRoutes.signIn}
      >
        <WebSocketProvider>
          <WsEventBridge />
          {children}
        </WebSocketProvider>
      </AuthProvider>
    </TanstackQueryProvider>
  )
}
