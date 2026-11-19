import type { CustomButton } from "@/api/custom-buttons/custom-buttons"
import type { SampleHandler } from "./types"

/**
 * The buttons an app defines for itself, as `buttons/instance/{id}` lists
 * them. Three of them, one for each thing the dialog can ask for: nothing
 * beyond the standard "are you sure", a confirmation in the app's own words,
 * and a form.
 *
 * None of them uses the browser hand-off, which would open a new window.
 */
function sampleButtons(instanceId: number): CustomButton[] {
  const route = (buttonId: number) => `buttons/action/${buttonId}/${instanceId}`

  return [
    {
      id: 101,
      label: "Clear cache",
      icon: "cached",
      iconColor: "#0ea5e9",
      APIMethod: "put",
      APIRoute: route(101)
    },
    {
      id: 102,
      label: "Reset admin password",
      icon: "lock_reset",
      iconColor: "#f59e0b",
      APIMethod: "post",
      APIRoute: route(102),
      dialogTitle: "Reset the admin password?",
      dialogText:
        "A new password is generated and the current one stops working straight away. Anyone signed in as the admin is signed out."
    },
    {
      id: 103,
      label: "Add user",
      icon: "person_add",
      iconColor: "#22c55e",
      APIMethod: "post",
      APIRoute: route(103),
      dialogTitle: "Add a user",
      dialogText: "The new account can sign in to this app straight away.",
      inputForm: {
        typeOf: "button",
        inputFormId: 12,
        fields: {
          username: {
            label: "Username",
            type: "dynamicText",
            width: 12,
            validate: ["required", "alphanumeric", { minLength: 3 }]
          },
          password: {
            label: "Password",
            type: "complexPassword",
            width: 12,
            validate: ["required", "complexPassword", { minLength: 12 }],
            params: { generatePassword: true, generatedPasswordLength: 20 }
          },
          role: {
            label: "Role",
            type: "selector",
            width: 12,
            defaultValue: "user",
            validate: ["required"],
            params: {
              menuItems: {
                admin: "Administrator",
                user: "Standard user",
                guest: "Read only"
              }
            }
          },
          notify: {
            label: "Send a welcome email",
            type: "switch",
            width: 12,
            defaultValue: false
          },
          // Asked for only once the switch above is on.
          email: {
            label: "Email address",
            type: "email",
            width: 12,
            validate: ["required", "email"],
            conditions: [{ field: "notify", operator: "truthy" }],
            clearWhenHidden: true
          }
        }
      }
    }
  ]
}

/** Sample answers for the requests the installed app's actions make. */
export const actionsSamples: SampleHandler = ({ target, method, path }) => {
  if (target !== "api" || method.toUpperCase() !== "GET") return undefined

  const buttons = /^buttons\/instance\/(\d+)$/.exec(path)
  if (buttons) return { customButtons: sampleButtons(Number(buttons[1])) }

  return undefined
}
