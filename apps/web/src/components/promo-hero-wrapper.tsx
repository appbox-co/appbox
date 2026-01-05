"use client"

import { ReactNode } from "react"
import {
  CURRENT_PROMO_THEME,
  getPromoTheme,
  type PromoTheme
} from "@/config/promo-theme"

interface PromoHeroWrapperProps {
  children: ReactNode
  hasPromo: boolean
  gradientFrom?: string
  gradientTo?: string
  theme?: PromoTheme
}

// Christmas tree SVG for holiday theme
function ChristmasTree({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l-4 6h2l-3 5h2l-4 7h14l-4-7h2l-3-5h2l-4-6z" />
      <rect x="10" y="21" width="4" height="2" />
    </svg>
  )
}

// Gift box SVG
function GiftBox({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  )
}

// Star SVG
function Star({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export function PromoHeroWrapper({
  children,
  hasPromo,
  gradientFrom,
  gradientTo,
  theme = CURRENT_PROMO_THEME
}: PromoHeroWrapperProps) {
  const themeConfig = getPromoTheme()
  const effectiveGradientFrom = gradientFrom || themeConfig.gradientFrom
  const effectiveGradientTo = gradientTo || themeConfig.gradientTo
  const isHoliday = theme === "holiday"
  const isJanuarySale = theme === "january-sale"

  // If no promo, just render children without any wrapper styling
  if (!hasPromo) {
    return <div className="relative">{children}</div>
  }

  return (
    <div
      className={`relative mb-12 mt-8 overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-gradient-to-br ${themeConfig.lightBgFrom} ${themeConfig.lightBgVia} ${themeConfig.lightBgTo} dark:from-slate-900 dark:via-slate-800 dark:to-slate-900`}
    >
      {/* Animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 opacity-10 dark:opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${effectiveGradientFrom}10 0%, transparent 70%)`
        }}
      />

      {/* Theme-specific floating decorative elements */}
      <>
        {isHoliday ? (
          <>
            {/* Holiday: Christmas trees */}
            <div
              className="absolute top-[20%] left-[10%] animate-float opacity-15 dark:opacity-25"
              style={{ animationDelay: "0s", animationDuration: "4s" }}
            >
              <ChristmasTree className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <div
              className="absolute bottom-[25%] right-[12%] animate-float opacity-15 dark:opacity-25"
              style={{ animationDelay: "1.5s", animationDuration: "3.5s" }}
            >
              <ChristmasTree className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            {/* Holiday: Gift boxes */}
            <div
              className="absolute bottom-[20%] left-[15%] animate-float opacity-15 dark:opacity-25"
              style={{ animationDelay: "0.5s", animationDuration: "3s" }}
            >
              <GiftBox className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
            <div
              className="absolute top-[25%] right-[10%] animate-float opacity-15 dark:opacity-25"
              style={{ animationDelay: "2s", animationDuration: "4s" }}
            >
              <GiftBox className="w-10 h-10 text-red-500 dark:text-red-400" />
            </div>

            {/* Holiday: Stars */}
            <div
              className="absolute top-[15%] right-[25%] animate-float opacity-20 dark:opacity-30"
              style={{ animationDelay: "1s", animationDuration: "3s" }}
            >
              <Star className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
            </div>
            <div
              className="absolute bottom-[30%] left-[30%] animate-float opacity-15 dark:opacity-25"
              style={{ animationDelay: "2.5s", animationDuration: "3.5s" }}
            >
              <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            </div>
          </>
        ) : isJanuarySale ? (
          <>
            {/* January Sale: Gold stars and sparkles */}
            <div
              className="absolute top-[15%] left-[10%] animate-float opacity-15 dark:opacity-25"
              style={{ animationDelay: "0s", animationDuration: "3s" }}
            >
              <Star className="w-8 h-8 text-amber-500 dark:text-amber-400" />
            </div>
            <div
              className="absolute top-[20%] right-[15%] animate-float opacity-15 dark:opacity-25"
              style={{ animationDelay: "0.5s", animationDuration: "3.5s" }}
            >
              <Star className="w-10 h-10 text-amber-600 dark:text-amber-300" />
            </div>
            <div
              className="absolute bottom-[20%] left-[12%] animate-float opacity-15 dark:opacity-25"
              style={{ animationDelay: "1s", animationDuration: "4s" }}
            >
              <Star className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
            </div>
            <div
              className="absolute bottom-[25%] right-[10%] animate-float opacity-15 dark:opacity-25"
              style={{ animationDelay: "1.5s", animationDuration: "3.2s" }}
            >
              <Star className="w-9 h-9 text-amber-500 dark:text-amber-400" />
            </div>
            <div
              className="absolute top-[30%] left-[25%] animate-float opacity-10 dark:opacity-20"
              style={{ animationDelay: "2s", animationDuration: "3.8s" }}
            >
              <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div
              className="absolute bottom-[35%] right-[25%] animate-float opacity-10 dark:opacity-20"
              style={{ animationDelay: "2.5s", animationDuration: "3.3s" }}
            >
              <Star className="w-7 h-7 text-amber-400 dark:text-amber-300" />
            </div>
          </>
        ) : (
          <>
            {/* Black Friday: Stars and tags */}
            <div
              className="absolute top-[15%] left-[10%] animate-float opacity-10 dark:opacity-20"
              style={{ animationDelay: "0s", animationDuration: "3s" }}
            >
              <Star className="w-8 h-8 text-red-500 dark:text-white" />
            </div>
            <div
              className="absolute top-[20%] right-[15%] animate-float opacity-10 dark:opacity-20"
              style={{ animationDelay: "0.5s", animationDuration: "3.5s" }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-red-500 dark:text-white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <div
              className="absolute bottom-[20%] left-[12%] animate-float opacity-10 dark:opacity-20"
              style={{ animationDelay: "1s", animationDuration: "4s" }}
            >
              <GiftBox className="w-10 h-10 text-red-500 dark:text-white" />
            </div>
            <div
              className="absolute bottom-[25%] right-[10%] animate-float opacity-10 dark:opacity-20"
              style={{ animationDelay: "1.5s", animationDuration: "3.2s" }}
            >
              <Star className="w-7 h-7 text-red-500 dark:text-white" />
            </div>
          </>
        )}

        {/* Sparkles (both themes) */}
        {[
          { delay: 0, top: "30%", left: "20%" },
          { delay: 0.3, top: "60%", left: "25%" },
          { delay: 0.6, top: "40%", right: "30%" },
          { delay: 0.9, bottom: "40%", right: "20%" },
          { delay: 1.2, top: "70%", left: "40%" },
          { delay: 1.5, top: "50%", right: "40%" }
        ].map((sparkle, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-30 dark:opacity-60"
            style={{ ...sparkle, animationDelay: `${sparkle.delay}s` }}
          >
            <div
              className={`w-1 h-1 rounded-full ${themeConfig.sparkleColor}`}
            />
          </div>
        ))}

        {/* Gradient orbs - positioned diagonally to avoid center logo */}
        <div
          className="absolute top-10 left-[10%] w-96 h-96 rounded-full blur-3xl opacity-[0.02] dark:opacity-[0.06] animate-pulse"
          style={{
            background: `radial-gradient(circle, ${effectiveGradientFrom} 0%, transparent 50%)`
          }}
        />
        <div
          className="absolute bottom-10 right-[10%] w-96 h-96 rounded-full blur-3xl opacity-[0.02] dark:opacity-[0.06] animate-pulse"
          style={{
            background: `radial-gradient(circle, ${effectiveGradientTo} 0%, transparent 50%)`,
            animationDelay: "1s"
          }}
        />
      </>

      {/* Content */}
      <div className="relative z-10 px-6 py-8 md:px-12 md:py-12 lg:py-14">
        {children}
      </div>

      {/* Bottom gradient line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${effectiveGradientFrom}, ${effectiveGradientTo}, transparent)`
        }}
      />
    </div>
  )
}
