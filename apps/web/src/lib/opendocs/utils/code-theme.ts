import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import type {
  CodeTheme,
  CodeThemeLanguage,
  LocalCodeThemes,
} from "@/lib/opendocs/types/code-theme"
import { createHighlighter } from "shiki"
import { codeThemeConfig, localCodeThemes } from "../../../config/code-theme"
import { toKebabCase } from "./to-kebab-case"

const localThemes = codeThemeConfig.localThemes

export function getContentLayerCodeTheme() {
  const themeName = codeThemeConfig.theme

  if (localCodeThemes.includes(themeName as LocalCodeThemes[number])) {
    return JSON.parse(
      readFileSync(
        resolve(
          `./src/styles/themes/syntax-highlight/${toKebabCase(themeName)}.json`
        ),
        "utf-8"
      )
    )
  }

  return codeThemeConfig.theme
}

export async function highlightServerCode(
  code: string,
  theme: CodeTheme = codeThemeConfig.theme,
  language: CodeThemeLanguage = "typescript"
) {
  const [path, fs] = await Promise.all([
    import("node:path"),
    import("node:fs/promises"),
  ])

  const highlighter = await createHighlighter({
    langs: codeThemeConfig.languages,
    themes: [theme].filter(
      (theme) => !localThemes.includes(theme as LocalCodeThemes[number])
    ),
  })

  const isLocalTheme = localThemes.includes(theme as LocalCodeThemes[number])

  if (isLocalTheme) {
    try {
      const editorTheme = await fs.readFile(
        path.resolve(
          process.cwd(),
          `src/styles/themes/syntax-highlight/${toKebabCase(theme)}.json`
        ),
        "utf-8"
      )

      await highlighter.loadTheme(JSON.parse(editorTheme))
    } catch {
      throw new Error(`Failed to load theme: ${theme}`)
    }
  }

  const html = highlighter.codeToHtml(code, {
    lang: language,
    theme,
    structure: "inline",
  })

  return html
}
