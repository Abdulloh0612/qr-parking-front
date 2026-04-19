interface VehicleCardProps {
  plateNumber?: string
  carModel?: string
  photoUrl?: string | null
  compact?: boolean
  onEdit?: () => void
}

/* Before: dark slate gradient bg with dot grid
   After:  white surface with 1px border + black accent plate strip
           — feels like a real document/tag rather than a glassy widget */
export function VehicleCard({ plateNumber, carModel, photoUrl, compact = false, onEdit }: VehicleCardProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
      }}
    >
      <div className={`flex items-center gap-3 ${compact ? 'p-3' : 'p-4'}`}>
        {/* Photo or placeholder */}
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={carModel}
            style={{
              width: compact ? 52 : 64,
              height: compact ? 36 : 44,
              borderRadius: 'var(--r-md)',
              objectFit: 'cover',
              flexShrink: 0,
              border: '1px solid var(--border)',
            }}
          />
        ) : (
          <div
            style={{
              width: compact ? 52 : 64,
              height: compact ? 36 : 44,
              borderRadius: 'var(--r-md)',
              background: 'var(--surface-3)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg style={{ width: 20, height: 20, color: 'var(--text-4)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h10l2-2zM14 8l2 4h3l-2-4h-3z" />
            </svg>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          {plateNumber && (
            <div className="flex items-center gap-2 mb-1">
              {/* License plate tag */}
              <span
                style={{
                  fontFamily: "'DM Sans', monospace",
                  fontWeight: 700,
                  fontSize: compact ? 13 : 15,
                  letterSpacing: '0.08em',
                  color: 'var(--text)',
                  background: 'var(--surface-3)',
                  border: '1px solid var(--border-2)',
                  borderRadius: 'var(--r-sm)',
                  padding: '2px 8px',
                }}
              >
                {plateNumber}
              </span>
            </div>
          )}
          {carModel && (
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }} className="truncate">
              {carModel}
            </p>
          )}
        </div>

        {/* Edit button */}
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'border-color 150ms ease, background 150ms ease',
              color: 'var(--text-3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-focus)'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-3)'
            }}
            aria-label="Редактировать"
          >
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
