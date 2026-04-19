import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { adminGetMe } from '@/shared/api/endpoints'

/**
 * Route guard for /admin/* routes.
 * - No token → instant redirect to /admin/login (no render)
 * - Token exists → validate with /admin/me
 *   - Valid → render children
 *   - Expired/invalid → clear token, redirect
 * - Stores original URL in location.state.from for post-login redirect
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>(() =>
    localStorage.getItem('admin_token') ? 'checking' : 'invalid',
  )

  useEffect(() => {
    if (status !== 'checking') return
    let cancelled = false
    adminGetMe().then((res) => {
      if (cancelled) return
      if (res.success) {
        setStatus('valid')
      } else {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_role')
        setStatus('invalid')
      }
    })
    return () => { cancelled = true }
  }, [status])

  if (status === 'invalid') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (status === 'checking') {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--sidebar-bg)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div className="animate-spin" style={{
              width: 20, height: 20,
              border: '2px solid rgba(255,255,255,0.2)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
            }} />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
