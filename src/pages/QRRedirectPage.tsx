import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { Loader } from '@/components/ui/Loader'
import { Card } from '@/components/ui/Card'
import { checkQRStatus } from '@/lib/api/endpoints'
import { ROUTES } from '@/lib/constants'

export function QRRedirectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!id) {
      setError('QR код не найден')
      return
    }

    checkStatus(id)
  }, [id])

  const checkStatus = async (qrId: string) => {
    try {
      const response = await checkQRStatus(qrId)

      if (response.success && response.data) {
        if (response.data.registered) {
          // QR уже зарегистрирован - идем на страницу контакта
          navigate(ROUTES.contact(qrId), { replace: true })
        } else {
          // Первое сканирование - идем на регистрацию
          navigate(`${ROUTES.register}?qr=${qrId}`, { replace: true })
        }
      } else {
        setError(response.error?.message || 'Ошибка проверки QR кода')
      }
    } catch (err) {
      setError('Произошла ошибка при проверке QR кода')
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-700">{error}</p>
          </Card>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Container>
        <Loader size="lg" text="Проверка QR кода..." />
      </Container>
    </div>
  )
}
