import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { updateVehicle, uploadMedia } from '@/shared/api/endpoints'
import { validateVehicleNumber } from '@/shared/lib/validators'
import type { Vehicle } from '@/shared/types/api'

interface EditVehicleModalProps {
  vehicle: Vehicle
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

interface VehicleFormData {
  plate_number: string
  car_model: string
}

export function EditVehicleModal({ vehicle, isOpen, onClose, onSaved }: EditVehicleModalProps) {
  const [telegramEnabled, setTelegramEnabled] = useState(vehicle.telegram_enabled)
  const [photoPreview,    setPhotoPreview]    = useState<string | null>(vehicle.photo_url || null)
  const [photoFile,       setPhotoFile]       = useState<File | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [apiError,        setApiError]        = useState('')

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<VehicleFormData>({
    defaultValues: {
      plate_number: vehicle.plate_number,
      car_model: vehicle.car_model,
    },
    mode: 'onBlur',
  })

  async function onSubmit(data: VehicleFormData) {
    setLoading(true)
    setApiError('')
    let photoUrl: string | undefined = vehicle.photo_url || undefined
    if (photoFile) {
      const res = await uploadMedia(photoFile)
      if (!res.success) { setApiError('Ошибка загрузки фото'); setLoading(false); return }
      photoUrl = res.data?.url
    }
    const res = await updateVehicle(vehicle.id, {
      plate_number:     data.plate_number.trim(),
      car_model:        data.car_model.trim(),
      photo_url:        photoUrl,
      telegram_enabled: telegramEnabled,
    })
    setLoading(false)
    if (!res.success) { setApiError(res.error?.message || 'Ошибка сохранения'); return }
    onSaved()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Автомобиль">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {/* Photo upload */}
          <label className="block cursor-pointer group">
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Фото автомобиля</p>
            <div style={{
              position: 'relative', width: '100%', height: 128,
              background: 'var(--surface-2)', borderRadius: 'var(--r-lg)',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)',
            }}>
              {photoPreview ? (
                <img src={photoPreview} alt="vehicle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-3)' }}>
                  <svg style={{ width: 32, height: 32 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>Добавить фото</span>
                </div>
              )}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 150ms ease',
              }}
                className="group-hover:!opacity-100"
              >
                <span style={{ color: '#ffffff', fontSize: 13, fontWeight: 600 }}>Изменить</span>
              </div>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)) }
                e.target.value = ''
              }} />
            </div>
          </label>

          <Input label="Гос. номер" placeholder="01KG123"
            {...register('plate_number', {
              required: 'Обязательное поле',
              validate: (v) => validateVehicleNumber(v) || 'Только буквы и цифры, 6–10 символов',
            })}
            error={errors.plate_number?.message}
            onChange={(e) => {
              const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
              setValue('plate_number', val)
            }}
          />
          <Input label="Марка / модель" placeholder="Toyota Camry"
            {...register('car_model', {
              required: 'Обязательное поле',
              validate: (v) => v.trim().length >= 2 || 'Минимум 2 символа',
            })}
            error={errors.car_model?.message}
          />

          <label style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)', cursor: 'pointer',
            transition: 'border-color 150ms ease',
          }}>
            <div style={{
              position: 'relative', width: 44, height: 24, borderRadius: 12,
              background: telegramEnabled ? 'var(--accent)' : 'var(--border-2)',
              transition: 'background 200ms ease',
            }}>
              <div style={{
                position: 'absolute', top: 2, width: 20, height: 20,
                background: '#ffffff', borderRadius: '50%',
                transition: 'transform 200ms ease',
                transform: telegramEnabled ? 'translateX(20px)' : 'translateX(2px)',
              }} />
            </div>
            <input type="checkbox" checked={telegramEnabled} onChange={(e) => setTelegramEnabled(e.target.checked)} className="sr-only" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Уведомления в Telegram</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>Получать сообщения через бот</p>
            </div>
          </label>

          {apiError && (
            <div style={{ padding: 12, background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--error)' }}>
              {apiError}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <Button variant="secondary" onClick={onClose} className="flex-1" size="lg" type="button">Отмена</Button>
          <Button loading={loading} className="flex-1" size="lg" type="submit">Сохранить</Button>
        </div>
      </form>
    </Modal>
  )
}
