type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'gray'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  dot?: boolean
  className?: string
}

const dotColor: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error:   'bg-rose-500',
  info:    'bg-primary-500',
  gray:    'bg-slate-400',
}

export function Badge({ children, variant = 'gray', dot = false, className = '' }: BadgeProps) {
  return (
    <span className={`badge-${variant} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor[variant]}`} />}
      {children}
    </span>
  )
}
