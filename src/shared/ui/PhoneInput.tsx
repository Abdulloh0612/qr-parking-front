import { useRef, useEffect } from 'react'
import IMask from 'imask'

interface PhoneInputProps {
  value: string
  onChange: (unmasked: string) => void
  label?: string
  error?: string
  placeholder?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
  className?: string
}

export function PhoneInput({ value, onChange, label, error, placeholder, onKeyDown, className = '' }: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maskRef = useRef<any>(null)

  useEffect(() => {
    if (!inputRef.current) return
    const mask = IMask(inputRef.current, {
      mask: '+{996} 000 000 000',
      lazy: false,
      placeholderChar: '_',
    })
    mask.on('accept', () => {
      onChange('+996' + mask.unmaskedValue.replace(/^996/, ''))
    })
    maskRef.current = mask
    return () => { mask.destroy() }
  }, [])

  useEffect(() => {
    if (!maskRef.current) return
    const digits = value.replace(/\D/g, '').replace(/^996/, '')
    if (maskRef.current.unmaskedValue.replace(/^996/, '') !== digits) {
      maskRef.current.unmaskedValue = '996' + digits
    }
  }, [value])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-2)',
          letterSpacing: '-0.01em',
        }}>
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="tel"
        placeholder={placeholder || '+996 ___ ___ ___'}
        className={`input-base ${error ? 'input-error' : ''} ${className}`}
        onKeyDown={onKeyDown}
      />
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg style={{ width: 12, height: 12, color: 'var(--error)', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{error}</p>
        </div>
      )}
    </div>
  )
}
