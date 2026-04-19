interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', padding = true, onClick }: CardProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      className={`card ${padding ? 'p-5' : ''} ${onClick ? 'cursor-pointer hover:border-primary-200 hover:shadow-card-md transition-all duration-200 w-full text-left' : ''} ${className}`}
      {...(onClick ? { onClick, type: 'button' as const } : {})}
    >
      {children}
    </Tag>
  )
}
