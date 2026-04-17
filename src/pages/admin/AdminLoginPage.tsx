import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/layout/Container'
import { adminLogin } from '@/lib/api/endpoints'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!username.trim() || !password) {
      setError('Введите логин и пароль')
      return
    }
    setLoading(true)
    setError('')
    const res = await adminLogin(username.trim(), password)
    setLoading(false)
    if (!res.success || !res.data) {
      setError(res.error?.message || 'Неверные данные')
      return
    }
    localStorage.setItem('admin_token', res.data.tokens.access_token)
    localStorage.setItem('admin_role', res.data.role)
    navigate('/admin', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <Container className="max-w-sm w-full">
        <Card>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Администратор</h1>
            <p className="text-gray-500 text-sm mt-1">QR Parking</p>
          </div>

          <div className="space-y-4">
            <Input
              label="Логин"
              type="text"
              placeholder="Введите логин"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLogin()}
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLogin()}
              error={error}
            />
            <Button onClick={handleLogin} loading={loading} className="w-full">
              Войти
            </Button>
          </div>
        </Card>
      </Container>
    </div>
  )
}
