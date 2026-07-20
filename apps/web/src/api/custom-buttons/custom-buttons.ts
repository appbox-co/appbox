import { apiGet, apiPost, apiPut } from "@/api/client"
import { idempotencyHeaders } from "@/api/idempotency"
import type { ConditionalFieldMetadata } from "@/lib/dynamic-form"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CustomButton {
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
    `buttons/instance/${instanceId}`
  )
  return res?.customButtons ?? []
}

export async function triggerCustomButton(
  button: CustomButton,
  payload?: Record<string, unknown>
): Promise<void> {
  const route = button.APIRoute
  const hasPayload = !!payload && Object.keys(payload).length > 0
  const options = {
    headers: idempotencyHeaders("custom_button.execute")
  }

  switch (button.APIMethod?.toLowerCase()) {
    case "put":
      await apiPut(route, hasPayload ? payload : undefined, options)
      break
    default:
      await apiPost(route, hasPayload ? payload : undefined, options)
  }
}
