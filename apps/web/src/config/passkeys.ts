// Passkeys feature gate: signing in with a passkey, and the passkeys panel on
// the two-factor page (Kumo only).
//
// On where the API has the passkey endpoints from appbox-co/cylo-api#221:
// staging, whose builds set NEXT_PUBLIC_DOMAIN to appbox.foo, and any build
// with NEXT_PUBLIC_PASSKEYS=on (to try them against another API that has
// them). Off everywhere else, production included.
//
// Remove this gate, and the checks on it, once that API and its migration
// are deployed to production.
const STAGING_DOMAIN = "appbox.foo"

export const passkeysEnabled =
  process.env.NEXT_PUBLIC_PASSKEYS === "on" ||
  process.env.NEXT_PUBLIC_DOMAIN === STAGING_DOMAIN
