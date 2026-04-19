import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

/* Before: white sheet, spring animation, rounded-t-4xl
   After:  same structure, but uses CSS variables, flat border on top,
           no rounded-top (matches Linear/Notion bottom sheets which are square-topped)
           Backdrop: #000 with 40% opacity, no blur (blur hides context)   */
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [isOpen, onClose])

  const maxW = { sm: '420px', md: '480px', lg: '560px' }[size]

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          className="sm:items-center">
          {/* Backdrop */}
          <motion.div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: maxW,
              background: 'var(--surface)',
              /* Top border strip — sharp, not rounded */
              borderTop: '1px solid var(--border)',
              borderLeft: '1px solid var(--border)',
              borderRight: '1px solid var(--border)',
              borderRadius: '12px 12px 0 0',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            className="sm:rounded-lg sm:border"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 36, stiffness: 400 }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }} className="sm:hidden">
              <div style={{ width: 32, height: 3, borderRadius: 9999, background: 'var(--border-2)' }} />
            </div>

            <div style={{ padding: '8px 20px 24px' }}>
              {title && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--text)',
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}>
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'border-color 150ms ease',
                      color: 'var(--text-3)',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
