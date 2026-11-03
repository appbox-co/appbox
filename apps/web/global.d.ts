// next-env.d.ts is gitignored, so CI typechecks without it.
/// <reference types="next/image-types/global" />

import type { IntlMessages as Messages } from "./src/lib/opendocs/types/i18n"

declare global {
  type IntlMessages = Messages
}
