import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/layout/Container'

const ADMIN_PASSWORD = 'admin123'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', '1')
      navigate('/admin')
    } else {
      setError('Неверный пароль')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <Container className="max-w-sm">
        <Card>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Администратор</h1>
            <p className="text-gray-500 text-sm mt-1">QR Parking</p>
          </div>

          <div className="space-y-4">
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
            <Button onClick={handleLogin} className="w-full">
              Войти
            </Button>
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-400">Тестовый пароль:</p>
              <p className="text-sm font-mono font-semibold text-gray-600 mt-0.5">admin123</p>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  )
}
