import { apiGet, apiPost, apiPut } from "@/api/client"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CustomButton {
  id: number
  label: string
  icon: string
  iconColor: string
  /** HTTP method the backend expects: "get" for simple buttons, "put" when fields are required */
  APIMethod: "get" | "put" | "post"
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
      {
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
  switch (button.APIMethod?.toLowerCase()) {
    case "put":
      await apiPut(route, hasPayload ? payload : undefined)
      break
    case "get":
      if (hasPayload) {
        const params = Object.fromEntries(
          Object.entries(payload).map(([key, value]) => [key, String(value)])
        )
        await apiGet(route, { params })
      } else {
        await apiGet(route)
      }
      break
    default:
      await apiPost(route, hasPayload ? payload : undefined)
  }
}
