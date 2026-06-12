"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { validateSubdomain, type DomainOption } from "@/api/apps/app-store"
import { BaseDomainSelector } from "@/components/dashboard/base-domain-selector"
import { DnsVerificationPanel } from "@/components/dashboard/domain/dns-verification-panel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Cylo } from "@/lib/auth/session"
import { cn } from "@/lib/utils"

const SUBDOMAIN_VALIDATION_FAILED =
  "Unable to validate the subdomain right now."

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type DomainType = "appbox" | "custom"

export interface DomainSectionState {
  domainType: DomainType
  selectedDomainId: string
  subdomain: string
  dnsVerified: boolean
}

interface DomainSectionProps {
  selectedCyloId: string
  selectedCylo: Cylo | null
  state: DomainSectionState
  domainError?: string
  subdomainError?: string
  onChange: (next: Partial<DomainSectionState>) => void
  onSubdomainError: (err: string | undefined) => void
  onDomainError: (err: string | undefined) => void
}

/* -------------------------------------------------------------------------- */
/*  Domain Type Toggle                                                         */
/* -------------------------------------------------------------------------- */

function DomainTypeToggle({
  value,
  onChange
}: {
  value: DomainType
  onChange: (v: DomainType) => void
}) {
  const t = useTranslations("appstore")
  return (
    <div className="flex rounded-md border p-0.5 gap-0.5 bg-muted/50 w-fit">
      {(["appbox", "custom"] as const).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            "rounded px-3 py-1 text-sm font-medium transition-all",
            value === type
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t(
            type === "appbox"
              ? "install.domain.typeAppbox"
              : "install.domain.typeCustom"
          )}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Appbox Domain Section                                                      */
/* -------------------------------------------------------------------------- */

function AppboxDomainSection({
  selectedCyloId,
  selectedCylo,
  subdomain,
  subdomainError,
  onDomainChange,
  onSubdomainChange,
  onSubdomainError
}: {
  selectedCyloId: string
  selectedCylo: Cylo | null
  subdomain: string
  subdomainError?: string
  onDomainChange: (id: string, domain: DomainOption | null) => void
  onSubdomainChange: (value: string) => void
  onSubdomainError: (err: string | undefined) => void
}) {
  const t = useTranslations("appstore")
  const [availabilityState, setAvailabilityState] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle")
  const availabilityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notifiedParent = useRef(false)

  // The Cylo session object carries both the root domain string and its DB id,
  // so we don't need an API call to discover them.
  const domainId = selectedCylo?.domain_id
  const domainName = selectedCylo?.domain
  const suffix = domainName ? `.${domainName}` : ""

  // Notify parent of the domain id once when the cylo is selected
  useEffect(() => {
    if (domainId && !notifiedParent.current) {
      notifiedParent.current = true
      onDomainChange(String(domainId), {
        id: domainId,
        domain: domainName ?? ""
      })
    }
  }, [domainId, domainName, onDomainChange])

  // Reset on cylo change
  useEffect(() => {
    notifiedParent.current = false
    queueMicrotask(() => setAvailabilityState("idle"))
  }, [selectedCyloId])

  // Debounced availability check on subdomain typing
  useEffect(() => {
    if (!subdomain || !domainId) {
      queueMicrotask(() => setAvailabilityState("idle"))
      return
    }
    if (availabilityTimer.current) clearTimeout(availabilityTimer.current)
    queueMicrotask(() => {
      setAvailabilityState("checking")
      onSubdomainError(undefined)
    })
    availabilityTimer.current = setTimeout(async () => {
      try {
        const available = await validateSubdomain(subdomain, domainId)
        setAvailabilityState(available ? "available" : "taken")
        onSubdomainError(undefined)
      } catch (error) {
        setAvailabilityState("idle")
        onSubdomainError(
          error instanceof Error && error.message
            ? error.message
            : SUBDOMAIN_VALIDATION_FAILED
        )
      }
    }, 500)
    return () => {
      if (availabilityTimer.current) clearTimeout(availabilityTimer.current)
    }
  }, [subdomain, domainId, onSubdomainError])

  if (!selectedCyloId) {
    return (
      <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        {t("install.domain.selectAppboxFirst")}
      </p>
    )
  }

  const fullDomain = subdomain && suffix ? `${subdomain}${suffix}` : ""

  return (
    <div className="space-y-3">
      {/* Subdomain input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t("install.domain.subdomain")}
          <span className="ml-1 text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-0">
          <Input
            value={subdomain}
            onChange={(e) => onSubdomainChange(e.target.value)}
            placeholder="myapp"
            className={cn(
              "z-10 rounded-r-none bg-muted/30",
              (subdomainError || availabilityState === "taken") &&
                "border-destructive"
            )}
          />
          <div
            className={cn(
              "flex h-9 items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap",
              (subdomainError || availabilityState === "taken") &&
                "border-destructive"
            )}
          >
            {suffix || t("install.domain.domainSuffix")}
          </div>
        </div>

        {/* Availability indicator */}
        {subdomain && domainId && (
          <p
            className={cn(
              "text-xs",
              availabilityState === "checking" && "text-muted-foreground",
              availabilityState === "available" &&
                "text-emerald-600 dark:text-emerald-400",
              availabilityState === "taken" && "text-destructive"
            )}
          >
            {availabilityState === "checking" && (
              <span className="flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                {t("install.validation.validating")}
              </span>
            )}
            {availabilityState === "available" && `✓ ${fullDomain}`}
            {availabilityState === "taken" &&
              t("install.validation.subdomainInUse")}
          </p>
        )}
        {subdomainError && (
          <p className="text-xs text-destructive">{subdomainError}</p>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Custom Domain Section                                                      */
/* -------------------------------------------------------------------------- */

function CustomDomainSection({
  selectedCyloId,
  selectedCylo,
  selectedDomainId,
  subdomain,
  dnsVerified,
  domainError,
  subdomainError,
  onDomainChange,
  onSubdomainChange,
  onSubdomainError,
  onDnsVerified
}: {
  selectedCyloId: string
  selectedCylo: Cylo | null
  selectedDomainId: string
  subdomain: string
  dnsVerified: boolean
  domainError?: string
  subdomainError?: string
  onDomainChange: (id: string, domain: DomainOption | null) => void
  onSubdomainChange: (value: string) => void
  onSubdomainError: (err: string | undefined) => void
  onDnsVerified: (verified: boolean) => void
}) {
  const t = useTranslations("appstore")
  const [selectedDomain, setSelectedDomain] = useState<DomainOption | null>(
    null
  )

  // Availability check
  const [availabilityState, setAvailabilityState] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle")
  const availabilityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset when cylo changes
  useEffect(() => {
    queueMicrotask(() => {
      setSelectedDomain(null)
      setAvailabilityState("idle")
    })
  }, [selectedCyloId])

  // Subdomain availability check (debounced)
  useEffect(() => {
    if (!subdomain || !selectedDomainId) {
      queueMicrotask(() => setAvailabilityState("idle"))
      return
    }
    if (availabilityTimer.current) clearTimeout(availabilityTimer.current)
    queueMicrotask(() => {
      setAvailabilityState("checking")
      onSubdomainError(undefined)
    })
    availabilityTimer.current = setTimeout(async () => {
      try {
        const available = await validateSubdomain(
          subdomain,
          Number(selectedDomainId)
        )
        setAvailabilityState(available ? "available" : "taken")
        onSubdomainError(undefined)
      } catch (error) {
        setAvailabilityState("idle")
        onSubdomainError(
          error instanceof Error && error.message
            ? error.message
            : SUBDOMAIN_VALIDATION_FAILED
        )
      }
    }, 500)
    return () => {
      if (availabilityTimer.current) clearTimeout(availabilityTimer.current)
    }
  }, [subdomain, selectedDomainId, onSubdomainError])

  const fullDomain =
    selectedDomain && subdomain ? `${subdomain}.${selectedDomain.domain}` : ""

  return (
    <div className="space-y-4">
      {/* Base domain picker */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t("install.domain.baseDomain")}
          <span className="ml-1 text-destructive">*</span>
        </Label>
        <BaseDomainSelector
          value={selectedDomainId}
          enabled={Boolean(selectedCyloId)}
          error={domainError}
          onSelect={(id, domain) => {
            setSelectedDomain(domain)
            onDomainChange(id, domain)
          }}
        />
      </div>

      {/* Subdomain input */}
      {selectedDomain && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t("install.domain.subdomain")}
            <span className="ml-1 text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-0">
            <Input
              value={subdomain}
              onChange={(e) => onSubdomainChange(e.target.value)}
              placeholder="myapp"
              className={cn(
                "z-10 rounded-r-none bg-muted/30",
                (subdomainError || availabilityState === "taken") &&
                  "border-destructive"
              )}
            />
            <div
              className={cn(
                "flex h-9 items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap",
                (subdomainError || availabilityState === "taken") &&
                  "border-destructive"
              )}
            >
              .{selectedDomain.domain}
            </div>
          </div>
          {/* Availability indicator */}
          {subdomain && (
            <p
              className={cn(
                "text-xs",
                availabilityState === "checking" && "text-muted-foreground",
                availabilityState === "available" &&
                  "text-emerald-600 dark:text-emerald-400",
                availabilityState === "taken" && "text-destructive"
              )}
            >
              {availabilityState === "checking" && (
                <span className="flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" />
                  {t("install.validation.validating")}
                </span>
              )}
              {availabilityState === "available" && `✓ ${fullDomain}`}
              {availabilityState === "taken" &&
                t("install.validation.subdomainInUse")}
            </p>
          )}
          {subdomainError && (
            <p className="text-xs text-destructive">{subdomainError}</p>
          )}
        </div>
      )}

      {/* DNS verification panel (shown once subdomain + domain are both set and available) */}
      {selectedDomain &&
        subdomain &&
        availabilityState === "available" &&
        selectedCylo && (
          <DnsVerificationPanel
            subdomain={subdomain}
            domainId={Number(selectedDomainId)}
            cyloId={selectedCylo.id}
            fullDomain={fullDomain}
            serverIp={selectedCylo.server_ip}
            dnsVerified={dnsVerified}
            onVerified={onDnsVerified}
          />
        )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main export: DomainSection                                                 */
/* -------------------------------------------------------------------------- */

export function DomainSection({
  selectedCyloId,
  selectedCylo,
  state,
  domainError,
  subdomainError,
  onChange,
  onSubdomainError,
  onDomainError
}: DomainSectionProps) {
  const t = useTranslations("appstore")

  const handleDomainTypeChange = (type: DomainType) => {
    onChange({
      domainType: type,
      selectedDomainId: "",
      subdomain: "",
      dnsVerified: false
    })
    onDomainError(undefined)
    onSubdomainError(undefined)
  }

  const handleDomainChange = useCallback(
    (_id: string, _domain: DomainOption | null) => {
      onChange({ selectedDomainId: _id, dnsVerified: false })
      onDomainError(undefined)
    },
    [onChange, onDomainError]
  )

  const handleSubdomainChange = useCallback(
    (value: string) => {
      const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "")
      onChange({ subdomain: sanitized, dnsVerified: false })
      onSubdomainError(undefined)
    },
    [onChange, onSubdomainError]
  )

  const handleDnsVerified = useCallback(
    (verified: boolean) => {
      onChange({ dnsVerified: verified })
    },
    [onChange]
  )

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t("install.domain.domainType")}
        </Label>
        <DomainTypeToggle
          value={state.domainType}
          onChange={handleDomainTypeChange}
        />
      </div>

      {state.domainType === "appbox" ? (
        <AppboxDomainSection
          selectedCyloId={selectedCyloId}
          selectedCylo={selectedCylo}
          subdomain={state.subdomain}
          subdomainError={subdomainError}
          onDomainChange={handleDomainChange}
          onSubdomainChange={handleSubdomainChange}
          onSubdomainError={onSubdomainError}
        />
      ) : (
        <CustomDomainSection
          selectedCyloId={selectedCyloId}
          selectedCylo={selectedCylo}
          selectedDomainId={state.selectedDomainId}
          subdomain={state.subdomain}
          dnsVerified={state.dnsVerified}
          domainError={domainError}
          subdomainError={subdomainError}
          onDomainChange={handleDomainChange}
          onSubdomainChange={handleSubdomainChange}
          onSubdomainError={onSubdomainError}
          onDnsVerified={handleDnsVerified}
        />
      )}
    </div>
  )
}
