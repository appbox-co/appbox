"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { CtaBlock as CtaBlockType } from "@/types/marketing-blocks"

interface CtaBlockProps {
  block: CtaBlockType
  appId: number
}

export function CtaBlock({ block, appId }: CtaBlockProps) {
  const variant = block.variant || "primary"
  const isDeployLink =
    block.button_url.startsWith("/appstore/app/") ||
    block.button_url.includes("/app/")
  const [deployOpen, setDeployOpen] = useState(false)
  const router = useRouter()
  const t = useTranslations("apps")

  return (
    <section className="py-16">
      <div className="group relative mx-auto max-w-3xl overflow-hidden rounded-2xl p-px">
        <div
          className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            backgroundSize: "200% 100%",
            backgroundImage:
              "radial-gradient(circle farthest-side at 0 100%,#00ccb1,transparent),radial-gradient(circle farthest-side at 100% 0,#7b61ff,transparent),radial-gradient(circle farthest-side at 100% 100%,#ffc414,transparent),radial-gradient(circle farthest-side at 0 0,#1ca0fb,#141316)",
            animation: "gradient-shift 4s ease infinite"
          }}
        />

        <div className="bg-card relative rounded-[calc(1rem-1px)] p-8 text-center md:p-12">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {block.headline}
            </span>
          </h2>

          {block.description && (
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {block.description}
            </p>
          )}

          <div className="mt-8">
            {isDeployLink ? (
              <Button
                size="lg"
                variant={variant === "outline" ? "outline" : "default"}
                className="px-8 text-base font-semibold"
                onClick={() => setDeployOpen(true)}
              >
                {block.button_text}
              </Button>
            ) : (
              <Link
                href={block.button_url}
                className={cn(
                  buttonVariants({
                    size: "lg",
                    variant: variant === "outline" ? "outline" : "default"
                  }),
                  "px-8 text-base font-semibold"
                )}
              >
                {block.button_text}
              </Link>
            )}
          </div>
        </div>
      </div>

      <Dialog open={deployOpen} onOpenChange={setDeployOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("detail.deploy_dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("detail.deploy_dialog.question")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                router.push("/#plans-section")
                setDeployOpen(false)
              }}
            >
              {t("detail.deploy_dialog.no")}
            </Button>
            <Button
              onClick={() => {
                window.location.href = `/appstore/app/${appId}`
                setDeployOpen(false)
              }}
            >
              {t("detail.deploy_dialog.yes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </section>
  )
}
