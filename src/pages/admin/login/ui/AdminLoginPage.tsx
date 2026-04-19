import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button } from '@/shared/ui/Button'
import { adminLogin } from '@/shared/api/endpoints'

interface LoginForm {
  username: string
  password: string
}

export function AdminLoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from || '/admin'
  const [apiError, setApiError] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: { username: '', password: '' },
  })

  async function onSubmit(data: LoginForm) {
    setLoading(true); setApiError('')
    const res = await adminLogin(data.username.trim(), data.password)
    setLoading(false)
    if (!res.success || !res.data) { setApiError(res.error?.message || 'Неверные данные'); return }
    localStorage.setItem('admin_token', res.data.tokens.access_token)
    localStorage.setItem('admin_role',  res.data.role)
    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="hero-gradient min-h-dvh flex items-center justify-center p-4">
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg style={{ width: 24, height: 24, color: '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700,
            color: '#ffffff', letterSpacing: '-0.02em', margin: 0,
          }}>
            Панель управления
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>QR Parking Admin</p>
        </div>

        {/* Form card — dark */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '24px 24px 28px',
          }}
        >
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
              Логин
            </label>
            <input
              type="text"
              placeholder="Введите логин"
              className={`input-base w-full ${errors.username ? 'input-error' : ''}`}
              autoComplete="username"
              {...register('username', {
                required: 'Введите логин',
                minLength: { value: 2, message: 'Минимум 2 символа' },
                validate: (v) => v.trim().length > 0 || 'Логин не может быть пустым',
              })}
            />
            {errors.username && (
              <p style={{ fontSize: 12, color: 'var(--error)', margin: '6px 0 0' }}>{errors.username.message}</p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Введите пароль"
                className={`input-base w-full ${errors.password ? 'input-error' : ''}`}
                style={{ paddingRight: 44 }}
                autoComplete="current-password"
                {...register('password', {
                  required: 'Введите пароль',
                  minLength: { value: 4, message: 'Минимум 4 символа' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', padding: 0,
                }}
              >
                {showPass ? (
                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p style={{ fontSize: 12, color: 'var(--error)', margin: '6px 0 0' }}>{errors.password.message}</p>
            )}
          </div>

          {apiError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px',
              background: 'rgba(220,0,0,0.12)',
              border: '1px solid rgba(220,0,0,0.25)',
              borderRadius: 8, marginBottom: 16,
            }}>
              <svg style={{ width: 14, height: 14, color: '#ff6b6b', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ fontSize: 13, color: '#ff6b6b', margin: 0 }}>{apiError}</p>
            </div>
          )}

          <Button fullWidth size="lg" type="submit" loading={loading}>
            Войти в панель
          </Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 24 }}>
          QR Parking © 2025
        </p>
      </div>
    </div>
  )
}
