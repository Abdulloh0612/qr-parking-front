interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
  onClick?: () => void
}

const sizeMap = {
  sm: 'w-8  h-8  text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 text-2xl',
}

function getInitials(name?: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0][0] || 'U').toUpperCase()
}

export function Avatar({ src, name, size = 'md', ring = false, onClick }: AvatarProps) {
  const sizeClass = sizeMap[size]
  const ringClass = ring ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-100' : ''
  const cursorClass = onClick ? 'cursor-pointer' : ''

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onClick={onClick}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${ringClass} ${cursorClass}`}
      />
    )
  }

  return (
    <div
      onClick={onClick}
      className={`${sizeClass} rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0 ${ringClass} ${cursorClass}`}
    >
      {getInitials(name)}
    </div>
  )
}
