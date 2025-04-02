import type { IntlMessages as Messages } from "./src/lib/opendocs/types/i18n"

declare global {
  type IntlMessages = Messages;
}
