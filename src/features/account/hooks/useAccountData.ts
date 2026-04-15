import { useState, useEffect } from 'react'
import { getAccount, getAccountMessages, getAccountReviews } from '@/lib/api/endpoints'
import type { User, Message, Review } from '@/types/user'

export function useAccountData() {
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [userRes, messagesRes, reviewsRes] = await Promise.all([
        getAccount(),
        getAccountMessages(),
        getAccountReviews(),
      ])

      if (userRes.success && userRes.data) {
        // Normalize: backend may return display_id as id
        const raw = userRes.data as unknown as Record<string, unknown>
        const normalized: User = {
          ...userRes.data,
          id: (raw.display_id as string) || (raw.id as string),
          display_id: (raw.display_id as string) || (raw.id as string),
          qr_id: (raw.qr_id as string) || (raw.qr_code as string) || '',
          is_owner: true,
        }
        setUser(normalized)
      } else {
        setError(userRes.error?.message || 'Ошибка загрузки данных')
      }

      if (messagesRes.success && messagesRes.data) {
        setMessages(messagesRes.data)
      }

      if (reviewsRes.success && reviewsRes.data) {
        setReviews(reviewsRes.data)
      }
    } catch {
      setError('Произошла ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    messages,
    reviews,
    loading,
    error,
    reload: loadData,
  }
}
