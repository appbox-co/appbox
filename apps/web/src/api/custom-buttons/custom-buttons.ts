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
    fields: unknown[]
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

export async function triggerCustomButton(button: CustomButton): Promise<void> {
  const route = button.APIRoute
  switch (button.APIMethod?.toLowerCase()) {
    case "put":
      await apiPut(route)
      break
    case "get":
      await apiGet(route)
      break
    default:
      await apiPost(route)
  }
}
