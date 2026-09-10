import { apiGet, apiPost, apiPut } from "@/api/client"
import { idempotencyHeaders } from "@/api/idempotency"
import type { ConditionalFieldMetadata } from "@/lib/dynamic-form"
import {
  validateHandoffAdmission,
  type BrowserHandoffAdmission
} from "./browser-handoff"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CustomButton extends ConditionalFieldMetadata {
  id: number
  label: string
  icon: string
  iconColor: string
  /** Mutating HTTP method returned by the backend for button execution */
  APIMethod: "put" | "post"
  /** Relative API route: "buttons/action/{buttonId}/{instanceId}" */
  APIRoute: string
  dialogTitle?: string
  dialogText?: string
  routeOnSubmit?: string
  resultMode?: "browser_handoff"
  visibilityConditions?: ConditionalFieldMetadata["conditions"]
  /** Present when the button requires additional form fields before firing */
  inputForm?: {
    typeOf: string
    inputFormId: number
    fields: Record<
      string,
      ConditionalFieldMetadata & {
        label: string
        type: string
        width?: number
        defaultValue?: string | number | boolean
        validate?: (
          | string
          | {
              name?: string
              params?: Record<string, unknown>
              minLength?: number
              maxLength?: number
            }
        )[]
        params?: {
          menuItems?: Record<string, string>
          generatePassword?: boolean
          generatedPasswordLength?: number
          [key: string]: unknown
        }
      }
    >
  }
}

/* -------------------------------------------------------------------------- */
/*  API functions                                                              */
/* -------------------------------------------------------------------------- */

export async function getCustomButtons(
  instanceId: number
): Promise<CustomButton[]> {
  const res = await apiGet<{ customButtons: CustomButton[] }>(
    `buttons/instance/${instanceId}`,
    { params: { browserHandoff: "1" } }
  )
  return res?.customButtons ?? []
}

export async function triggerCustomButton(
  button: CustomButton,
  payload?: Record<string, unknown>
): Promise<BrowserHandoffAdmission | undefined> {
  const route = button.APIRoute
  const hasPayload = !!payload && Object.keys(payload).length > 0
  const options = {
    headers: idempotencyHeaders("custom_button.execute"),
    ...(button.resultMode === "browser_handoff"
      ? { params: { browserHandoff: "1" }, cache: "no-store" as const }
      : {})
  }
  let result: { browserHandoff?: unknown } | undefined
  switch (button.APIMethod?.toLowerCase()) {
    case "put":
      result = await apiPut(route, hasPayload ? payload : undefined, options)
      break
    default:
      result = await apiPost(route, hasPayload ? payload : undefined, options)
  }
  // Ordinary button results remain ignored as before.
  if (button.resultMode === "browser_handoff") {
    return validateHandoffAdmission(result?.browserHandoff, route)
  }
}
