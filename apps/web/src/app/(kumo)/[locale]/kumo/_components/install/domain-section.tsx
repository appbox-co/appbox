"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, cn, InputGroup, Label } from "@cloudflare/kumo"
import { validateSubdomain, type DomainOption } from "@/api/apps/app-store"
import type { Cylo } from "@/lib/auth/session"
import { validInstallSubdomain } from "@/lib/install-validation"
import { BaseDomainSelector } from "./base-domain-selector"
import { DnsVerificationPanel } from "./dns-verification-panel"
import {
  FieldBlock,
  FieldError,
  LoadingRow,
  Notice,
  withRequiredMark
} from "./field-parts"
import { SUBDOMAIN_VALIDATION_FAILED } from "./logic"

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

type AvailabilityState = "idle" | "checking" | "available" | "taken"

/* -------------------------------------------------------------------------- */
/*  Domain type toggle                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Two buttons rather than Kumo's Tabs: choosing the type that is already
 * selected still resets the section, and a tab would swallow that click.
 */
function DomainTypeToggle({
  value,
  onChange
}: {
  value: DomainType
  onChange: (v: DomainType) => void
}) {
  const t = useTranslations("appstore")
  return (
    <div
      className="flex w-fit gap-1.5"
      role="group"
      aria-label={t("install.domain.domainType")}
    >
      {(["appbox", "custom"] as const).map((type) => (
        <Button
          key={type}
          size="sm"
          variant={value === type ? "primary" : "secondary"}
          aria-pressed={value === type}
          onClick={() => onChange(type)}
        >
          {t(
            type === "appbox"
              ? "install.domain.typeAppbox"
              : "install.domain.typeCustom"
          )}
        </Button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Subdomain field                                                            */
/* -------------------------------------------------------------------------- */

/** The subdomain input, its domain suffix, and the availability check's verdict. */
function SubdomainField({
  subdomain,
  suffix,
  fullDomain,
  availabilityState,
  showAvailability,
  subdomainError,
  onSubdomainChange
}: {
  subdomain: string
  suffix: string
  fullDomain: string
  availabilityState: AvailabilityState
  showAvailability: boolean
  subdomainError?: string
  onSubdomainChange: (value: string) => void
}) {
  const t = useTranslations("appstore")
  const label = t("install.domain.subdomain")
  const invalid = Boolean(subdomainError) || availabilityState === "taken"

  return (
    <div className="grid gap-2">
      <InputGroup label={withRequiredMark(label, true)}>
        <InputGroup.Input
          aria-label={label}
          // Turns the group's ring red; the messages are rendered below.
          aria-invalid={invalid || undefined}
          value={subdomain}
          onChange={(e) => onSubdomainChange(e.target.value)}
          placeholder="myapp"
        />
        <InputGroup.Suffix>{suffix}</InputGroup.Suffix>
      </InputGroup>

      {/* Availability indicator */}
      {showAvailability && availabilityState !== "idle" && (
        <div
          className={cn(
            "text-sm leading-snug",
            availabilityState === "available" && "text-kumo-success",
            availabilityState === "taken" && "text-kumo-danger"
          )}
        >
          {availabilityState === "checking" && (
            <LoadingRow>{t("install.validation.validating")}</LoadingRow>
          )}
          {availabilityState === "available" && `✓ ${fullDomain}`}
          {availabilityState === "taken" &&
            t("install.validation.subdomainInUse")}
        </div>
      )}
      {subdomainError && <FieldError>{subdomainError}</FieldError>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Appbox domain section                                                      */
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
  const [availabilityState, setAvailabilityState] =
    useState<AvailabilityState>("idle")
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
    let cancelled = false
    if (!validInstallSubdomain(subdomain)) {
      queueMicrotask(() => {
        if (cancelled) return
        setAvailabilityState("idle")
        onSubdomainError(t("install.validation.invalidSubdomain"))
      })
      return () => {
        cancelled = true
      }
    }
    if (availabilityTimer.current) clearTimeout(availabilityTimer.current)
    queueMicrotask(() => {
      if (cancelled) return
      setAvailabilityState("checking")
      onSubdomainError(undefined)
    })
    availabilityTimer.current = setTimeout(async () => {
      try {
        const available = await validateSubdomain(subdomain, domainId)
        if (cancelled) return
        setAvailabilityState(available ? "available" : "taken")
        onSubdomainError(undefined)
      } catch (error) {
        if (cancelled) return
        setAvailabilityState("idle")
        onSubdomainError(
          error instanceof Error && error.message
            ? error.message
            : SUBDOMAIN_VALIDATION_FAILED
        )
      }
    }, 500)
    return () => {
      cancelled = true
      if (availabilityTimer.current) clearTimeout(availabilityTimer.current)
    }
  }, [subdomain, domainId, onSubdomainError, t])

  if (!selectedCyloId) {
    return <Notice>{t("install.domain.selectAppboxFirst")}</Notice>
  }

  const fullDomain = subdomain && suffix ? `${subdomain}${suffix}` : ""

  return (
    <SubdomainField
      subdomain={subdomain}
      suffix={suffix || t("install.domain.domainSuffix")}
      fullDomain={fullDomain}
      availabilityState={availabilityState}
      showAvailability={Boolean(subdomain && domainId)}
      subdomainError={subdomainError}
      onSubdomainChange={onSubdomainChange}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  Custom domain section                                                      */
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
  const [availabilityState, setAvailabilityState] =
    useState<AvailabilityState>("idle")
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
    let cancelled = false
    if (!validInstallSubdomain(subdomain)) {
      queueMicrotask(() => {
        if (cancelled) return
        setAvailabilityState("idle")
        onSubdomainError(t("install.validation.invalidSubdomain"))
      })
      return () => {
        cancelled = true
      }
    }
    if (availabilityTimer.current) clearTimeout(availabilityTimer.current)
    queueMicrotask(() => {
      if (cancelled) return
      setAvailabilityState("checking")
      onSubdomainError(undefined)
    })
    availabilityTimer.current = setTimeout(async () => {
      try {
        const available = await validateSubdomain(
          subdomain,
          Number(selectedDomainId)
        )
        if (cancelled) return
        setAvailabilityState(available ? "available" : "taken")
        onSubdomainError(undefined)
      } catch (error) {
        if (cancelled) return
        setAvailabilityState("idle")
        onSubdomainError(
          error instanceof Error && error.message
            ? error.message
            : SUBDOMAIN_VALIDATION_FAILED
        )
      }
    }, 500)
    return () => {
      cancelled = true
      if (availabilityTimer.current) clearTimeout(availabilityTimer.current)
    }
  }, [subdomain, selectedDomainId, onSubdomainError, t])

  const fullDomain =
    selectedDomain && subdomain ? `${subdomain}.${selectedDomain.domain}` : ""

  return (
    <div className="grid gap-4">
      {/* Base domain picker */}
      <FieldBlock
        label={withRequiredMark(t("install.domain.baseDomain"), true)}
      >
        <BaseDomainSelector
          value={selectedDomainId}
          enabled={Boolean(selectedCyloId)}
          error={domainError}
          onSelect={(id, domain) => {
            setSelectedDomain(domain)
            onDomainChange(id, domain)
          }}
        />
      </FieldBlock>

      {/* Subdomain input */}
      {selectedDomain && (
        <SubdomainField
          subdomain={subdomain}
          suffix={`.${selectedDomain.domain}`}
          fullDomain={fullDomain}
          availabilityState={availabilityState}
          showAvailability={Boolean(subdomain)}
          subdomainError={subdomainError}
          onSubdomainChange={onSubdomainChange}
        />
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
      const normalized = value.trim().toLowerCase()
      onChange({ subdomain: normalized, dnsVerified: false })
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
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>{t("install.domain.domainType")}</Label>
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
