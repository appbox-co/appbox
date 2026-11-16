"use client"

import { useQueryClient } from "@tanstack/react-query"
import {
  createApiKey,
  getApiKeyScopes,
  revokeApiKey,
  updateApiKey
} from "@/api/account/account"
import { useApiKeys } from "@/api/account/hooks/use-account"
import { getDefaultScopes } from "@/app/[locale]/(dashboard)/account/api-keys/_components/api-key-scopes"
import { queryKeys } from "@/constants/query-keys"
import { ROUTES } from "@/constants/routes"
import { useAuth } from "@/providers/auth-provider"
import { postReauth } from "../../_lib/reauth"
import { toLoadable, useAccountApps } from "../../_lib/use-account-apps"
import { ApiKeysView } from "../../../_components/account/api-keys-view"
import { isRecentAuthError } from "../../../_components/account/recent-auth"
import { AppShell } from "../../../_components/app-shell"

const TITLE = "API keys"

/** Kumo prototype of the API keys page, on live account data. */
export default function KumoApiKeysPage() {
  const { user, logout } = useAuth()
  const { searchGroups } = useAccountApps()
  const queryClient = useQueryClient()
  const apiKeys = useApiKeys()

  // Every write is followed by a fresh list, as on the current page. The view
  // is not kept waiting for it.
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all })
  }

  const userName = user.alias || user.firstname || user.email

  return (
    <AppShell
      width="wide"
      title={TITLE}
      currentDesignHref={ROUTES.API_KEYS}
      user={{ name: userName, email: user.email }}
      search={searchGroups}
      onSignOut={() => void logout()}
    >
      <ApiKeysView
        keys={toLoadable(apiKeys, (data) => data ?? [])}
        recentAuthRequired={isRecentAuthError(apiKeys.error)}
        onCreate={async (input) => {
          // The current design's default scope set (its "read only" preset).
          const scopes = input.scopes.length
            ? input.scopes
            : getDefaultScopes((await getApiKeyScopes()).presets)
          const result = await createApiKey({ ...input, scopes })
          refresh()
          return result
        }}
        onRename={async (id, name) => {
          await updateApiKey(id, { name })
          refresh()
        }}
        onRevoke={async (id) => {
          await revokeApiKey(id)
          refresh()
        }}
        onRefresh={refresh}
        reauth={postReauth}
      />
    </AppShell>
  )
}
