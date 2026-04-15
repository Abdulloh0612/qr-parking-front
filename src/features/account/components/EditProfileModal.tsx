import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { UpdateUserData, User } from '@/types/user'
import { updateAccount } from '@/lib/api/endpoints'
import { SUCCESS_MESSAGES } from '@/lib/constants'
import { formatPhone, formatTelegram, formatVehicleNumber, validatePhone, validateTelegram } from '@/lib/utils/validators'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onUpdated?: () => void
}

type FormState = Required<Pick<
  UpdateUserData,
  | 'phone'
  | 'first_name'
  | 'last_name'
  | 'vehicle_number'
  | 'vehicle_brand'
  | 'whatsapp'
  | 'instagram'
  | 'telegram'
  | 'vk'
  | 'facebook'
>>

export function EditProfileModal({ isOpen, onClose, user, onUpdated }: EditProfileModalProps) {
  const initialState = useMemo<FormState>(() => ({
    phone: user.phone || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    vehicle_number: user.vehicle_number || '',
    vehicle_brand: user.vehicle_brand || '',
    whatsapp: user.whatsapp || '',
    instagram: user.instagram || '',
    telegram: user.telegram || '',
    vk: user.vk || '',
    facebook: user.facebook || '',
  }), [user])

  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setForm(initialState)
      setErrors({})
      setApiError('')
      setSuccess('')
      setLoading(false)
    }
  }, [isOpen, initialState])

  const setField = (key: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.phone.trim()) next.phone = 'Обязательное поле'
    else if (!validatePhone(form.phone)) next.phone = 'Неверный формат номера телефона'

    if (!form.first_name.trim()) next.first_name = 'Обязательное поле'
    if (!form.last_name.trim()) next.last_name = 'Обязательное поле'
    if (!form.vehicle_number.trim()) next.vehicle_number = 'Обязательное поле'
    if (!form.vehicle_brand.trim()) next.vehicle_brand = 'Обязательное поле'

    if (form.whatsapp && !validatePhone(form.whatsapp)) next.whatsapp = 'Неверный формат номера телефона'
    if (form.telegram && !validateTelegram(form.telegram)) next.telegram = 'Введите номер или username Telegram'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setLoading(true)
    setApiError('')
    setSuccess('')

    try {
      const payload: UpdateUserData = {
        phone: formatPhone(form.phone),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        vehicle_number: formatVehicleNumber(form.vehicle_number),
        vehicle_brand: form.vehicle_brand.trim(),
        whatsapp: form.whatsapp ? formatPhone(form.whatsapp) : undefined,
        instagram: form.instagram ? form.instagram.replace(/^@/, '') : undefined,
        telegram: form.telegram ? formatTelegram(form.telegram) : undefined,
        vk: form.vk || undefined,
        facebook: form.facebook || undefined,
      }

      const res = await updateAccount(payload)
      if (!res.success) {
        throw new Error(res.error?.message || 'Ошибка сохранения')
      }

      setSuccess(SUCCESS_MESSAGES.profileUpdated)
      onUpdated?.()
      setTimeout(() => onClose(), 700)
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit profile">
      <div className="space-y-4">
        <Input
          label="Номер телефона"
          type="tel"
          placeholder="+996 XXX XXX XXX"
          value={form.phone}
          onChange={(e) => setField('phone', e.target.value)}
          error={errors.phone}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Имя"
            value={form.first_name}
            onChange={(e) => setField('first_name', e.target.value)}
            error={errors.first_name}
          />
          <Input
            label="Фамилия"
            value={form.last_name}
            onChange={(e) => setField('last_name', e.target.value)}
            error={errors.last_name}
          />
        </div>

        <Input
          label="Номер машины"
          placeholder="01KG123ABC"
          value={form.vehicle_number}
          onChange={(e) => setField('vehicle_number', e.target.value)}
          error={errors.vehicle_number}
        />

        <Input
          label="Марка машины"
          placeholder="Toyota Camry"
          value={form.vehicle_brand}
          onChange={(e) => setField('vehicle_brand', e.target.value)}
          error={errors.vehicle_brand}
        />

        <div className="pt-2 border-t border-gray-200/60" />

        <Input
          label="WhatsApp"
          type="tel"
          placeholder="+996 XXX XXX XXX"
          value={form.whatsapp}
          onChange={(e) => setField('whatsapp', e.target.value)}
          error={errors.whatsapp}
        />
        <Input
          label="Instagram"
          placeholder="username"
          value={form.instagram}
          onChange={(e) => setField('instagram', e.target.value)}
          error={errors.instagram}
        />
        <Input
          label="Telegram"
          placeholder="@username или +996 XXX XXX XXX"
          value={form.telegram}
          onChange={(e) => setField('telegram', e.target.value)}
          error={errors.telegram}
        />
        <Input
          label="VK"
          placeholder="username или ссылка"
          value={form.vk}
          onChange={(e) => setField('vk', e.target.value)}
          error={errors.vk}
        />
        <Input
          label="Facebook"
          placeholder="username или ссылка"
          value={form.facebook}
          onChange={(e) => setField('facebook', e.target.value)}
          error={errors.facebook}
        />

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{apiError}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleSave} loading={loading} className="flex-1">
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  )
}

