/*
 * The sign-in pages' app wall, as data. Kept out of the wall's client module
 * so the server layouts that fill it can call it.
 */

/** What the wall needs of a catalogue app. */
export interface WallApp {
  name: string
  /** Icon file name in the catalogue. */
  icon: string
}

/** Operating systems and servers have distribution logos, not app icons. */
const NOT_APPS = new Set(["VPS", "OS Containers", "Operating System"])

/**
 * The catalogue's apps, as the wall shows them. The public catalogue names
 * categories; the signed-in one (and the sample fixtures) labels them.
 */
export function toWallApps(
  catalogue: readonly {
    display_name: string
    icon_image: string
    categories?: readonly (string | { label: string })[]
  }[]
): WallApp[] {
  return catalogue
    .filter(
      (app) =>
        !app.categories?.some((category) =>
          NOT_APPS.has(typeof category === "string" ? category : category.label)
        )
    )
    .map((app) => ({ name: app.display_name, icon: app.icon_image }))
}
