import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Avatar } from '@/entities/user/ui/Avatar'
import { SocialInput } from '@/features/registration/ui/SocialInput'
import { updateMyProfile, uploadMedia } from '@/shared/api/endpoints'
import { validatePhone, validateInstagram, validateTelegram } from '@/shared/lib/validators'
import type { OwnProfile } from '@/shared/types/api'

interface EditProfileModalProps {
  profile: OwnProfile
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

interface ProfileFormData {
  first_name: string
  last_name: string
  whatsapp: string
  instagram: string
  telegram: string
  vk: string
  facebook: string
}

const namePattern = /^[A-Za-zА-Яа-яЁёÀ-ÖØ-öø-ÿ\s'-]+$/

export function EditProfileModal({ profile, isOpen, onClose, onSaved }: EditProfileModalProps) {
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null)
  const [loading,       setLoading]       = useState(false)
  const [apiError,      setApiError]      = useState('')

  const { register, handleSubmit, control, formState: { errors }, setValue } = useForm<ProfileFormData>({
    defaultValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      whatsapp: profile.whatsapp || '',
      instagram: profile.instagram || '',
      telegram: profile.telegram || '',
      vk: profile.vk || '',
      facebook: profile.facebook || '',
    },
    mode: 'onBlur',
  })

  async function onSubmit(data: ProfileFormData) {
    setLoading(true)
    setApiError('')
    let avatarUrl: string | null = profile.avatar_url || null
    if (avatarFile) {
      const res = await uploadMedia(avatarFile)
      if (!res.success) { setApiError('Ошибка загрузки фото'); setLoading(false); return }
      avatarUrl = res.data?.url ?? null
    }
    const res = await updateMyProfile({
      first_name: data.first_name.trim(),
      last_name:  data.last_name.trim(),
      avatar_url: avatarUrl,
      whatsapp:   data.whatsapp.trim()  || null,
      instagram:  data.instagram.trim() || null,
      telegram:   data.telegram.trim()  || null,
      vk:         data.vk.trim()        || null,
      facebook:   data.facebook.trim()  || null,
    } as Partial<OwnProfile>)
    setLoading(false)
    if (!res.success) { setApiError(res.error?.message || 'Ошибка сохранения'); return }
    onSaved()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Редактировать профиль">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <label className="relative cursor-pointer group">
              <Avatar src={avatarPreview} name={`${profile.first_name} ${profile.last_name}`} size="xl" />
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)) }
                e.target.value = ''
              }} />
            </label>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Нажмите для смены фото</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Имя"
              {...register('first_name', {
                required: 'Обязательное поле',
                validate: (v) => v.trim().length >= 2 || 'Минимум 2 символа',
                pattern: { value: namePattern, message: 'Только буквы' },
              })}
              error={errors.first_name?.message}
              onChange={(e) => {
                const val = e.target.value.replace(/[^A-Za-zА-Яа-яЁёÀ-ÖØ-öø-ÿ\s'-]/g, '')
                setValue('first_name', val)
              }}
            />
            <Input label="Фамилия"
              {...register('last_name', {
                required: 'Обязательное поле',
                validate: (v) => v.trim().length >= 2 || 'Минимум 2 символа',
                pattern: { value: namePattern, message: 'Только буквы' },
              })}
              error={errors.last_name?.message}
              onChange={(e) => {
                const val = e.target.value.replace(/[^A-Za-zА-Яа-яЁёÀ-ÖØ-öø-ÿ\s'-]/g, '')
                setValue('last_name', val)
              }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>Социальные сети</p>
            <div className="space-y-3">
              <Controller control={control} name="whatsapp"
                rules={{ validate: (v) => !v || validatePhone(v) || 'Неверный формат (+996XXXXXXXXX)' }}
                render={({ field, fieldState }) => (
                  <SocialInput type="whatsapp" label="WhatsApp" placeholder="+996 XXX XXX XXX" inputType="tel"
                    value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
                )}
              />
              <Controller control={control} name="instagram"
                rules={{ validate: (v) => !v || validateInstagram(v) || 'Только буквы, цифры, точка и _' }}
                render={({ field, fieldState }) => (
                  <SocialInput type="instagram" label="Instagram" placeholder="username"
                    value={field.value} onChange={(v) => field.onChange(v.replace(/[^a-zA-Z0-9._]/g, ''))} error={fieldState.error?.message} />
                )}
              />
              <Controller control={control} name="telegram"
                rules={{ validate: (v) => !v || validateTelegram(v) || 'Введите @username или номер' }}
                render={({ field, fieldState }) => (
                  <SocialInput type="telegram" label="Telegram" placeholder="@username"
                    value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
                )}
              />
              <Controller control={control} name="vk"
                render={({ field }) => (
                  <SocialInput type="vk" label="VK" placeholder="username"
                    value={field.value} onChange={(v) => field.onChange(v.replace(/[^a-zA-Z0-9._]/g, ''))} />
                )}
              />
              <Controller control={control} name="facebook"
                render={({ field }) => (
                  <SocialInput type="facebook" label="Facebook" placeholder="username"
                    value={field.value} onChange={(v) => field.onChange(v.replace(/[^a-zA-Z0-9._]/g, ''))} />
                )}
              />
            </div>
          </div>

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
