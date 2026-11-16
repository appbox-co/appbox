import type {
  CustomTableDefinition,
  CustomTableMutation,
  CustomTableRow
} from "@/api/custom-tables/custom-tables"
import type { SampleHandler } from "./types"

/**
 * Sample answers for an installed app's custom data tables: every instance has
 * a "Users" and a "Shares" table.
 *
 * - Users can be tried in full (add, edit, delete, reveal a password); the
 *   guard refuses the writes. It has one failed change in its history.
 * - Shares shows the waiting states: one row is being updated and one new row
 *   could not be confirmed, so adding and editing are held back, as they would
 *   be on a real table. Its two row actions open their confirmation dialogs.
 */

const USERS_TABLE = 41
const SHARES_TABLE = 42

/** The field id by which the reveal request names the password column. */
const USERS_PASSWORD_FIELD = 4102

function tables(instanceId: number): CustomTableDefinition[] {
  return [
    {
      label: "Users",
      typeOf: "users",
      description: "People who can sign in to this app.",
      maxRowShowAddButton: 10,
      APIRoute: `tables/${USERS_TABLE}/data/${instanceId}`,
      columnOrder: [
        "name:value",
        "password:value",
        "role:value",
        "quota:value",
        "enabled:value"
      ],
      columns: [
        {
          name: "name:value",
          fieldId: 4101,
          title: "Username",
          inputField: {
            type: "alphaNumeric",
            validate: ["required", "alphanumeric"]
          }
        },
        {
          name: "password:value",
          fieldId: USERS_PASSWORD_FIELD,
          title: "Password",
          type: "complexPassword",
          sensitive: true,
          revealable: true,
          inputField: {
            type: "complexPassword",
            validate: ["required", "complexPassword"],
            params: { generatePassword: true, generatedPasswordLength: 20 }
          }
        },
        {
          name: "role:value",
          fieldId: 4103,
          title: "Role",
          inputField: {
            type: "selector",
            params: {
              menuItems: { admin: "Admin", editor: "Editor", viewer: "Viewer" }
            },
            defaultValue: "viewer"
          }
        },
        {
          // Admins have no quota, so the field shows for the other roles only.
          name: "quota:value",
          fieldId: 4104,
          title: "Quota (GB)",
          inputField: { type: "number", defaultValue: 50 },
          visibleWhen: {
            field: "role:value",
            operator: "notEquals",
            value: "admin"
          },
          clearWhenHidden: true
        },
        {
          name: "enabled:value",
          fieldId: 4105,
          title: "Status",
          type: "switch",
          inputField: { type: "switch", defaultValue: "1" }
        }
      ],
      enableAdding: true,
      enableEditing: true,
      enableDeleting: true,
      supportsRowMutations: true,
      editableFields: [
        "password:value",
        "role:value",
        "quota:value",
        "enabled:value"
      ]
    },
    {
      label: "Shares",
      typeOf: "shares",
      APIRoute: `tables/${SHARES_TABLE}/data/${instanceId}`,
      columnOrder: [
        "name:value",
        "path:value",
        "access:value",
        "url:value",
        "active:value"
      ],
      columns: [
        {
          name: "name:value",
          fieldId: 4201,
          title: "Name",
          inputField: { type: "dynamicText", validate: ["required"] }
        },
        {
          name: "path:value",
          fieldId: 4202,
          title: "Folder",
          inputField: { type: "dynamicText", validate: ["required"] }
        },
        {
          name: "access:value",
          fieldId: 4203,
          title: "Access",
          inputField: {
            type: "selector",
            params: {
              menuItems: {
                "read-only": "Read only",
                "read-write": "Read and write"
              }
            },
            defaultValue: "read-only"
          }
        },
        {
          name: "url:value",
          fieldId: 4204,
          title: "Link",
          type: "clientURL"
        },
        {
          name: "active:value",
          fieldId: 4205,
          title: "Status",
          type: "IsEnabledCell",
          inputField: { type: "switch", defaultValue: "1" }
        }
      ],
      rowActions: [
        {
          name: "rotate_link",
          label: "New link",
          APIRoute: `tables/${SHARES_TABLE}/data/${instanceId}/{row.id}/rotate`,
          APIMethod: "post",
          dialogTitle: "Create a new link?",
          dialogText:
            "The current link stops working as soon as the new one is created."
        },
        {
          name: "wipe",
          label: "Wipe",
          APIRoute: `tables/${SHARES_TABLE}/data/${instanceId}/{row.id}/wipe`,
          APIMethod: "post",
          variant: "destructive",
          dialogTitle: "Wipe this share?",
          dialogText:
            "Every file in the shared folder is deleted. This cannot be undone.",
          confirmation: {
            type: "text",
            rowField: "name:value",
            payloadField: "confirm_name",
            placeholder: "Share name"
          }
        }
      ],
      enableAdding: true,
      enableEditing: true,
      enableDeleting: true,
      supportsRowMutations: true
    }
  ]
}

/* -------------------------------------------------------------------------- */
/*  Rows                                                                       */
/* -------------------------------------------------------------------------- */

// Secrets arrive redacted; the reveal request below returns them one at a time.
const USERS: CustomTableRow[] = [
  {
    id: 1,
    "name:value": "amara",
    "password:value": "[REDACTED]",
    "role:value": "admin",
    "quota:value": "",
    "enabled:value": "1"
  },
  {
    id: 2,
    "name:value": "bjorn",
    "password:value": "[REDACTED]",
    "role:value": "editor",
    "quota:value": 250,
    "enabled:value": "1"
  },
  {
    id: 3,
    "name:value": "chidi",
    "password:value": "[REDACTED]",
    "role:value": "editor",
    "quota:value": 100,
    "enabled:value": "0"
  },
  {
    id: 4,
    "name:value": "dalia",
    "password:value": "[REDACTED]",
    "role:value": "viewer",
    "quota:value": 50,
    "enabled:value": "1"
  },
  {
    id: 5,
    "name:value": "emeka",
    "password:value": "[REDACTED]",
    "role:value": "viewer",
    "quota:value": 50,
    "enabled:value": "1"
  },
  {
    // Invited but not yet set up: no password, so nothing to reveal.
    id: 6,
    "name:value": "guest2",
    "password:value": "",
    "role:value": "viewer",
    "quota:value": 10,
    "enabled:value": "0"
  }
]

const USER_PASSWORDS: Record<string, string> = {
  "1": "Harbor!Lantern42",
  "2": "quiet-Meadow_7Fox",
  "3": "Tin$Roof19rain",
  "4": "Maple+Stone88kite",
  "5": "9Blue*Heron-coast"
}

const SHARES: CustomTableRow[] = [
  {
    id: 11,
    "name:value": "family-photos",
    "path:value": "/photos/family",
    "access:value": "read-only",
    "url:value": "files.example.com/s/family-photos",
    "active:value": "1"
  },
  {
    id: 12,
    "name:value": "project-handover",
    "path:value": "/work/handover-2026",
    "access:value": "read-write",
    "url:value": "https://files.example.com/s/project-handover",
    "active:value": "1"
  },
  {
    id: 13,
    "name:value": "music",
    "path:value": "/media/music",
    "access:value": "read-only",
    "url:value": "files.example.com/s/music",
    "active:value": "0"
  },
  {
    id: 14,
    "name:value": "scans",
    "path:value": "/documents/scans",
    "access:value": "read-write",
    // Not published yet, so it has no link.
    "url:value": "",
    "active:value": "0"
  },
  {
    id: 15,
    "name:value": "backups",
    "path:value": "/backups/laptop",
    "access:value": "read-write",
    "url:value": "files.example.com/s/backups",
    "active:value": true
  }
]

/* -------------------------------------------------------------------------- */
/*  Changes in progress                                                        */
/* -------------------------------------------------------------------------- */

const USER_MUTATIONS: CustomTableMutation[] = [
  {
    id: 9001,
    executionId: "exec-users-9001",
    mutationType: "update",
    rowId: 3,
    status: "failed",
    canRetry: false,
    jobId: 77120,
    createdAt: "2026-11-11T09:14:02Z",
    updatedAt: "2026-11-11T09:14:31Z",
    completedAt: null,
    failedAt: "2026-11-11T09:14:31Z"
  }
]

const SHARE_MUTATIONS: CustomTableMutation[] = [
  {
    id: 9104,
    executionId: "exec-shares-9104",
    mutationType: "update",
    rowId: 12,
    status: "queued",
    canRetry: false,
    jobId: 77345,
    createdAt: "2026-11-13T15:02:10Z",
    updatedAt: "2026-11-13T15:02:11Z",
    completedAt: null,
    failedAt: null
  },
  {
    // A new row whose job could not be confirmed. It has no row to name yet.
    id: 9105,
    executionId: "exec-shares-9105",
    mutationType: "create",
    rowId: 16,
    status: "admission_pending",
    canRetry: true,
    jobId: null,
    createdAt: "2026-11-13T15:04:48Z",
    updatedAt: "2026-11-13T15:04:48Z",
    completedAt: null,
    failedAt: null
  }
]

/* -------------------------------------------------------------------------- */
/*  Handler                                                                    */
/* -------------------------------------------------------------------------- */

const SAMPLES: Record<
  number,
  { rows: CustomTableRow[]; mutations: CustomTableMutation[] }
> = {
  [USERS_TABLE]: { rows: USERS, mutations: USER_MUTATIONS },
  [SHARES_TABLE]: { rows: SHARES, mutations: SHARE_MUTATIONS }
}

export const customTablesSamples: SampleHandler = ({
  target,
  method,
  path
}) => {
  if (target !== "api" || method.toUpperCase() !== "GET") return undefined

  // GET tables/instance/{instanceId}: the app's table definitions.
  const definitions = path.match(/^tables\/instance\/(\d+)$/)
  if (definitions) return { customTables: tables(Number(definitions[1])) }

  // Everything else is about one table of one instance.
  const table = path.match(/^tables\/(\d+)\/data\/\d+(?:\/(.+))?$/)
  if (!table) return undefined
  const tableId = Number(table[1])
  const sample = SAMPLES[tableId]
  if (!sample) return undefined
  const rest = table[2]

  // GET tables/{tableId}/data/{instanceId}: the rows.
  if (rest === undefined) return { items: sample.rows }

  // GET …/mutations: row changes that are queued, unconfirmed or failed.
  if (rest === "mutations") return sample.mutations

  // GET …/{rowId}/field/{fieldId}/reveal: one secret in the clear.
  const reveal = rest.match(/^([^/]+)\/field\/(\d+)\/reveal$/)
  if (reveal) {
    const isPassword =
      tableId === USERS_TABLE && Number(reveal[2]) === USERS_PASSWORD_FIELD
    return { value: (isPassword && USER_PASSWORDS[reveal[1]]) || "" }
  }

  return undefined
}
