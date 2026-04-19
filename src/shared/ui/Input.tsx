import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', id, ...rest }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-2)',
              letterSpacing: '-0.01em',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          {icon && (
            <div
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-4)',
                pointerEvents: 'none',
                display: 'flex',
              }}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`input-base ${error ? 'input-error' : ''} ${icon ? 'pl-10' : ''} ${className}`}
            {...rest}
          />
        </div>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg style={{ width: 12, height: 12, color: 'var(--error)', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{error}</p>
          </div>
        )}
        {hint && !error && (
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
