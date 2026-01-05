// Promo Theme Configuration
// Change this to switch between promotional themes

export type PromoTheme = "black-friday" | "holiday" | "january-sale"

// ============================================
// ✨ CHANGE THIS TO SWITCH THEMES ✨
// ============================================
export const CURRENT_PROMO_THEME: PromoTheme = "january-sale"
// ============================================

export const promoThemes = {
  "black-friday": {
    // Text
    title: "Black Friday",
    emoji: "🛒",
    // Colors
    gradientFrom: "#DC2626",
    gradientTo: "#F43F5E",
    textColor: "text-red-600 dark:text-white/90",
    badgeBg: "bg-red-500/10 dark:bg-white/10",
    badgeBorder: "border-red-500/20 dark:border-white/20",
    badgeText: "text-red-600 dark:text-white",
    // Light mode background
    lightBgFrom: "from-rose-50",
    lightBgVia: "via-white",
    lightBgTo: "to-red-50",
    // Icon colors
    iconColor: "text-red-500 dark:text-white",
    sparkleColor: "bg-red-500 dark:bg-white"
  },
  holiday: {
    // Text
    title: "Holiday Sale",
    emoji: "🎄",
    // Colors - festive green and red
    gradientFrom: "#16A34A",
    gradientTo: "#DC2626",
    textColor: "text-green-600 dark:text-white/90",
    badgeBg: "bg-green-500/10 dark:bg-white/10",
    badgeBorder: "border-green-500/20 dark:border-white/20",
    badgeText: "text-green-700 dark:text-white",
    // Light mode background - festive green tint
    lightBgFrom: "from-green-50",
    lightBgVia: "via-white",
    lightBgTo: "to-red-50",
    // Icon colors
    iconColor: "text-green-600 dark:text-white",
    sparkleColor: "bg-green-500 dark:bg-white"
  },
  "january-sale": {
    // Text
    title: "January Sale",
    emoji: "✨",
    // Colors - elegant gold and white
    gradientFrom: "#D4AF37",
    gradientTo: "#F5E6A3",
    textColor: "text-amber-700 dark:text-amber-300",
    badgeBg: "bg-amber-500/10 dark:bg-amber-400/10",
    badgeBorder: "border-amber-500/20 dark:border-amber-400/20",
    badgeText: "text-amber-700 dark:text-amber-300",
    // Light mode background - warm gold tint
    lightBgFrom: "from-amber-50",
    lightBgVia: "via-white",
    lightBgTo: "to-yellow-50",
    // Icon colors
    iconColor: "text-amber-600 dark:text-amber-400",
    sparkleColor: "bg-amber-500 dark:bg-amber-300"
  }
} as const

export function getPromoTheme() {
  return promoThemes[CURRENT_PROMO_THEME]
}
