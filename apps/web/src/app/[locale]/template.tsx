'use client'

import { motion } from 'framer-motion'

import type { ComponentProps } from 'react'

import { useMounted } from '@/lib/opendocs/hooks/use-mounted'

export default function Template({ children }: ComponentProps<'div'>) {
  const isMounted = useMounted()

  if (!isMounted) {
    return <>{children}</>
  }

  // Return the children without any animation effects
  return <>{children}</>

  // Or if you want to keep the motion.div for potential future use, but disable animations:
  /*
  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0 }}
    >
      {children}
    </motion.div>
  )
  */
}
