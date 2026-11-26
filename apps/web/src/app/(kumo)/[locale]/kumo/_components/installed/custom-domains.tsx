"use client"

import { useCallback, useMemo, useState, type KeyboardEvent } from "react"
import { useTranslations } from "next-intl"
import { Banner, Button, Dialog, InputGroup } from "@cloudflare/kumo"
import { PlusIcon, WarningIcon, XIcon } from "@phosphor-icons/react"
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
import { useAuth } from "@/providers/auth-provider"
import { BaseDomainSelector } from "../install/base-domain-selector"
import { DnsVerificationPanel } from "../install/dns-verification-panel"
import { FieldBlock, FieldError } from "../ui/field-parts"
import { Panel } from "../ui/panel"
import { CustomDomainConfigDialog } from "./custom-domains-config"
import { CustomDomainsTable } from "./custom-domains-table"

const DOMAIN_SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
const PLATFORM_SUFFIXES = ["appboxes.co", "cylo.net", "appbox.co"]

function isCustomDomain(domain: string): boolean {
  const lower = domain.toLowerCase()
  return !PLATFORM_SUFFIXES.some(
    (suffix) => lower === suffix || lower.endsWith(`.${suffix}`)
  )
}

/**
 * The domains attached to one installed app: the list, adding one once its
 * DNS record checks out, removing one, and the web server snippets for each.
 * Everything that decides what is allowed is carried over from the current
 * design unchanged; only what it renders differs.
 */
export function CustomDomains({
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
  // The target outlives the dialog being open, so that the dialog still shows
  // it while it animates out.
  const [deleteOpen, setDeleteOpen] = useState(false)
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

  // The base domain picker reloads its list whenever these change identity,
  // so they are kept stable between renders.
  const cyloDomain = currentCylo?.domain
  const cyloDomainId = currentCylo?.domain_id
  const allowedBlockedDomains = useMemo(
    () => (cyloDomain ? [cyloDomain] : []),
    [cyloDomain]
  )
  const fallbackDomain = useMemo<DomainOption | null>(
    () =>
      cyloDomainId && cyloDomain
        ? { id: cyloDomainId, domain: cyloDomain, type: "subdomain" }
        : null,
    [cyloDomainId, cyloDomain]
  )
  const handleSelectDomain = useCallback(
    (id: string, domain: DomainOption | null) => {
      setDomainId(id)
      setSelectedDomain(domain)
      setDnsVerified(false)
      setDomainError(null)
    },
    []
  )

  const handleOpenConfig = async (domainName: string) => {
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
  }

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
      onSuccess: () => setDeleteOpen(false),
      onError: () => {
        toast.error(t("customDomainsDeleteFailed"))
      }
    })
  }

  /**
   * Enter saves from anywhere in the add dialog except a button or link,
   * which keep their own activation: the rule the current dialogs follow.
   */
  const handleAddDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return
    if (event.key !== "Enter") return
    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return
    if (event.nativeEvent.isComposing) return

    const target = event.target as HTMLElement
    // Key presses in a popup opened from the dialog (a menu of options) reach
    // this handler through React, not the page; Enter there picks an option.
    if (!event.currentTarget.contains(target)) return
    const targetTag = target.tagName.toLowerCase()
    if (targetTag === "textarea" || target.isContentEditable) return
    if (targetTag === "button" || targetTag === "a") return
    if (addMutation.isPending) return

    event.preventDefault()
    void handleAddDomain()
  }

  const subdomainLabel = t("customDomainsSubdomain")

  return (
    <>
      <Panel
        title={t("customDomainsTitle")}
        count={isLoading ? undefined : domains.length}
        flush
        action={
          <Button
            size="sm"
            variant="primary"
            icon={PlusIcon}
            disabled={!canManageDomains}
            onClick={() => {
              if (!canManageDomains) return
              setAddOpen(true)
            }}
          >
            {t("customDomainsAdd")}
          </Button>
        }
      >
        <CustomDomainsTable
          domains={domains}
          isLoading={isLoading}
          canManage={canManageDomains}
          configPending={configMutation.isPending}
          configDomain={configMutation.variables}
          onViewConfig={(domain) => {
            void handleOpenConfig(domain)
          }}
          onDelete={(domain) => {
            setDeleteTarget(domain)
            setDeleteOpen(true)
          }}
        />
      </Panel>

      {/* Add a domain */}
      <Dialog.Root
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) resetAddForm()
        }}
      >
        <Dialog size="lg">
          {/*
           * Kumo's Dialog takes no key handler, so this wrapper fills the
           * popup and takes it instead. It is focusable so that Enter still
           * saves after a click on the dialog's own background, and it is
           * capped at the popup's height so the body scrolls between a fixed
           * header and footer.
           */}
          <div
            tabIndex={-1}
            className="relative flex max-h-[inherit] flex-col outline-none"
            onKeyDown={handleAddDialogKeyDown}
          >
            <header className="grid shrink-0 gap-1.5 border-b border-kumo-line py-5 ps-6 pe-16">
              <Dialog.Title className="text-lg font-semibold">
                {t("customDomainsAddTitle")}
              </Dialog.Title>
              <Dialog.Description className="text-kumo-subtle">
                {t("customDomainsAddDescription")}
              </Dialog.Description>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-5 overflow-y-auto px-6 py-5">
              <FieldBlock label={t("customDomainsParentDomain")}>
                {/* Enter inside the picker chooses or adds a base domain; it
                    must not also press the dialog's save button. */}
                <div
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.stopPropagation()
                  }}
                >
                  <BaseDomainSelector
                    value={domainId}
                    enabled={addOpen}
                    error={domainError ?? undefined}
                    disabled={addMutation.isPending}
                    allowedBlockedDomains={allowedBlockedDomains}
                    fallbackDomain={fallbackDomain}
                    onSelect={handleSelectDomain}
                  />
                </div>
              </FieldBlock>

              <div className="grid gap-2">
                <InputGroup
                  label={subdomainLabel}
                  disabled={addMutation.isPending}
                >
                  <InputGroup.Input
                    aria-label={subdomainLabel}
                    // Turns the group's ring red; the message is rendered below.
                    aria-invalid={Boolean(subdomainError) || undefined}
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
                  />
                  <InputGroup.Suffix>
                    {selectedDomain
                      ? `.${selectedDomain.domain}`
                      : t("customDomainsDomainSuffix")}
                  </InputGroup.Suffix>
                </InputGroup>
                {subdomainError && <FieldError>{subdomainError}</FieldError>}
              </div>

              {addWillRestartVm && (
                <Banner
                  variant="alert"
                  icon={<WarningIcon weight="fill" />}
                  description={t("customDomainsVmRestartWarning")}
                />
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

            <footer className="flex shrink-0 justify-end gap-2 border-t border-kumo-line px-6 py-4">
              <Button
                variant="secondary"
                onClick={() => setAddOpen(false)}
                disabled={addMutation.isPending}
              >
                {t("customDomainsCancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleAddDomain}
                disabled={addMutation.isPending}
                loading={addMutation.isPending}
              >
                {t("customDomainsSave")}
              </Button>
            </footer>

            {/* Last in the markup, so that opening the dialog puts focus on
                the form rather than on the close button. */}
            <Dialog.Close
              render={
                <Button
                  variant="ghost"
                  shape="square"
                  aria-label={t("customDomainsClose")}
                  icon={XIcon}
                  className="absolute end-4 top-4"
                />
              }
            />
          </div>
        </Dialog>
      </Dialog.Root>

      {/* Remove a domain */}
      <Dialog.Root
        role="alertdialog"
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteOpen(false)
        }}
      >
        <Dialog className="grid grid-cols-1 gap-5 px-6 py-5">
          <div className="grid gap-1.5">
            <Dialog.Title className="text-lg font-semibold">
              {t("customDomainsDeleteTitle")}
            </Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              {t("customDomainsDeleteDescription")}
              {deleteTarget && (
                <span className="mt-1 block font-mono text-[0.9em] break-all text-kumo-default">
                  {deleteTarget.domain}
                </span>
              )}
            </Dialog.Description>
          </div>
          {deleteWillRestartVm && (
            <Banner
              variant="alert"
              icon={<WarningIcon weight="fill" />}
              description={t("customDomainsVmRestartWarning")}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              {t("customDomainsCancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              loading={deleteMutation.isPending}
            >
              {t("customDomainsDelete")}
            </Button>
          </div>
        </Dialog>
      </Dialog.Root>

      {/* Web server snippets for a domain */}
      <CustomDomainConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        configData={configData}
        copiedItem={copiedItem}
        onCopy={handleCopy}
      />
    </>
  )
}
