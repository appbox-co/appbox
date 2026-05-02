export const queryKeys = {
  apps: {
    all: ["apps"] as const,
    detail: (id: number, versionId?: number) =>
      ["apps", id, "detail", versionId ?? "default"] as const,
    boostInfo: (id: number, cyloId: number) =>
      ["apps", id, "boost-info", cyloId] as const,
    detailByName: (name: string) => ["apps", "name", name] as const,
    versions: (appId: number) => ["apps", appId, "versions"] as const,
    featured: ["apps", "featured"] as const,
    top: ["apps", "top"] as const,
    new: ["apps", "new"] as const,
    recentlyUpdated: ["apps", "recently-updated"] as const,
    search: (filters: Record<string, unknown>) =>
      ["apps", "search", filters] as const,
    categories: ["apps", "categories"] as const
  },
  cylos: {
    all: ["cylos"] as const,
    detail: (id: number) => ["cylos", id] as const,
    stats: (id: number) => ["cylos", id, "stats"] as const,
    quota: (id: number) => ["cylos", id, "quota"] as const,
    bandwidth: (id: number) => ["cylos", id, "bandwidth"] as const,
    summary: (userId: number) => ["cylos", "summary", userId] as const
  },
  installedApps: {
    all: ["installedApps"] as const,
    detail: (id: number) => ["installedApps", id] as const,
    byCylo: (cyloId: number) => ["installedApps", "cylo", cyloId] as const,
    containerStats: (id: number) => ["installedApps", id, "stats"] as const,
    ports: (id: number) => ["installedApps", id, "ports"] as const,
    vnc: (id: number) => ["installedApps", id, "vnc"] as const
  },
  notifications: {
    all: ["notifications"] as const,
    unread: ["notifications", "unread"] as const
  },
  domains: {
    all: ["domains"] as const,
    byCylo: (cyloId: number) => ["domains", "cylo", cyloId] as const,
    byInstance: (instanceId: number) =>
      ["domains", "instance", instanceId] as const
  },
  pinnedApps: {
    byCylo: (cyloId: number) => ["pinnedApps", "cylo", cyloId] as const
  },
  comments: {
    byAppPrefix: (appId: number) => ["comments", "app", appId] as const,
    byApp: (appId: number, sortOrder = "rating") =>
      ["comments", "app", appId, sortOrder] as const,
    byTypeResource: (type: string, relId: number) =>
      ["comments", "type", type, relId] as const,
    byTypePrefix: (type: string, relId: number, token?: string) =>
      ["comments", "type", type, relId, token ?? null] as const,
    byType: (
      type: string,
      relId: number,
      token?: string,
      sortOrder = "rating"
    ) => ["comments", "type", type, relId, token ?? null, sortOrder] as const
  },
  profile: {
    me: ["profile", "me"] as const
  },
  abuseReports: {
    all: ["abuseReports"] as const,
    detail: (id: number) => ["abuseReports", id] as const
  },
  plans: {
    all: ["plans"] as const
  },
  blogPosts: {
    all: ["blogPosts"] as const,
    recent: (limit: number, locale: string) =>
      ["blogPosts", "recent", locale, limit] as const
  },
  migration: {
    status: (cyloId: number) => ["migration", cyloId] as const
  },
  jobs: {
    detail: (jobId: number) => ["jobs", jobId] as const,
    byInstance: (instanceId: number) =>
      ["jobs", "instance", instanceId] as const
  },
  customButtons: {
    byInstance: (instanceId: number) => ["customButtons", instanceId] as const
  },
  customTables: {
    byInstance: (instanceId: number) =>
      ["customTables", "instance", instanceId] as const,
    rows: (instanceId: number, tableId: number) =>
      [
        "customTables",
        "instance",
        instanceId,
        "table",
        tableId,
        "rows"
      ] as const
  },
  files: {
    info: (cyloId: number, fileId: string) =>
      ["files", cyloId, "info", fileId] as const,
    children: (cyloId: number, dirId: string) =>
      ["files", cyloId, "children", dirId] as const
  }
} as const
