import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken } from '@/shared/api/endpoints'
import { ROUTES } from '@/shared/config'
import { PageLoader } from '@/shared/ui/Loader'

export function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (getToken()) {
      navigate(ROUTES.account, { replace: true })
    } else {
      navigate(ROUTES.register, { replace: true })
    }
  }, [navigate])

  return <PageLoader />
}
