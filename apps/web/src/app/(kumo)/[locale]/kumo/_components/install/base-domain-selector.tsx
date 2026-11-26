"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, cn, Combobox, Input, Loader } from "@cloudflare/kumo"
import { PlusIcon } from "@phosphor-icons/react"
import {
  addCustomBaseDomain,
  getDomainsForInstall,
  type DomainOption
} from "@/api/apps/app-store"
import { FieldError, Notice } from "../ui/field-parts"
import { getSafeAddDomainError, isBlockedDomain } from "./logic"

interface BaseDomainSelectorProps {
  value: string
  enabled?: boolean
  error?: string
  disabled?: boolean
  fallbackDomain?: DomainOption | null
  allowedBlockedDomains?: string[]
  onSelect: (id: string, domain: DomainOption | null) => void
}

const EMPTY_ALLOWED_BLOCKED_DOMAINS: string[] = []

/** Picks one of the account's own base domains, or adds a new one. */
export function BaseDomainSelector({
  value,
  enabled = true,
  error,
  disabled = false,
  fallbackDomain,
  allowedBlockedDomains,
  onSelect
}: BaseDomainSelectorProps) {
  const t = useTranslations("appstore")
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [loadingDomains, setLoadingDomains] = useState(false)
  const [domainSearch, setDomainSearch] = useState("")

  const [showAddNew, setShowAddNew] = useState(false)
  const [newDomainInput, setNewDomainInput] = useState("")
  const [newDomainError, setNewDomainError] = useState<string | undefined>()
  const [addingDomain, setAddingDomain] = useState(false)

  const stableAllowedBlockedDomains =
    allowedBlockedDomains ?? EMPTY_ALLOWED_BLOCKED_DOMAINS

  const allowedBlockedDomainsKey = useMemo(
    () =>
      stableAllowedBlockedDomains
        .map((d) => d.toLowerCase().trim())
        .filter(Boolean)
        .sort()
        .join("||"),
    [stableAllowedBlockedDomains]
  )

  const normalizedAllowedBlockedDomains = useMemo(
    () =>
      new Set(
        allowedBlockedDomainsKey ? allowedBlockedDomainsKey.split("||") : []
      ),
    [allowedBlockedDomainsKey]
  )

  const shouldIncludeDomain = useCallback(
    (domain: string) => {
      const lower = domain.toLowerCase().trim()
      return (
        !isBlockedDomain(lower) || normalizedAllowedBlockedDomains.has(lower)
      )
    },
    [normalizedAllowedBlockedDomains]
  )

  const fetchDomains = useCallback(async () => {
    setLoadingDomains(true)
    try {
      const items = await getDomainsForInstall()
      const merged = [...items]
      if (
        fallbackDomain &&
        !merged.some((d) => Number(d.id) === Number(fallbackDomain.id))
      ) {
        merged.unshift(fallbackDomain)
      }
      setDomains(merged.filter((d) => shouldIncludeDomain(d.domain)))
    } catch {
      if (fallbackDomain) {
        setDomains(
          [fallbackDomain].filter((d) => shouldIncludeDomain(d.domain))
        )
      } else {
        setDomains([])
      }
    } finally {
      setLoadingDomains(false)
    }
  }, [fallbackDomain, shouldIncludeDomain])

  useEffect(() => {
    if (enabled) {
      void fetchDomains()
    }
  }, [enabled, fetchDomains])

  useEffect(() => {
    if (!enabled) return
    if (value) return
    if (domains.length !== 1) return
    onSelect(String(domains[0].id), domains[0])
  }, [enabled, value, domains, onSelect])

  const selectedDomain = useMemo(
    () => domains.find((d) => String(d.id) === value) ?? null,
    [domains, value]
  )

  const filteredDomains = useMemo(() => {
    if (!domainSearch) return domains
    return domains.filter((d) =>
      d.domain.toLowerCase().includes(domainSearch.toLowerCase())
    )
  }, [domains, domainSearch])

  const handleAddNewDomain = async () => {
    const val = newDomainInput.trim().toLowerCase()
    if (!val) return
    if (isBlockedDomain(val)) {
      setNewDomainError(t("install.domain.blockedDomain"))
      return
    }
    if (
      !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(
        val
      )
    ) {
      setNewDomainError(t("install.domain.invalidDomain"))
      return
    }

    setAddingDomain(true)
    setNewDomainError(undefined)
    try {
      const created = await addCustomBaseDomain(val)
      setDomains((prev) => [...prev, created])
      onSelect(String(created.id), created)
      setShowAddNew(false)
      setNewDomainInput("")
    } catch (e: unknown) {
      setNewDomainError(
        getSafeAddDomainError(
          e,
          t("install.domain.addDomainFailed"),
          t("install.domain.domainAlreadyInUse")
        )
      )
    } finally {
      setAddingDomain(false)
    }
  }

  if (!enabled) {
    return <Notice>{t("install.domain.selectAppboxFirst")}</Notice>
  }

  return (
    <div className="grid gap-2">
      {showAddNew ? (
        <div className="grid gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              aria-label={t("install.domain.addNewDomain")}
              placeholder="mydomain.com"
              value={newDomainInput}
              onChange={(e) => {
                setNewDomainInput(e.target.value)
                setNewDomainError(undefined)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAddNewDomain()
                if (e.key === "Escape") {
                  setShowAddNew(false)
                  setNewDomainInput("")
                }
              }}
              className={cn(
                "min-w-0 sm:flex-1",
                newDomainError && "ring-kumo-danger"
              )}
              autoFocus
              disabled={disabled || addingDomain}
            />
            <Button
              variant="primary"
              onClick={() => void handleAddNewDomain()}
              disabled={disabled || addingDomain || !newDomainInput.trim()}
              loading={addingDomain}
            >
              {t("install.domain.add")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddNew(false)
                setNewDomainInput("")
                setNewDomainError(undefined)
              }}
              disabled={disabled || addingDomain}
            >
              {t("install.dialog.cancel")}
            </Button>
          </div>
          {newDomainError && <FieldError>{newDomainError}</FieldError>}
        </div>
      ) : (
        // "Add new domain" sits beside the picker rather than inside its
        // popup: a Kumo Combobox popup is a listbox, and a button in it
        // would not be one of the options the arrow keys move through.
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-48 flex-1">
            <Combobox<DomainOption>
              // No label here, so this only turns the trigger's ring red;
              // the message itself is rendered below.
              error={error}
              disabled={disabled}
              items={domains}
              filteredItems={filteredDomains}
              inputValue={domainSearch}
              onInputValueChange={setDomainSearch}
              value={selectedDomain}
              itemToStringLabel={(domain) => domain.domain}
              isItemEqualToValue={(item, selected) =>
                String(item.id) === String(selected.id)
              }
              onValueChange={(domain) => {
                if (!domain) return
                onSelect(String(domain.id), domain)
                setDomainSearch("")
              }}
            >
              <Combobox.TriggerValue
                className="w-full"
                placeholder={t("install.domain.selectOrAddDomain")}
              />
              <Combobox.Content>
                <Combobox.Input
                  aria-label={t("install.domain.searchDomains")}
                  placeholder={t("install.domain.searchDomains")}
                />
                {loadingDomains ? (
                  <div className="flex items-center justify-center py-4 text-kumo-subtle">
                    <Loader size="sm" />
                  </div>
                ) : filteredDomains.length === 0 && domainSearch ? (
                  <p className="px-3.5 py-2 text-kumo-subtle">
                    {t("install.domain.noCustomDomains")}
                  </p>
                ) : (
                  <>
                    <p className="px-3.5 py-1.5 text-sm text-kumo-subtle">
                      {t("install.domain.yourDomains")}
                    </p>
                    <Combobox.List>
                      {(domain: DomainOption) => (
                        <Combobox.Item key={domain.id} value={domain}>
                          {domain.domain}
                        </Combobox.Item>
                      )}
                    </Combobox.List>
                  </>
                )}
              </Combobox.Content>
            </Combobox>
          </div>
          <Button
            variant="secondary"
            icon={PlusIcon}
            disabled={disabled}
            onClick={() => {
              setShowAddNew(true)
              setDomainSearch("")
            }}
          >
            {t("install.domain.addNewDomain")}
          </Button>
        </div>
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
