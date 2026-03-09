"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Check, ChevronsUpDown, Loader2, Plus, Search } from "lucide-react"
import {
  addCustomBaseDomain,
  getDomainsForInstall,
  type DomainOption
} from "@/api/apps/app-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const BLOCKED_SUFFIXES = [
  "appboxes.co",
  "appbox.co",
  "abx.bz",
  "cylo.io",
  "cylo.net"
]

function isBlockedDomain(domain: string): boolean {
  const lower = domain.toLowerCase().trim()
  return BLOCKED_SUFFIXES.some(
    (suffix) => lower === suffix || lower.endsWith(`.${suffix}`)
  )
}

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
  const [open, setOpen] = useState(false)
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
      const msg =
        e instanceof Error ? e.message : t("install.domain.addDomainFailed")
      setNewDomainError(msg)
    } finally {
      setAddingDomain(false)
    }
  }

  if (!enabled) {
    return (
      <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        {t("install.domain.selectAppboxFirst")}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {showAddNew ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
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
              className={cn("flex-1", newDomainError && "border-destructive")}
              autoFocus
              disabled={disabled || addingDomain}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => void handleAddNewDomain()}
              disabled={disabled || addingDomain || !newDomainInput.trim()}
            >
              {addingDomain ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("install.domain.add")
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
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
          {newDomainError && (
            <p className="text-xs text-destructive">{newDomainError}</p>
          )}
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between font-normal",
                !value && "text-muted-foreground",
                error && "border-destructive"
              )}
              disabled={disabled}
            >
              {selectedDomain
                ? selectedDomain.domain
                : t("install.domain.selectOrAddDomain")}
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            <div className="flex flex-col">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 size-4 shrink-0 opacity-50" />
                <input
                  placeholder={t("install.domain.searchDomains")}
                  value={domainSearch}
                  onChange={(e) => setDomainSearch(e.target.value)}
                  className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div
                className="max-h-52 overflow-y-auto p-1"
                onWheel={(e) => {
                  const el = e.currentTarget
                  if (el.scrollHeight <= el.clientHeight) return
                  e.stopPropagation()
                  el.scrollTop += e.deltaY
                }}
              >
                {loadingDomains ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredDomains.length === 0 && domainSearch ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {t("install.domain.noCustomDomains")}
                  </p>
                ) : (
                  <>
                    <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      {t("install.domain.yourDomains")}
                    </p>
                    {filteredDomains.map((domain) => (
                      <button
                        key={domain.id}
                        type="button"
                        onClick={() => {
                          onSelect(String(domain.id), domain)
                          setOpen(false)
                          setDomainSearch("")
                        }}
                        className={cn(
                          "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                          value === String(domain.id) && "bg-accent"
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            value === String(domain.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {domain.domain}
                      </button>
                    ))}
                  </>
                )}
              </div>

              <div className="border-t p-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setShowAddNew(true)
                    setDomainSearch("")
                  }}
                  className="flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="mr-2 size-4" />
                  {t("install.domain.addNewDomain")}
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
