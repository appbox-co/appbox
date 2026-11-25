"use client"

import { useQueryClient } from "@tanstack/react-query"
import { createApiKey, revokeApiKey, updateApiKey } from "@/api/account/account"
import { useApiKeys, useApiKeyScopes } from "@/api/account/hooks/use-account"
import { isRecentAuthError, postReauth } from "@/api/account/reauth"
import { queryKeys } from "@/constants/query-keys"
import { ROUTES } from "@/constants/routes"
import { useAuth } from "@/providers/auth-provider"
import { toLoadable, useAccountApps } from "../../_lib/use-account-apps"
import { ApiKeysView } from "../../../_components/account/api-keys-view"
import { AppShell } from "../../../_components/app-shell"

const TITLE = "API keys"

/** Kumo prototype of the API keys page, on live account data. */
export default function KumoApiKeysPage() {
  const { user, logout } = useAuth()
  const { searchGroups } = useAccountApps()
  const queryClient = useQueryClient()
  const apiKeys = useApiKeys()
  const scopes = useApiKeyScopes()

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
          const result = await createApiKey(input)
          refresh()
          return result
        }}
        onUpdate={async (id, input) => {
          await updateApiKey(id, input)
          refresh()
        }}
        onRevoke={async (id) => {
          await revokeApiKey(id)
          refresh()
        }}
        onRefresh={refresh}
        reauth={postReauth}
        scopeCatalog={
          scopes.data
            ? { status: "ready", data: scopes.data }
            : scopes.error
              ? { status: "error" }
              : { status: "loading" }
        }
        onRetryScopes={() => void scopes.refetch()}
      />
    </AppShell>
  )
}
