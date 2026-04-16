import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { Loader } from '@/components/ui/Loader'

export function QRRedirectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      navigate(`/account?qr-code=${id}`, { replace: true })
    }
  }, [id, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Container>
        <Loader size="lg" text="Перенаправление..." />
      </Container>
    </div>
  )
}
