import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendOtp, verifyOtp, saveToken } from '@/lib/api/endpoints'
import { ROUTES } from '@/lib/constants'

export function useRegistration(qrId: string) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const submitOtp = async (phone: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await sendOtp(qrId, phone)
      if (!res.success) {
        setError(res.error?.message || 'Ошибка отправки кода')
        return false
      }
      return true
    } catch {
      setError('Произошла ошибка. Попробуйте позже')
      return false
    } finally {
      setLoading(false)
    }
  }

  const submitVerify = async (phone: string, otp: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await verifyOtp(qrId, phone, otp)
      if (!res.success || !res.data) {
        setError(res.error?.message || 'Неверный код')
        return false
      }
      saveToken(res.data.access_token)
      navigate(ROUTES.account + `?qr-code=${qrId}`)
      return true
    } catch {
      setError('Произошла ошибка. Попробуйте позже')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    submitOtp,
    submitVerify,
    loading,
    error,
  }
}
