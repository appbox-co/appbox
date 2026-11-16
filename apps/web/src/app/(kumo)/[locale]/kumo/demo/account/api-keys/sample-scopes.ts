import type { ApiKeyScopeCatalog } from "@/api/account/account"

/**
 * The scope list as the API gave it on 16 November 2026 (\`GET
 * /v1/users/api-keys/scopes\`), so the sample page shows real names.
 */
export const SAMPLE_SCOPE_CATALOG: ApiKeyScopeCatalog = {
  groups: [
    {
      id: "catalog",
      label: "Catalog"
    },
    {
      id: "apps",
      label: "Apps"
    },
    {
      id: "custom_tables",
      label: "Custom tables"
    },
    {
      id: "custom_actions",
      label: "Custom actions"
    },
    {
      id: "domains",
      label: "Domains"
    }
  ],
  scopes: [
    {
      scope: "catalog:read",
      group: "catalog",
      label: "Read catalog",
      description: "List installable apps, their versions and install schemas.",
      high_risk: false
    },
    {
      scope: "apps:read",
      group: "apps",
      label: "Read apps",
      description: "List installed apps and read their details and status.",
      high_risk: false
    },
    {
      scope: "apps:install",
      group: "apps",
      label: "Install apps",
      description: "Install new app instances.",
      high_risk: false
    },
    {
      scope: "apps:update",
      group: "apps",
      label: "Update apps",
      description:
        "Change installed app settings, including attaching and detaching domains.",
      high_risk: false
    },
    {
      scope: "apps:uninstall",
      group: "apps",
      label: "Uninstall apps",
      description: "Uninstall app instances.",
      high_risk: true
    },
    {
      scope: "apps:lifecycle",
      group: "apps",
      label: "Control apps",
      description: "Start, stop, restart, freeze and unfreeze app instances.",
      high_risk: false
    },
    {
      scope: "apps:version",
      group: "apps",
      label: "Change app versions",
      description: "Upgrade, downgrade or switch app versions.",
      high_risk: false
    },
    {
      scope: "apps:boost",
      group: "apps",
      label: "Boost apps",
      description:
        "Change app boost slots. This can use more of your plan's resources.",
      high_risk: true
    },
    {
      scope: "custom_tables:read",
      group: "custom_tables",
      label: "Read custom tables",
      description: "Read app-provided tables such as mailboxes or users.",
      high_risk: false
    },
    {
      scope: "custom_tables:write",
      group: "custom_tables",
      label: "Write custom tables",
      description: "Add and edit rows in app-provided tables.",
      high_risk: false
    },
    {
      scope: "custom_tables:delete",
      group: "custom_tables",
      label: "Delete custom table rows",
      description: "Delete rows from app-provided tables.",
      high_risk: true
    },
    {
      scope: "custom_actions:read",
      group: "custom_actions",
      label: "Read custom actions",
      description: "List the actions an app exposes to the API.",
      high_risk: false
    },
    {
      scope: "custom_actions:execute",
      group: "custom_actions",
      label: "Run custom actions",
      description: "Run app actions that are exposed to the API.",
      high_risk: true
    },
    {
      scope: "domains:read",
      group: "domains",
      label: "Read domains",
      description: "List domains and the domains attached to apps.",
      high_risk: false
    },
    {
      scope: "domains:write",
      group: "domains",
      label: "Write domains",
      description: "Add domains and attach them to apps.",
      high_risk: false
    },
    {
      scope: "domains:delete",
      group: "domains",
      label: "Delete domains",
      description: "Remove domains and detach them from apps.",
      high_risk: true
    }
  ],
  presets: [
    {
      id: "read_only",
      label: "Read only",
      description: "Dashboards, audits and inventory tools.",
      scopes: ["catalog:read", "apps:read", "domains:read"],
      high_risk: false
    },
    {
      id: "deployment_automation",
      label: "Deployment automation",
      description:
        "CI/CD that installs, updates and restarts apps, without uninstall or domain access.",
      scopes: [
        "catalog:read",
        "apps:read",
        "apps:install",
        "apps:update",
        "apps:lifecycle",
        "apps:version"
      ],
      high_risk: false
    },
    {
      id: "full_app_management",
      label: "Full app management",
      description: "The whole app lifecycle, including uninstall and boost.",
      scopes: [
        "catalog:read",
        "apps:read",
        "apps:install",
        "apps:update",
        "apps:uninstall",
        "apps:lifecycle",
        "apps:version",
        "apps:boost"
      ],
      high_risk: true
    },
    {
      id: "app_extension_automation",
      label: "App extension automation",
      description:
        "High trust: read, write and delete custom table rows and run custom actions.",
      scopes: [
        "apps:read",
        "custom_tables:read",
        "custom_tables:write",
        "custom_tables:delete",
        "custom_actions:read",
        "custom_actions:execute"
      ],
      high_risk: true
    },
    {
      id: "domain_automation",
      label: "Domain automation",
      description: "Read and add domains, without app or delete access.",
      scopes: ["domains:read", "domains:write"],
      high_risk: false
    },
    {
      id: "full_platform_automation",
      label: "Full platform automation",
      description:
        "Every scope. Still cannot manage API keys, security, users or billing.",
      scopes: [
        "catalog:read",
        "apps:read",
        "apps:install",
        "apps:update",
        "apps:uninstall",
        "apps:lifecycle",
        "apps:version",
        "apps:boost",
        "custom_tables:read",
        "custom_tables:write",
        "custom_tables:delete",
        "custom_actions:read",
        "custom_actions:execute",
        "domains:read",
        "domains:write",
        "domains:delete"
      ],
      high_risk: true
    }
  ]
}
