import { useState, useEffect } from 'react'
import { getQRInfo, sendMessage } from '@/lib/api/endpoints'
import type { ContactInfo } from '@/types/user'

export function useContactData(qrId: string) {
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadContact()
  }, [qrId])

  const loadContact = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getQRInfo(qrId)

      if (response.success && response.data) {
        setContact(response.data)
      } else {
        setError(response.error?.message || 'QR код не найден')
      }
    } catch (err) {
      setError('Произошла ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (message: string) => {
    const response = await sendMessage(qrId, { message })

    if (!response.success) {
      throw new Error(response.error?.message || 'Ошибка отправки сообщения')
    }
  }

  return {
    contact,
    loading,
    error,
    sendMessage: handleSendMessage,
  }
}
