import { motion, type HTMLMotionProps } from 'framer-motion'
import { type ReactNode } from 'react'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  hover?: boolean
}

export function Card({ children, hover = false, className = '', ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={`card ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
