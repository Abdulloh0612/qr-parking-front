import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, fullWidth = false, children, className = '', disabled, ...rest }, ref) => {
    const variantClass = {
      primary:   'btn-primary',
      secondary: 'btn-secondary',
      ghost:     'btn-ghost',
      danger:    'btn-danger',
    }[variant]

    const sizeClass = {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
    }[size]

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`btn-base ${variantClass} ${sizeClass} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...rest}
      >
        {loading ? (
          <>
            {/* Minimal spinner — thin ring, no color glow */}
            <span
              className="animate-spin"
              style={{
                width: 14,
                height: 14,
                border: '1.5px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ opacity: 0.7 }}>Загрузка...</span>
          </>
        ) : children}
      </button>
    )
  },
)

Button.displayName = 'Button'
