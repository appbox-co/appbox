// Who can open the Kumo pages under /kumo: the new dashboard, its sign-in
// pages and its home page.
//
// "admins": only accounts signed in as admin or superadmin, so the new design
// can run in production before launch. Everyone else gets a 404.
// "everyone": open to all, as at launch.
export type KumoAccess = "admins" | "everyone"

export const kumoAccess: KumoAccess = "admins"
