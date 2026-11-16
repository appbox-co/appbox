"use client"

import { AppShell } from "../_components/app-shell"
import { HomeView } from "../_components/home-view"
import { buildSearchGroups } from "../_components/quick-search"
import {
  appsByCylo,
  blogPosts,
  cylos,
  demoUser,
  newestApps,
  notifications,
  recentlyUpdated
} from "./fixtures"

export function DemoHome() {
  return (
    <AppShell
      demo
      width="narrow"
      user={demoUser}
      search={buildSearchGroups(cylos, appsByCylo, true)}
    >
      <HomeView
        userName={demoUser.name}
        showTwoFactorPrompt
        services={{ status: "ready", data: cylos }}
        apps={{ status: "ready", data: appsByCylo }}
        notifications={{ status: "ready", data: notifications }}
        newestApps={{ status: "ready", data: newestApps }}
        recentlyUpdated={{ status: "ready", data: recentlyUpdated }}
        blogPosts={{ status: "ready", data: blogPosts }}
      />
    </AppShell>
  )
}
