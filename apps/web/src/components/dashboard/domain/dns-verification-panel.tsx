"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  ShieldCheck,
  XCircle
} from "lucide-react"
import { checkSubdomainDns, type DnsCheckResult } from "@/api/apps/app-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DnsProvider {
  id: string
  name: string
  url: string
  steps: (host: string, ip: string) => string[]
}

const DNS_PROVIDERS: DnsProvider[] = [
  {
    id: "cloudflare",
    name: "Cloudflare",
    url: "https://dash.cloudflare.com",
    steps: (host, ip) => [
      `Log in to dash.cloudflare.com and select your domain.`,
      `Go to DNS -> Records -> Add record.`,
      `Set Type to A, Name to "${host}", IPv4 address to ${ip}.`,
      `Set Proxy status to "DNS only" (grey cloud) - not proxied.`,
      `Click Save.`
    ]
  },
  {
    id: "namecheap",
    name: "Namecheap",
    url: "https://namecheap.com",
    steps: (host, ip) => [
      `Log in to namecheap.com -> Domain List -> Manage your domain.`,
      `Click the Advanced DNS tab.`,
      `Under Host Records click Add New Record.`,
      `Set Type to A Record, Host to "${host}", Value to ${ip}, TTL to Automatic.`,
      `Click the green checkmark to save.`
    ]
  },
  {
    id: "godaddy",
    name: "GoDaddy",
    url: "https://godaddy.com",
    steps: (host, ip) => [
      `Log in to godaddy.com -> My Products -> DNS next to your domain.`,
      `Under DNS Records click Add.`,
      `Set Type to A, Name to "${host}", Value to ${ip}, TTL to 1 hour.`,
      `Click Save.`
    ]
  },
  {
    id: "squarespace",
    name: "Squarespace",
    url: "https://squarespace.com",
    steps: (host, ip) => [
      `Log in to account.squarespace.com -> Domains -> your domain.`,
      `Click DNS Settings -> Custom Records -> Add Record.`,
      `Set Type to A, Host to "${host}", Data to ${ip}.`,
      `Click Save.`
    ]
  },
  {
    id: "route53",
    name: "AWS Route 53",
    url: "https://console.aws.amazon.com/route53",
    steps: (host, ip) => [
      `Open the Route 53 console -> Hosted zones -> your domain.`,
      `Click Create record.`,
      `Set Record name to "${host}", Type to A, Value to ${ip}, TTL to 300.`,
      `Click Create records.`
    ]
  },
  {
    id: "digitalocean",
    name: "DigitalOcean",
    url: "https://cloud.digitalocean.com/networking/domains",
    steps: (host, ip) => [
      `Log in to DigitalOcean -> Networking -> Domains -> your domain.`,
      `Select A from the record type dropdown.`,
      `Set Hostname to "${host}", Will Direct To to ${ip}, TTL to 3600.`,
      `Click Create Record.`
    ]
  },
  {
    id: "other",
    name: "Other provider",
    url: "",
    steps: (host, ip) => [
      `Log in to your DNS provider control panel.`,
      `Find the DNS management section for your domain.`,
      `Create a new A record with Host/Name "${host}" pointing to ${ip}.`,
      `Set TTL to 300 or Automatic if available.`,
      `Save and click Verify DNS below.`
    ]
  }
]

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
  const [pickerOpen, setPickerOpen] = useState(false)

  const host =
    fullDomain.split(".").length > 2
      ? fullDomain.split(".").slice(0, -2).join(".")
      : "@"

  const steps = selectedProvider ? selectedProvider.steps(host, ip) : []

  return (
    <div className="rounded-md border border-dashed">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <span>Need help adding this record?</span>
        </span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t px-3 pb-3 pt-2 space-y-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
            >
              <span
                className={cn(!selectedProvider && "text-muted-foreground")}
              >
                {selectedProvider
                  ? selectedProvider.name
                  : "Select your DNS provider..."}
              </span>
              <ChevronDown
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform",
                  pickerOpen && "rotate-180"
                )}
              />
            </button>
            {pickerOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                {DNS_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(provider)
                      setPickerOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground first:rounded-t-md last:rounded-b-md"
                  >
                    <Check
                      className={cn(
                        "size-3.5 shrink-0",
                        selectedProvider?.id === provider.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {provider.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProvider && (
            <div className="space-y-2">
              <ol className="space-y-1.5">
                {steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-xs text-muted-foreground"
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              {selectedProvider.url && (
                <a
                  href={selectedProvider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Open {selectedProvider.name}
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
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
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
        <ShieldCheck className="size-4 shrink-0" />
        <span>{t("install.domain.dnsVerified", { domain: fullDomain })}</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <p className="text-sm font-medium text-foreground">
        {t("install.domain.dnsSetupTitle")}
      </p>

      <p className="text-xs text-muted-foreground">
        {t("install.domain.dnsInstruction")}
      </p>

      <div className="space-y-1.5">
        <div className="grid grid-cols-[auto_1fr_auto] gap-1.5 text-xs text-muted-foreground font-mono px-1">
          <span>Type</span>
          <span>Host / Name</span>
          <span>Value (IP)</span>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1.5 rounded-md border bg-background px-3 py-2 font-mono text-sm">
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
            A
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <span className="truncate font-medium">{fullDomain}</span>
            <button
              type="button"
              onClick={() => handleCopy(fullDomain)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              title="Copy host name"
            >
              {copied === "domain" ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </span>
          <span className="flex items-center gap-1.5">
            {result?.expected_ip ? (
              <>
                <span className="font-medium">{result.expected_ip}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(result.expected_ip ?? "", "ip")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={t("install.domain.copyIp")}
                >
                  {copied === "ip" ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              </>
            ) : (
              <span className="text-muted-foreground text-xs italic">
                click Verify to load IP
              </span>
            )}
          </span>
        </div>
      </div>

      {result?.expected_ip && (
        <DnsProviderGuide fullDomain={fullDomain} ip={result.expected_ip} />
      )}

      {result && !result.verified && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p>{t("install.domain.dnsNotPointing")}</p>
            {result.resolved_ip && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("install.domain.dnsResolvedTo", { ip: result.resolved_ip })}
              </p>
            )}
          </div>
        </div>
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleVerify}
        disabled={checking || !subdomain}
        className="w-full"
      >
        {checking ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            {t("install.domain.verifying")}
          </>
        ) : result && !result.verified ? (
          t("install.domain.retryVerify")
        ) : (
          t("install.domain.verifyDns")
        )}
      </Button>
    </div>
  )
}
