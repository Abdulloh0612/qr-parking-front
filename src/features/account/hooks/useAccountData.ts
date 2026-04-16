import { useState, useEffect } from 'react'
import { getMyProfile } from '@/lib/api/endpoints'
import type { OwnProfile } from '@/types/api'

export function useAccountData() {
  const [user, setUser] = useState<OwnProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    void loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getMyProfile()
      if (res.success && res.data) {
        setUser(res.data)
      } else {
        setError(res.error?.message || 'Ошибка загрузки данных')
      }
    } catch {
      setError('Произошла ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    messages: [] as { id: string; message: string; created_at: string }[],
    loading,
    error,
    reload: loadData,
  }
}
