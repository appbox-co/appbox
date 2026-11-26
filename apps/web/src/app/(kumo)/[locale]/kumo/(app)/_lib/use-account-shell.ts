"use client"

import { useAuth } from "@/providers/auth-provider"
import { useAccountApps } from "./use-account-apps"

/**
 * What every signed-in page gives `AppShell`: who is signed in, the quick
 * search entries and signing out, as `shell` to spread onto it. The account
 * data behind the search comes back too, for pages that show it.
 */
export function useAccountShell(
  options: Parameters<typeof useAccountApps>[0] = {}
) {
  const { user, logout } = useAuth()
  const account = useAccountApps(options)
  const userName = user.alias || user.firstname || user.email

  return {
    ...account,
    userName,
    shell: {
      user: { name: userName, email: user.email },
      search: account.searchGroups,
      onSignOut: () => void logout()
    }
  }
}
