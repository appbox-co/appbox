import { demoInstalledApps } from "../../fixtures"
import type { SampleHandler } from "./types"

/**
 * Sample answers for the custom domains card of an installed app, in the raw
 * shapes `@/api/domains/domains` and `@/api/apps/app-store` read.
 *
 * A domain row carries no status of its own: a domain is only attached once
 * its DNS record has verified. What varies between the four samples is
 * therefore what the card can show for them: which one is primary, platform
 * or custom (the certificate notice in the configuration dialog), and how
 * much configuration each one has.
 */

const HOUR = 3_600_000
const DAY = 24 * HOUR
const LOADED_AT = Date.now()

/** The base domains the sample account owns, as the "parent domain" picker lists them. */
const BASE_DOMAINS = [
  { id: 501, domain: "example.com", type: "domain" },
  { id: 502, domain: "media.example.org", type: "domain" },
  { id: 503, domain: "example.net", type: "domain" }
]

type Snippets = "both" | "nginx" | "none"

interface SampleDomain {
  id: number
  domain: string
  fqdn: string
  parent: number
  domain_id: number
  is_initial: number | boolean
  created_at: string
  /** Not part of the row: what the configuration request answers for it. */
  snippets: Snippets
}

function sampleDomains(instanceId: number): SampleDomain[] {
  const install = demoInstalledApps.find((app) => app.id === instanceId)
  const platform = install?.domain || `app-${instanceId}.media-box.appbox.co`
  const slug = platform.split(".")[0]
  // The session gives each Appbox's own domain its Appbox's id.
  const appboxDomainId = install?.cylo_id ?? 1

  // Dates fall between the install and now, so they agree with the page.
  const installedAt = install
    ? new Date(install.install_date).getTime()
    : LOADED_AT - 400 * DAY
  const since = LOADED_AT - installedAt
  const at = (time: number) => new Date(time).toISOString()

  const row = (
    index: number,
    domain: string,
    parent: number,
    is_initial: number | boolean,
    created_at: string,
    snippets: Snippets
  ): SampleDomain => ({
    id: instanceId * 10 + index,
    domain,
    fqdn: domain,
    parent,
    domain_id: parent,
    is_initial,
    created_at,
    snippets
  })

  return [
    // The platform subdomain the app was installed with: primary, and covered
    // by the platform's wildcard certificate.
    row(1, platform, appboxDomainId, 1, at(installedAt), "both"),
    // A custom domain added soon after the install.
    row(2, `${slug}.example.com`, 501, 0, at(installedAt + since / 4), "both"),
    // Added a few hours ago: its certificate is still being issued, and only
    // one web server has a snippet so far.
    row(
      3,
      "watch.media.example.org",
      502,
      0,
      at(LOADED_AT - Math.min(3 * HOUR, since / 20)),
      "nginx"
    ),
    // Its configuration request comes back without snippets, which the card
    // reports as "not available". `false` rather than 0: the type allows both.
    row(
      4,
      `${slug}.example.net`,
      503,
      false,
      at(installedAt + since * 0.7),
      "none"
    )
  ]
}

function nginxSnippet(domain: string, pending: boolean) {
  return {
    file: `/etc/nginx/sites-available/${domain}.conf`,
    config: [
      "server {",
      "    listen 443 ssl http2;",
      "    listen [::]:443 ssl http2;",
      `    server_name ${domain};`,
      "",
      `    ssl_certificate     /etc/ssl/appbox/${domain}/fullchain.pem;`,
      `    ssl_certificate_key /etc/ssl/appbox/${domain}/privkey.pem;`,
      "",
      "    location / {",
      "        proxy_pass http://127.0.0.1:32400;",
      "        proxy_set_header Host $host;",
      "        proxy_set_header X-Real-IP $remote_addr;",
      "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
      "        proxy_set_header X-Forwarded-Proto $scheme;",
      "        proxy_http_version 1.1;",
      "        proxy_set_header Upgrade $http_upgrade;",
      '        proxy_set_header Connection "upgrade";',
      "    }",
      "}",
      "",
      "server {",
      "    listen 80;",
      "    listen [::]:80;",
      `    server_name ${domain};`,
      "    return 301 https://$host$request_uri;",
      "}"
    ].join("\n"),
    // One sample has no enable command, so the card falls back to this one.
    ...(pending
      ? {}
      : {
          enable_command: `ln -s /etc/nginx/sites-available/${domain}.conf /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx`
        }),
    reload_command: "nginx -t && systemctl reload nginx",
    notes: pending
      ? "The certificate files appear once HTTPS has been issued for this domain. Reload nginx after they do."
      : "Test the configuration before reloading. The certificate is renewed automatically."
  }
}

function apacheSnippet(domain: string) {
  return {
    file: `/etc/apache2/sites-available/${domain}.conf`,
    config: [
      "<VirtualHost *:443>",
      `    ServerName ${domain}`,
      "",
      "    SSLEngine on",
      `    SSLCertificateFile    /etc/ssl/appbox/${domain}/fullchain.pem`,
      `    SSLCertificateKeyFile /etc/ssl/appbox/${domain}/privkey.pem`,
      "",
      "    ProxyPreserveHost On",
      "    ProxyPass        / http://127.0.0.1:32400/",
      "    ProxyPassReverse / http://127.0.0.1:32400/",
      '    RequestHeader set X-Forwarded-Proto "https"',
      "</VirtualHost>",
      "",
      "<VirtualHost *:80>",
      `    ServerName ${domain}`,
      `    Redirect permanent / https://${domain}/`,
      "</VirtualHost>"
    ].join("\n"),
    enable_command: `a2enmod ssl proxy proxy_http headers && a2ensite ${domain}.conf && systemctl reload apache2`,
    reload_command: "apachectl configtest && systemctl reload apache2",
    notes: "Requires the ssl, proxy, proxy_http and headers modules."
  }
}

const isPlatformDomain = (domain: string) =>
  ["appboxes.co", "cylo.net", "appbox.co"].some((suffix) =>
    domain.endsWith(`.${suffix}`)
  )

function domainConfig(instanceId: number, domain: string) {
  const known = sampleDomains(instanceId).find((row) => row.domain === domain)
  const snippets = known?.snippets ?? "both"
  const base = { domain, is_custom_domain: !isPlatformDomain(domain) }
  if (snippets === "none") return base

  return {
    ...base,
    config_snippets: {
      nginx: nginxSnippet(domain, snippets === "nginx"),
      ...(snippets === "both" ? { apache: apacheSnippet(domain) } : {})
    }
  }
}

export const customDomainsSamples: SampleHandler = ({
  target,
  method,
  path
}) => {
  // The add dialog's two checks (is the name free, does its DNS record point
  // here) are POSTs, which the guard refuses before any handler is asked.
  if (target !== "api" || method !== "GET") return undefined

  if (path === "domains/app/install") return { items: BASE_DOMAINS }

  const config = path.match(/^domains\/instance\/(\d+)\/(.+)\/config$/)
  if (config) {
    return domainConfig(Number(config[1]), decodeURIComponent(config[2]))
  }

  const list = path.match(/^domains\/instance\/(\d+)$/)
  if (list) {
    return {
      items: sampleDomains(Number(list[1])).map(
        ({ snippets: _snippets, ...row }) => row
      )
    }
  }

  return undefined
}
