import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerQR } from '@/lib/api/endpoints'
import { getDeviceId } from '@/lib/utils/deviceId'
import { formatPhone, formatTelegram, formatVehicleNumber } from '@/lib/utils/validators'
import type { RegistrationData } from '../types'
import { ROUTES } from '@/lib/constants'

export function useRegistration(qrId: string) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const submitRegistration = async (data: RegistrationData) => {
    setLoading(true)
    setError('')

    try {
      const response = await registerQR({
        qr_id: qrId,
        phone: formatPhone(data.phone),
        first_name: data.first_name,
        last_name: data.last_name,
        vehicle_number: formatVehicleNumber(data.vehicle_number),
        vehicle_brand: data.vehicle_brand,
        whatsapp: data.whatsapp ? formatPhone(data.whatsapp) : undefined,
        instagram: data.instagram || undefined,
        telegram: data.telegram ? formatTelegram(data.telegram) : undefined,
        vk: data.vk || undefined,
        facebook: data.facebook || undefined,
        photo_url: data.photo_url || undefined,
        telegram_enabled: data.telegram_bot_enabled,
        device_id: getDeviceId(),
      })

      if (response.success) {
        navigate(ROUTES.account)
      } else {
        setError(response.error?.message || 'Ошибка регистрации')
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте позже')
    } finally {
      setLoading(false)
    }
  }

  return {
    submitRegistration,
    loading,
    error,
  }
}
