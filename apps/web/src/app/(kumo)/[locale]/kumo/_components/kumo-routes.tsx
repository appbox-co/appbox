"use client"

import { createContext, useContext, type ReactNode } from "react"

export interface KumoRoutes {
  home: string
  appStore: string
  appStoreApp: (id: number | string) => string
  installedApps: string
  installedApp: (id: number | string) => string
  appboxes: string
  appbox: (id: number | string) => string
  domains: string
  profile: string
  twoFactor: string
  apiKeys: string
  abuseReports: string
  abuseReport: (id: number | string) => string
  signIn: string
  forgotPassword: string
  resetEmailSent: string
  resetPassword: (token: string) => string
}

const LIVE_ROUTES: KumoRoutes = {
  home: "/kumo/dashboard",
  appStore: "/kumo/appstore",
  appStoreApp: (id) => `/kumo/appstore/app/${id}`,
  installedApps: "/kumo/installedapps",
  installedApp: (id) => `/kumo/installedapps/${id}`,
  appboxes: "/kumo/appboxes",
  appbox: (id) => `/kumo/appboxes/${id}`,
  domains: "/kumo/domains",
  profile: "/kumo/account/profile",
  twoFactor: "/kumo/account/2fa-setup",
  apiKeys: "/kumo/account/api-keys",
  abuseReports: "/kumo/account/abuse",
  abuseReport: (id) => `/kumo/account/abuse/${id}`,
  signIn: "/kumo/login",
  forgotPassword: "/kumo/forgot",
  resetEmailSent: "/kumo/forgot/emailsent",
  resetPassword: (token) => `/kumo/forgot/verify/${token}`
}

/** Sample-data twins of the prototype pages; they need no session. */
const DEMO_ROUTES: KumoRoutes = {
  home: "/kumo/demo",
  appStore: "/kumo/demo/appstore",
  appStoreApp: (id) => `/kumo/demo/appstore/app/${id}`,
  installedApps: "/kumo/demo/installedapps",
  installedApp: (id) => `/kumo/demo/installedapps/${id}`,
  appboxes: "/kumo/demo/appboxes",
  appbox: (id) => `/kumo/demo/appboxes/${id}`,
  domains: "/kumo/demo/domains",
  profile: "/kumo/demo/account/profile",
  twoFactor: "/kumo/demo/account/2fa-setup",
  apiKeys: "/kumo/demo/account/api-keys",
  abuseReports: "/kumo/demo/account/abuse",
  abuseReport: (id) => `/kumo/demo/account/abuse/${id}`,
  signIn: "/kumo/demo/login",
  forgotPassword: "/kumo/demo/forgot",
  resetEmailSent: "/kumo/demo/forgot/emailsent",
  resetPassword: (token) => `/kumo/demo/forgot/verify/${token}`
}

export function kumoRoutes(demo: boolean) {
  return demo ? DEMO_ROUTES : LIVE_ROUTES
}

const KumoRoutesContext = createContext<KumoRoutes>(LIVE_ROUTES)

/** Paths of the pages already ported to Kumo, so links stay inside the prototype. */
export function useKumoRoutes() {
  return useContext(KumoRoutesContext)
}

export function KumoRoutesProvider({
  demo,
  children
}: {
  demo: boolean
  children: ReactNode
}) {
  return (
    <KumoRoutesContext.Provider value={kumoRoutes(demo)}>
      {children}
    </KumoRoutesContext.Provider>
  )
}
