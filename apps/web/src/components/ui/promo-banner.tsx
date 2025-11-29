"use client"

import { useEffect, useState } from "react"
import { Gift, LucideIcon, Sparkles, Tag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PromoBannerData {
  active: boolean
  promo_code: string
  title: string
  description: string
  discount_percentage: number
  badge_text: string
  cta_text?: string
  cta_link?: string
  background_gradient?: {
    from: string
    to: string
  }
}

interface PromoBannerProps {
  promo: PromoBannerData | null
  onDismiss?: () => void
}

// Floating icon component
function FloatingIcon({
  Icon,
  delay = 0,
  duration = 3,
  size = 40,
  className = ""
}: {
  Icon: LucideIcon
  delay?: number
  duration?: number
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn("absolute animate-float opacity-20", className)}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }}
    >
      <Icon size={size} className="text-white" />
    </div>
  )
}

// Sparkle component
function Sparkle({
  delay = 0,
  className = ""
}: {
  delay?: number
  className?: string
}) {
  return (
    <div
      className={cn("absolute animate-pulse opacity-60", className)}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-1 h-1 bg-white rounded-full" />
    </div>
  )
}

export function PromoBanner({ promo, onDismiss }: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const dismissed = sessionStorage.getItem("promo-banner-dismissed")
    if (dismissed === "true") {
      setIsVisible(false)
    }
  }, [])

  if (!promo || !promo.active || !isVisible || !isMounted) {
    return null
  }

  const handleDismiss = () => {
    setIsVisible(false)
    sessionStorage.setItem("promo-banner-dismissed", "true")
    onDismiss?.()
  }

  const scrollToPlans = () => {
    const plansSection = document.getElementById("plans-section")
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const gradient = promo.background_gradient || {
    from: "#DC2626",
    to: "#F43F5E"
  }

  return (
    <div className="relative w-full mb-12 overflow-hidden">
      {/* Add custom animations */}
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
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-30px) translateX(10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
      `}</style>

      <div
        className={cn(
          "relative rounded-3xl overflow-hidden",
          "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
          "border border-white/10"
        )}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${gradient.from}40 0%, transparent 70%)`
          }}
        />

        {/* Floating decorative elements */}
        <FloatingIcon
          Icon={Sparkles}
          className="top-[15%] left-[10%]"
          delay={0}
          duration={3}
          size={32}
        />
        <FloatingIcon
          Icon={Tag}
          className="top-[20%] right-[15%]"
          delay={0.5}
          duration={3.5}
          size={36}
        />
        <FloatingIcon
          Icon={Gift}
          className="bottom-[20%] left-[12%]"
          delay={1}
          duration={4}
          size={40}
        />
        <FloatingIcon
          Icon={Sparkles}
          className="bottom-[25%] right-[10%]"
          delay={1.5}
          duration={3.2}
          size={28}
        />

        {/* Sparkles */}
        <Sparkle delay={0} className="top-[30%] left-[20%]" />
        <Sparkle delay={0.3} className="top-[60%] left-[25%]" />
        <Sparkle delay={0.6} className="top-[40%] right-[30%]" />
        <Sparkle delay={0.9} className="bottom-[40%] right-[20%]" />
        <Sparkle delay={1.2} className="top-[70%] left-[40%]" />
        <Sparkle delay={1.5} className="top-[50%] right-[40%]" />

        {/* Gradient orbs */}
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${gradient.from} 0%, transparent 70%)`
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${gradient.to} 0%, transparent 70%)`,
            animationDelay: "1s"
          }}
        />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 backdrop-blur-sm"
          aria-label="Dismiss promotion"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="relative z-10 px-6 py-12 md:px-12 md:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center justify-center">
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-1.5 rounded-full",
                  "bg-gradient-to-r backdrop-blur-md",
                  "border border-white/20 shadow-lg"
                )}
                style={{
                  background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
                }}
              >
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  {promo.badge_text}
                </span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              {promo.title}
            </h2>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              {promo.description}
            </p>

            {/* Promo Code */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <span className="text-sm text-white/60 font-medium">
                Use code
              </span>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                <span className="text-lg font-bold font-mono text-white tracking-wider">
                  {promo.promo_code}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4">
              <Button
                onClick={scrollToPlans}
                size="lg"
                className={cn(
                  "text-lg px-8 py-6 rounded-full font-semibold",
                  "bg-white text-slate-900 hover:bg-white/90",
                  "shadow-2xl hover:shadow-white/20 hover:scale-105",
                  "transition-all duration-300"
                )}
              >
                {promo.cta_text || "View Plans"}
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom gradient line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${gradient.from}, ${gradient.to}, transparent)`
          }}
        />
      </div>
    </div>
  )
}
