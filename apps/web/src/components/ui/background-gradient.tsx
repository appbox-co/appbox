import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import * as React from "react";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
}: {
  children?: React.ReactNode
  className?: string
  containerClassName?: string
}) => {
  const variants = {
    initial: { backgroundPosition: "0% 50%" },
    animate: {
      backgroundPosition: ["0% 50%", "100% 50%"],
    },
  }
  return (
    <div className={cn("group relative p-[4px]", containerClassName)}>
      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        style={{
          backgroundSize: "200% 100%",
        }}
        className={cn(
          "absolute inset-0 z-1 rounded-lg opacity-60 blur-xl transition  duration-500 will-change-transform group-hover:opacity-100",
          " bg-[radial-gradient(circle_farthest-side_at_0_100%,#00ccb1,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7b61ff,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#1ca0fb,#141316)]"
        )}
      />
      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        style={{
          backgroundSize: "200% 100%",
        }}
        className={cn(
          "absolute inset-0 z-1 rounded-lg will-change-transform",
          "bg-[radial-gradient(circle_farthest-side_at_0_100%,#00ccb1,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7b61ff,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#1ca0fb,#141316)]"
        )}
      />

      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  )
}
