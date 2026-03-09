export const ROUTES = {
  // Auth
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot",

  // Dashboard
  DASHBOARD: "/dashboard",

  // App Store
  APP_STORE: "/appstore",
  APP_STORE_SEARCH: "/appstore/search",
  APP_STORE_APP: (id: number | string) => `/appstore/app/${id}`,

  // Appbox Manager
  APPBOXES: "/appboxmanager/appboxes",
  APPBOX_DETAIL: (id: number | string) => `/appboxmanager/appboxes/${id}`,
  INSTALLED_APPS: "/appboxmanager/installedapps",
  INSTALLED_APP_DETAIL: (id: number | string) =>
    `/appboxmanager/installedapps/${id}`,
  DOMAINS: "/appboxmanager/domains",

  // Account
  PROFILE: "/account/profile",
  ABUSE_REPORTS: "/account/abuse",
  ABUSE_REPORT_DETAIL: (id: number | string) => `/account/abuse/${id}`,
  TWO_FACTOR_SETUP: "/account/2fa-setup",

  // Public (complainant) — no auth; access via ?token= from email
  ABUSE_COMPLAINANT: (id: number | string) => `/abusecomplainant/${id}`
} as const
