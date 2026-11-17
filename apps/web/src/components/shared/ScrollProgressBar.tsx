'use client'

import { motion, useScroll, useSpring } from 'motion/react'

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-400 via-primary to-blue-600 origin-left z-60 pointer-events-none"
      aria-hidden="true"
    />
  )
}
