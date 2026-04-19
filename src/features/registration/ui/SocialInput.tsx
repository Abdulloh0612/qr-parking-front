import { SocialIcon } from '@/shared/ui/SocialIcon'
import type { SocialType } from '@/shared/ui/SocialIcon'

interface SocialInputProps {
  type: SocialType
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
  inputType?: string
}

const iconColor: Record<string, string> = {
  whatsapp:  'text-emerald-500',
  instagram: 'text-pink-500',
  telegram:  'text-sky-500',
  vk:        'text-blue-600',
  facebook:  'text-indigo-600',
}

export function SocialInput({ type, label, placeholder, value, onChange, error, inputType }: SocialInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-2)',
        letterSpacing: '-0.01em',
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${iconColor[type] || 'text-slate-400'}`}>
          <SocialIcon type={type} className="w-5 h-5" />
        </div>
        <input
          type={inputType || 'text'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`input-base pl-11 ${error ? 'input-error' : ''}`}
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
    </div>
  )
}
