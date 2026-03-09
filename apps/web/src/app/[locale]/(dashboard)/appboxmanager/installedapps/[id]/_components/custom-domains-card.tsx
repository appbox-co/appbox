"use client"

import { useCallback, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import type { ColumnDef } from "@tanstack/react-table"
import { Check, Copy, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  checkSubdomainDns,
  validateSubdomain,
  type DomainOption
} from "@/api/apps/app-store"
import {
  useAddInstanceDomain,
  useDeleteInstanceDomain,
  useInstanceDomainConfig,
  useInstanceDomains,
  type InstanceDomain,
  type InstanceDomainConfigResponse
} from "@/api/domains/hooks/use-domains"
import { BaseDomainSelector } from "@/components/dashboard/base-domain-selector"
import {
  DataTableColumnHeader,
  DateCell
} from "@/components/dashboard/data-table"
import { DataTable } from "@/components/dashboard/data-table/data-table"
import { DnsVerificationPanel } from "@/components/dashboard/domain/dns-verification-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/providers/auth-provider"

const DOMAIN_SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
const PLATFORM_SUFFIXES = ["appboxes.co", "cylo.net", "appbox.co"]

function isCustomDomain(domain: string): boolean {
  const lower = domain.toLowerCase()
  return !PLATFORM_SUFFIXES.some(
    (suffix) => lower === suffix || lower.endsWith(`.${suffix}`)
  )
}

function SnippetBlock({
  title,
  fileLabel,
  configLabel,
  commandLabel,
  copyLabel,
  copiedLabel,
  copiedItem,
  onCopy,
  file,
  config,
  command
}: {
  title: string
  fileLabel: string
  configLabel: string
  commandLabel: string
  copyLabel: string
  copiedLabel: string
  copiedItem: string | null
  onCopy: (value: string, key: string) => void
  file?: string
  config?: string
  command?: string
}) {
  if (!config) return null

  return (
    <div className="min-w-0 space-y-2 rounded-md border p-3">
      <h4 className="text-sm font-semibold">{title}</h4>
      {file && (
        <p className="text-xs text-muted-foreground">
          {fileLabel}: <code>{file}</code>
        </p>
      )}

      <div className="space-y-1">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {configLabel}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => onCopy(config, `${title}-config`)}
          >
            {copiedItem === `${title}-config` ? (
              <>
                <Check className="mr-1 size-3.5 text-emerald-500" />
                {copiedLabel}
              </>
            ) : (
              <>
                <Copy className="mr-1 size-3.5" />
                {copyLabel}
              </>
            )}
          </Button>
        </div>
        <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap wrap-break-word rounded-md bg-muted p-3 text-xs">
          {config}
        </pre>
      </div>

      {command && (
        <div className="space-y-1">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {commandLabel}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => onCopy(command, `${title}-command`)}
            >
              {copiedItem === `${title}-command` ? (
                <>
                  <Check className="mr-1 size-3.5 text-emerald-500" />
                  {copiedLabel}
                </>
              ) : (
                <>
                  <Copy className="mr-1 size-3.5" />
                  {copyLabel}
                </>
              )}
            </Button>
          </div>
          <pre className="overflow-y-auto whitespace-pre-wrap wrap-break-word rounded-md bg-muted p-3 text-xs">
            {command}
          </pre>
        </div>
      )}
    </div>
  )
}

export function CustomDomainsCard({
  appId,
  cyloId,
  appState,
  appEnabled
}: {
  appId: number
  cyloId: number
  appState: number
  appEnabled: boolean
}) {
  const t = useTranslations("appboxmanager.appDetail")
  const { cylos } = useAuth()
  const { data: domains = [], isLoading } = useInstanceDomains(appId)
  const addMutation = useAddInstanceDomain(appId)
  const deleteMutation = useDeleteInstanceDomain(appId)
  const configMutation = useInstanceDomainConfig(appId)

  const [addOpen, setAddOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<InstanceDomain | null>(null)
  const [configData, setConfigData] =
    useState<InstanceDomainConfigResponse | null>(null)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const [subdomain, setSubdomain] = useState("")
  const [domainId, setDomainId] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<DomainOption | null>(
    null
  )
  const [subdomainError, setSubdomainError] = useState<string | null>(null)
  const [domainError, setDomainError] = useState<string | null>(null)
  const [dnsVerified, setDnsVerified] = useState(false)

  const currentCylo = useMemo(
    () => cylos.find((c) => c.id === cyloId) ?? null,
    [cylos, cyloId]
  )

  const resetAddForm = () => {
    setSubdomain("")
    setDomainId("")
    setSelectedDomain(null)
    setSubdomainError(null)
    setDomainError(null)
    setDnsVerified(false)
  }

  const fullDomainPreview =
    selectedDomain && subdomain.trim()
      ? `${subdomain.trim()}.${selectedDomain.domain}`
      : ""
  const userParentDomain = currentCylo?.domain?.toLowerCase() ?? ""
  const selectedParentDomain = selectedDomain?.domain?.toLowerCase() ?? ""
  const addWillRestartVm =
    Boolean(userParentDomain && selectedParentDomain) &&
    selectedParentDomain !== userParentDomain
  const deleteDomainValue = deleteTarget?.domain.toLowerCase() ?? ""
  const deleteWillRestartVm =
    Boolean(userParentDomain && deleteDomainValue) &&
    !(
      deleteDomainValue === userParentDomain ||
      deleteDomainValue.endsWith(`.${userParentDomain}`)
    )
  const canManageDomains = appState === 1 && appEnabled

  const handleOpenConfig = useCallback(
    async (domainName: string) => {
      try {
        const result = await configMutation.mutateAsync(domainName)
        if (!result?.config_snippets) {
          toast.error(t("customDomainsConfigNotAvailable"))
          return
        }
        setConfigData(result)
        setCopiedItem(null)
        setConfigOpen(true)
      } catch {
        toast.error(t("customDomainsConfigFetchFailed"))
      }
    },
    [configMutation, t]
  )

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard.writeText(value)
    setCopiedItem(key)
    setTimeout(() => setCopiedItem(null), 2000)
  }

  const handleAddDomain = async () => {
    const trimmedSubdomain = subdomain.trim().toLowerCase()
    const parsedDomainId = Number(domainId)

    setSubdomainError(null)
    setDomainError(null)

    if (!trimmedSubdomain) {
      setSubdomainError(t("customDomainsSubdomainRequired"))
      return
    }
    if (!DOMAIN_SUBDOMAIN_REGEX.test(trimmedSubdomain)) {
      setSubdomainError(t("customDomainsSubdomainInvalid"))
      return
    }
    if (trimmedSubdomain.length < 2 || trimmedSubdomain.length > 30) {
      setSubdomainError(t("customDomainsSubdomainLength"))
      return
    }
    if (!parsedDomainId) {
      setDomainError(t("customDomainsParentDomainRequired"))
      return
    }

    try {
      const available = await validateSubdomain(
        trimmedSubdomain,
        parsedDomainId
      )
      if (!available) {
        setSubdomainError(t("customDomainsSubdomainInUse"))
        return
      }
    } catch {
      setSubdomainError(t("customDomainsSubdomainValidateFailed"))
      return
    }

    try {
      const dnsCheck = await checkSubdomainDns(
        trimmedSubdomain,
        parsedDomainId,
        cyloId
      )
      if (!dnsCheck.verified) {
        setSubdomainError(
          dnsCheck.expected_ip
            ? t("customDomainsDnsNotVerifiedExpected", {
                ip: dnsCheck.expected_ip
              })
            : t("customDomainsDnsNotVerified")
        )
        return
      }
    } catch {
      setSubdomainError(t("customDomainsDnsCheckFailed"))
      return
    }

    try {
      const created = await addMutation.mutateAsync({
        subdomain: trimmedSubdomain,
        domain_id: parsedDomainId,
        cylo_id: cyloId
      })

      setAddOpen(false)
      resetAddForm()

      if (created?.config_snippets) {
        setConfigData({
          domain: created.domain,
          config_snippets: created.config_snippets,
          is_custom_domain: isCustomDomain(created.domain)
        })
        setConfigOpen(true)
      }
    } catch {
      toast.error(t("customDomainsAddFailed"))
    }
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: () => {
        toast.error(t("customDomainsDeleteFailed"))
      }
    })
  }

  const columns = useMemo<ColumnDef<InstanceDomain>[]>(
    () => [
      {
        accessorKey: "domain",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("customDomainsDomain")}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.domain}</span>
        )
      },
      {
        accessorKey: "is_initial",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("customDomainsPrimary")}
          />
        ),
        cell: ({ row }) => {
          const isPrimary =
            row.original.is_initial === 1 || row.original.is_initial === true
          return (
            <Badge variant={isPrimary ? "default" : "secondary"}>
              {isPrimary
                ? t("customDomainsPrimaryYes")
                : t("customDomainsPrimaryNo")}
            </Badge>
          )
        }
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("customDomainsAdded")}
          />
        ),
        cell: ({ row }) => <DateCell date={row.original.created_at} />
      },
      {
        id: "config",
        header: t("customDomainsConfig"),
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => {
              void handleOpenConfig(row.original.domain)
            }}
            disabled={configMutation.isPending}
          >
            {t("customDomainsViewConfig")}
          </Button>
        )
      },
      {
        id: "actions",
        header: t("customDomainsActions"),
        cell: ({ row }) => {
          const isInitial =
            row.original.is_initial === 1 || row.original.is_initial === true
          const canDelete = canManageDomains && !isInitial
          return (
            <div className="flex justify-end">
              {!isInitial && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-destructive hover:text-destructive disabled:text-muted-foreground disabled:hover:text-muted-foreground"
                  onClick={() => {
                    if (!canDelete) return
                    setDeleteTarget(row.original)
                  }}
                  disabled={!canDelete}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          )
        }
      }
    ],
    [t, configMutation.isPending, canManageDomains, handleOpenConfig]
  )

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                {t("customDomainsTitle")}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("customDomainsDescription")}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (!canManageDomains) return
                setAddOpen(true)
              }}
              disabled={!canManageDomains}
              className={!canManageDomains ? "opacity-50" : undefined}
            >
              <Plus className="mr-1.5 size-4" />
              {t("customDomainsAdd")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={domains}
            isLoading={isLoading}
            searchKey="domain"
            searchPlaceholder={t("customDomainsSearch")}
            emptyMessage={t("customDomainsEmpty")}
            pageSize={25}
          />
        </CardContent>
      </Card>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) resetAddForm()
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("customDomainsAddTitle")}</DialogTitle>
            <DialogDescription>
              {t("customDomainsAddDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="domain_id">
                {t("customDomainsParentDomain")}
              </Label>
              <BaseDomainSelector
                value={domainId}
                enabled={addOpen}
                error={domainError ?? undefined}
                disabled={addMutation.isPending}
                allowedBlockedDomains={
                  currentCylo?.domain ? [currentCylo.domain] : []
                }
                fallbackDomain={
                  currentCylo?.domain_id && currentCylo?.domain
                    ? {
                        id: currentCylo.domain_id,
                        domain: currentCylo.domain,
                        type: "subdomain"
                      }
                    : null
                }
                onSelect={(id, domain) => {
                  setDomainId(id)
                  setSelectedDomain(domain)
                  setDnsVerified(false)
                  setDomainError(null)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">{t("customDomainsSubdomain")}</Label>
              <div className="flex items-center gap-0">
                <Input
                  id="subdomain"
                  value={subdomain}
                  onChange={(event) => {
                    const normalized = event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                      .slice(0, 30)
                    setSubdomain(normalized)
                    setDnsVerified(false)
                    setSubdomainError(null)
                  }}
                  placeholder="myapp"
                  className="rounded-r-none"
                  disabled={addMutation.isPending}
                />
                <div className="flex h-9 items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                  {selectedDomain
                    ? `.${selectedDomain.domain}`
                    : t("customDomainsDomainSuffix")}
                </div>
              </div>
              {subdomainError && (
                <p className="text-xs text-destructive">{subdomainError}</p>
              )}
            </div>

            {addWillRestartVm && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                {t("customDomainsVmRestartWarning")}
              </div>
            )}

            {selectedDomain && subdomain.trim() && (
              <DnsVerificationPanel
                subdomain={subdomain.trim()}
                domainId={Number(domainId)}
                cyloId={cyloId}
                fullDomain={fullDomainPreview}
                serverIp={currentCylo?.server_ip ?? ""}
                dnsVerified={dnsVerified}
                onVerified={setDnsVerified}
              />
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={addMutation.isPending}
            >
              {t("customDomainsCancel")}
            </Button>
            <Button onClick={handleAddDomain} disabled={addMutation.isPending}>
              {addMutation.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {t("customDomainsSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("customDomainsDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("customDomainsDeleteDescription")}
              {deleteWillRestartVm && (
                <span className="mt-2 block rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                  {t("customDomainsVmRestartWarning")}
                </span>
              )}
              {deleteTarget && (
                <span className="mt-1 block font-mono text-sm text-foreground">
                  {deleteTarget.domain}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              {t("customDomainsCancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {t("customDomainsDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("customDomainsConfigTitle", {
                domain: configData?.domain ?? "—"
              })}
            </DialogTitle>
            <DialogDescription>
              {t("customDomainsConfigDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {configData?.is_custom_domain !== false ? (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                {t("customDomainsSslQueued")}
              </div>
            ) : (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                {t("customDomainsWildcardSsl")}
              </div>
            )}

            <SnippetBlock
              title={t("customDomainsNginx")}
              fileLabel={t("customDomainsFile")}
              configLabel={t("customDomainsConfigSnippet")}
              commandLabel={t("customDomainsReloadCommand")}
              copyLabel={t("customDomainsCopy")}
              copiedLabel={t("customDomainsCopied")}
              copiedItem={copiedItem}
              onCopy={handleCopy}
              file={configData?.config_snippets?.nginx?.file}
              config={configData?.config_snippets?.nginx?.config}
              command={configData?.config_snippets?.nginx?.reload_command}
            />

            <SnippetBlock
              title={t("customDomainsApache")}
              fileLabel={t("customDomainsFile")}
              configLabel={t("customDomainsConfigSnippet")}
              commandLabel={t("customDomainsReloadCommand")}
              copyLabel={t("customDomainsCopy")}
              copiedLabel={t("customDomainsCopied")}
              copiedItem={copiedItem}
              onCopy={handleCopy}
              file={configData?.config_snippets?.apache?.file}
              config={configData?.config_snippets?.apache?.config}
              command={configData?.config_snippets?.apache?.reload_command}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)}>
              {t("customDomainsClose")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
