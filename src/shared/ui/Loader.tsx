interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullscreen?: boolean
}

export function Loader({ size = 'md', text, fullscreen = false }: LoaderProps) {
  const sizeClass = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-[3px]', lg: 'w-12 h-12 border-4' }[size]

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeClass} border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
      {text && <p className="text-sm text-slate-500 font-medium">{text}</p>}
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export function PageLoader({ text = 'Загрузка...' }: { text?: string }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50">
      <Loader size="lg" text={text} />
    </div>
  )
}
