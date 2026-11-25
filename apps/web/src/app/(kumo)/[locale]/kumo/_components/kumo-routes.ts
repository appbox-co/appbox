/** Paths of the pages already ported to Kumo, so links stay inside the prototype. */
export const kumoRoutes = {
  home: "/kumo/dashboard",
  appStore: "/kumo/appstore",
  appStoreApp: (id: number | string) => `/kumo/appstore/app/${id}`,
  installedApps: "/kumo/installedapps",
  installedApp: (id: number | string) => `/kumo/installedapps/${id}`,
  appboxes: "/kumo/appboxes",
  appbox: (id: number | string) => `/kumo/appboxes/${id}`,
  domains: "/kumo/domains",
  profile: "/kumo/account/profile",
  twoFactor: "/kumo/account/2fa-setup",
  apiKeys: "/kumo/account/api-keys",
  abuseReports: "/kumo/account/abuse",
  abuseReport: (id: number | string) => `/kumo/account/abuse/${id}`,
  signIn: "/kumo/login",
  forgotPassword: "/kumo/forgot",
  resetEmailSent: "/kumo/forgot/emailsent",
  resetPassword: (token: string) => `/kumo/forgot/verify/${token}`
}
