import { SocialIcon } from '@/shared/ui/SocialIcon'
import type { SocialType } from '@/shared/ui/SocialIcon'

interface ContactRowProps {
  type: SocialType | string
  label: string
  value: string
  href?: string
  badge?: React.ReactNode
}

/* Flat brand colors — no gradients, no blurs */
const brandFlat: Record<string, { bg: string; color: string }> = {
  phone:     { bg: '#0a0a0a', color: '#ffffff' },
  whatsapp:  { bg: '#25d366', color: '#ffffff' },
  instagram: { bg: '#e1306c', color: '#ffffff' },
  telegram:  { bg: '#0088cc', color: '#ffffff' },
  vk:        { bg: '#4a76a8', color: '#ffffff' },
  facebook:  { bg: '#1877f2', color: '#ffffff' },
}

export function ContactRow({ type, label, value, href, badge }: ContactRowProps) {
  const brand = brandFlat[type] ?? { bg: '#0a0a0a', color: '#ffffff' }

  const inner = (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-lg group transition-colors duration-150"
      style={{ cursor: href ? 'pointer' : 'default' }}
      onMouseEnter={(e) => href && (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={(e) => href && (e.currentTarget.style.background = '')}
    >
      {/* Icon — flat square, no gradient */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--r-md)',
          background: brand.bg,
        }}
      >
        <SocialIcon type={type} className="w-[18px] h-[18px] text-white" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="section-label mb-0.5">{label}</p>
        <p
          className="font-medium truncate"
          style={{ fontSize: 14, color: 'var(--text)' }}
        >
          {value}
        </p>
      </div>

      {badge}

      {href && (
        <svg
          className="flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
          style={{ width: 16, height: 16, color: 'var(--text-4)' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    )
  }
  return inner
}
