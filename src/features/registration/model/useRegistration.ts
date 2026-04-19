import { useState } from 'react'
import { sendOtp, verifyOtp, saveToken } from '@/shared/api/endpoints'
import { ROUTES } from '@/shared/config'
import { useNavigate } from 'react-router-dom'

export function useRegistration(qrId: string) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function submitOtp(phone: string): Promise<boolean> {
    setLoading(true)
    setError('')
    const res = await sendOtp(qrId, phone)
    setLoading(false)
    if (!res.success) { setError(res.error?.message || 'Ошибка отправки кода'); return false }
    return true
  }

  async function submitVerify(phone: string, otp: string): Promise<boolean> {
    setLoading(true)
    setError('')
    const res = await verifyOtp(qrId, phone, otp)
    setLoading(false)
    if (!res.success || !res.data) { setError(res.error?.message || 'Неверный код'); return false }
    saveToken(res.data.access_token)
    navigate(ROUTES.account + `?qr-code=${qrId}`, { replace: true })
    return true
  }

  return { submitOtp, submitVerify, loading, error }
}
