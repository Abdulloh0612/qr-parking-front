import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageLoader } from '@/shared/ui/Loader'

export function QRRedirectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      navigate(`/account?qr-code=${id}`, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }, [id, navigate])

  return <PageLoader text="Загрузка..." />
}
