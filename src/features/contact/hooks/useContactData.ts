import { useState, useEffect } from 'react'
import { getQRData, sendMessage } from '@/lib/api/endpoints'
import type { QROwner } from '@/types/api'

export function useContactData(qrId: string) {
  const [contact, setContact] = useState<QROwner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    void loadContact()
  }, [qrId])

  const loadContact = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getQRData(qrId)
      if (response.success && response.data) {
        if (response.data.registered) {
          setContact(response.data.owner)
        } else {
          setError('QR код не зарегистрирован')
        }
      } else {
        setError(response.error?.message || 'QR код не найден')
      }
    } catch {
      setError('Произошла ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (message: string) => {
    const response = await sendMessage(qrId, message)
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
