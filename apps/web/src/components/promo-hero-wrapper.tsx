"use client"

import { ReactNode } from "react"

interface PromoHeroWrapperProps {
  children: ReactNode
  hasPromo: boolean
  gradientFrom?: string
  gradientTo?: string
}

export function PromoHeroWrapper({
  children,
  hasPromo,
  gradientFrom = "#DC2626",
  gradientTo = "#F43F5E"
}: PromoHeroWrapperProps) {
  return (
    <div className="relative mb-12 mt-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animations */}
      {hasPromo && (
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
      )}

      {/* Gradient overlay - conditional based on promo */}
      {hasPromo && (
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${gradientFrom}40 0%, transparent 70%)`
          }}
        />
      )}

      {/* Floating decorative elements - only show if promo active */}
      {hasPromo && (
        <>
          {/* Floating icons */}
          <div
            className="absolute top-[15%] left-[10%] animate-float opacity-20"
            style={{ animationDelay: "0s", animationDuration: "3s" }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="text-white"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            className="absolute top-[20%] right-[15%] animate-float opacity-20"
            style={{ animationDelay: "0.5s", animationDuration: "3.5s" }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="text-white"
            >
              <path
                d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="7"
                y1="7"
                x2="7.01"
                y2="7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            className="absolute bottom-[20%] left-[12%] animate-float opacity-20"
            style={{ animationDelay: "1s", animationDuration: "4s" }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="text-white"
            >
              <polyline
                points="20 12 20 22 4 22 4 12"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="2"
                y="7"
                width="20"
                height="5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            className="absolute bottom-[25%] right-[10%] animate-float opacity-20"
            style={{ animationDelay: "1.5s", animationDuration: "3.2s" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="text-white"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Sparkles */}
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
              className="absolute animate-pulse opacity-60"
              style={{ ...sparkle, animationDelay: `${sparkle.delay}s` }}
            >
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
          ))}

          {/* Gradient orbs */}
          <div
            className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
            style={{
              background: `radial-gradient(circle, ${gradientFrom} 0%, transparent 70%)`
            }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
            style={{
              background: `radial-gradient(circle, ${gradientTo} 0%, transparent 70%)`,
              animationDelay: "1s"
            }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 px-6 py-8 md:px-12 md:py-12 lg:py-14">
        {children}
      </div>

      {/* Bottom gradient line - only if promo active */}
      {hasPromo && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${gradientFrom}, ${gradientTo}, transparent)`
          }}
        />
      )}
    </div>
  )
}
