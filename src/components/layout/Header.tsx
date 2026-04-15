import { motion } from 'framer-motion'
import { APP_CONFIG } from '@/lib/constants'

interface HeaderProps {
  title: string
  showSupport?: boolean
}

export function Header({ title, showSupport = true }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass sticky top-0 z-30 backdrop-blur-xl bg-white/60 border-b border-white/20"
    >
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
            {title}
          </h1>
          {showSupport && (
            <a
              href={`https://wa.me/${APP_CONFIG.supportWhatsApp.replace(/\+/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              Помощь
            </a>
          )}
        </div>
      </div>
    </motion.header>
  )
}
