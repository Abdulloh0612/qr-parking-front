import { motion } from 'framer-motion'
import { useState } from 'react'

interface RatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Rating({ value, onChange, readonly = false, size = 'md' }: RatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="flex gap-1">
      {stars.map((star) => {
        const filled = (hoverValue || value) >= star
        return (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            whileHover={!readonly ? { scale: 1.1 } : undefined}
            whileTap={!readonly ? { scale: 0.95 } : undefined}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHoverValue(star)}
            onMouseLeave={() => !readonly && setHoverValue(0)}
            className={`${
              readonly ? 'cursor-default' : 'cursor-pointer'
            } transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 rounded`}
          >
            <svg
              className={`${sizeClasses[size]} transition-colors`}
              fill={filled ? '#F3C653' : 'none'}
              stroke={filled ? '#F3C653' : '#D1D5DB'}
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </motion.button>
        )
      })}
    </div>
  )
}
