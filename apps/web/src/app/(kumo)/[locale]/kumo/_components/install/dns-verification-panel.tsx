"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Badge,
  Button,
  Collapsible,
  Link as KumoLink,
  Select
} from "@cloudflare/kumo"
import {
  CheckIcon,
  CopyIcon,
  ShieldCheckIcon,
  XCircleIcon
} from "@phosphor-icons/react"
import { checkSubdomainDns, type DnsCheckResult } from "@/api/apps/app-store"
import { DNS_PROVIDERS, type DnsProvider } from "./logic"

/* -------------------------------------------------------------------------- */
/*  Provider guide                                                             */
/* -------------------------------------------------------------------------- */

function DnsProviderGuide({
  fullDomain,
  ip
}: {
  fullDomain: string
  ip: string
}) {
  const [open, setOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<DnsProvider | null>(
    null
  )

  const host =
    fullDomain.split(".").length > 2
      ? fullDomain.split(".").slice(0, -2).join(".")
      : "@"

  const steps = selectedProvider ? selectedProvider.steps(host, ip) : []

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.DefaultTrigger>
        Need help adding this record?
      </Collapsible.DefaultTrigger>
      <Collapsible.DefaultPanel>
        <Select
          aria-label="Select your DNS provider..."
          className="w-full"
          placeholder="Select your DNS provider..."
          value={selectedProvider?.id ?? null}
          onValueChange={(id) => {
            const provider = DNS_PROVIDERS.find((p) => p.id === id)
            if (provider) setSelectedProvider(provider)
          }}
          renderValue={(id) => DNS_PROVIDERS.find((p) => p.id === id)?.name}
        >
          {DNS_PROVIDERS.map((provider) => (
            <Select.Option key={provider.id} value={provider.id}>
              {provider.name}
            </Select.Option>
          ))}
        </Select>

        {selectedProvider && (
          <div className="grid gap-2">
            <ol className="grid list-none gap-1.5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-kumo-subtle">
                  <span className="w-5 shrink-0 font-medium text-kumo-default tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            {selectedProvider.url && (
              <div className="text-sm">
                <KumoLink
                  href={selectedProvider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open {selectedProvider.name}
                  <KumoLink.ExternalIcon />
                </KumoLink>
              </div>
            )}
          </div>
        )}
      </Collapsible.DefaultPanel>
    </Collapsible.Root>
  )
}

/* -------------------------------------------------------------------------- */
/*  Verification panel                                                         */
/* -------------------------------------------------------------------------- */

function CopyButton({
  label,
  copied,
  onClick
}: {
  label: string
  copied: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      shape="square"
      className="shrink-0"
      aria-label={label}
      // Kumo shows a button's title as its tooltip.
      title={label}
      icon={copied ? <CheckIcon className="text-kumo-success" /> : CopyIcon}
      onClick={onClick}
    />
  )
}

interface DnsVerificationPanelProps {
  subdomain: string
  domainId: number
  cyloId: number
  fullDomain: string
  serverIp: string
  dnsVerified: boolean
  onVerified: (verified: boolean) => void
}

export function DnsVerificationPanel({
  subdomain,
  domainId,
  cyloId,
  fullDomain,
  serverIp,
  dnsVerified,
  onVerified
}: DnsVerificationPanelProps) {
  const t = useTranslations("appstore")
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<DnsCheckResult | null>(
    serverIp ? { verified: false, expected_ip: serverIp } : null
  )
  const [copied, setCopied] = useState<"domain" | "ip" | null>(null)

  const runVerification = useCallback(
    async (resetResult = false) => {
      if (!subdomain.trim() || !domainId || !cyloId) return
      setChecking(true)
      if (resetResult) setResult(null)
      try {
        const res = await checkSubdomainDns(subdomain, domainId, cyloId)
        setResult(res)
        onVerified(res.verified)
      } catch {
        setResult({ verified: false })
        onVerified(false)
      } finally {
        setChecking(false)
      }
    },
    [subdomain, domainId, cyloId, onVerified]
  )

  useEffect(() => {
    setResult(serverIp ? { verified: false, expected_ip: serverIp } : null)
    onVerified(false)
    if (!subdomain.trim() || !domainId || !cyloId) return

    const timer = setTimeout(() => {
      void runVerification()
    }, 600)

    return () => clearTimeout(timer)
  }, [subdomain, domainId, cyloId, serverIp, onVerified, runVerification])

  const handleVerify = async () => {
    await runVerification(true)
  }

  const handleCopy = (text: string, which: "domain" | "ip" = "domain") => {
    navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  if (dnsVerified) {
    // Kumo's Banner has no success variant, so this borrows its layout.
    return (
      <div className="flex items-start gap-3 rounded-lg bg-kumo-success-tint px-4 py-3 text-kumo-success">
        <span className="flex h-lh shrink-0 items-center">
          <ShieldCheckIcon aria-hidden="true" size={16} weight="fill" />
        </span>
        <span>{t("install.domain.dnsVerified", { domain: fullDomain })}</span>
      </div>
    )
  }

  return (
    <div className="grid gap-3 rounded-lg bg-kumo-tint px-4 py-3">
      <div className="grid gap-1">
        <p className="font-medium">{t("install.domain.dnsSetupTitle")}</p>
        <p className="text-sm leading-snug text-kumo-subtle">
          {t("install.domain.dnsInstruction")}
        </p>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-lg bg-kumo-base px-3 py-2.5 ring ring-kumo-hairline">
        <span className="text-sm text-kumo-subtle">Type</span>
        <span className="text-sm text-kumo-subtle">Host / Name</span>
        <span className="text-sm text-kumo-subtle">Value (IP)</span>

        <span>
          <Badge variant="neutral">A</Badge>
        </span>
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate font-mono text-[0.9em]">{fullDomain}</span>
          <CopyButton
            label="Copy host name"
            copied={copied === "domain"}
            onClick={() => handleCopy(fullDomain)}
          />
        </span>
        <span className="flex items-center gap-1">
          {result?.expected_ip ? (
            <>
              <span className="font-mono text-[0.9em]">
                {result.expected_ip}
              </span>
              <CopyButton
                label={t("install.domain.copyIp")}
                copied={copied === "ip"}
                onClick={() => handleCopy(result.expected_ip ?? "", "ip")}
              />
            </>
          ) : (
            <span className="text-sm text-kumo-subtle">
              click Verify to load IP
            </span>
          )}
        </span>
      </div>

      {result?.expected_ip && (
        <DnsProviderGuide fullDomain={fullDomain} ip={result.expected_ip} />
      )}

      {result && !result.verified && (
        <div className="flex items-start gap-2 text-kumo-danger">
          <span className="flex h-lh shrink-0 items-center">
            <XCircleIcon aria-hidden="true" size={16} weight="fill" />
          </span>
          <div className="grid gap-0.5">
            <p>{t("install.domain.dnsNotPointing")}</p>
            {result.resolved_ip && (
              <p className="text-sm text-kumo-subtle">
                {t("install.domain.dnsResolvedTo", { ip: result.resolved_ip })}
              </p>
            )}
          </div>
        </div>
      )}

      <Button
        variant="secondary"
        onClick={handleVerify}
        disabled={checking || !subdomain}
        loading={checking}
      >
        {checking
          ? t("install.domain.verifying")
          : result && !result.verified
            ? t("install.domain.retryVerify")
            : t("install.domain.verifyDns")}
      </Button>
    </div>
  )
}
