"use client"

import { useQueryClient } from "@tanstack/react-query"
import { createApiKey, revokeApiKey, updateApiKey } from "@/api/account/account"
import { useApiKeys, useApiKeyScopes } from "@/api/account/hooks/use-account"
import { isRecentAuthError } from "@/api/account/reauth"
import { queryKeys } from "@/constants/query-keys"
import { ROUTES } from "@/constants/routes"
import { toLoadable } from "../../_lib/use-account-apps"
import { useAccountShell } from "../../_lib/use-account-shell"
import { ApiKeysView } from "../../../_components/account/api-keys-view"
import { AppShell } from "../../../_components/app-shell"

const TITLE = "API keys"

/** Kumo prototype of the API keys page, on live account data. */
export default function KumoApiKeysPage() {
  const { shell } = useAccountShell()
  const queryClient = useQueryClient()
  const apiKeys = useApiKeys()
  const scopes = useApiKeyScopes()

  // Every write is followed by a fresh list, as on the current page. The view
  // is not kept waiting for it.
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all })
  }

  return (
    <AppShell
      width="wide"
      title={TITLE}
      currentDesignHref={ROUTES.API_KEYS}
      {...shell}
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
