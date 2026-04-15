import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isUserRegistered } from '@/lib/api/endpoints'
import { Loader } from '@/components/ui/Loader'
import { Container } from '@/components/layout/Container'
import { ROUTES } from '@/lib/constants'

export function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const qrId = searchParams.get('qr')

    if (qrId) {
      // Если есть QR параметр, это новый пользователь - на регистрацию
      navigate(ROUTES.register + `?qr=${qrId}`)
    } else if (isUserRegistered()) {
      // Если зарегистрирован - в аккаунт
      navigate(ROUTES.account)
    } else {
      // Иначе - на регистрацию
      navigate(ROUTES.register)
    }
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Container>
        <Loader size="lg" text="Загрузка..." />
      </Container>
    </div>
  )
}
