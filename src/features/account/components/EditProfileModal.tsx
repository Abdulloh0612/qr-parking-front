import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { OwnProfile } from '@/types/api'
import { updateMyProfile } from '@/lib/api/endpoints'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: OwnProfile
  onUpdated?: () => void
}

export function EditProfileModal({ isOpen, onClose, user, onUpdated }: EditProfileModalProps) {
  const [firstName, setFirstName] = useState(user.first_name)
  const [lastName, setLastName] = useState(user.last_name)
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || '')
  const [instagram, setInstagram] = useState(user.instagram || '')
  const [telegram, setTelegram] = useState(user.telegram || '')
  const [vk, setVk] = useState(user.vk || '')
  const [facebook, setFacebook] = useState(user.facebook || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setFirstName(user.first_name)
      setLastName(user.last_name)
      setWhatsapp(user.whatsapp || '')
      setInstagram(user.instagram || '')
      setTelegram(user.telegram || '')
      setVk(user.vk || '')
      setFacebook(user.facebook || '')
      setError('')
    }
  }, [isOpen, user])

  async function handleSave() {
    setLoading(true)
    setError('')
    const res = await updateMyProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      whatsapp: whatsapp.trim() || null,
      instagram: instagram.trim() || null,
      telegram: telegram.trim() || null,
      vk: vk.trim() || null,
      facebook: facebook.trim() || null,
    } as Partial<OwnProfile>)
    setLoading(false)
    if (!res.success) {
      setError(res.error?.message || 'Ошибка сохранения')
      return
    }
    onUpdated?.()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Редактировать профиль">
      <div className="space-y-4">
        <Input label="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input label="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <Input label="WhatsApp" placeholder="+996 XXX XXX XXX" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        <Input label="Instagram" placeholder="username" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        <Input label="Telegram" placeholder="@username" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
        <Input label="VK" value={vk} onChange={(e) => setVk(e.target.value)} />
        <Input label="Facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>Отмена</Button>
          <Button onClick={handleSave} loading={loading} className="flex-1">Сохранить</Button>
        </div>
      </div>
    </Modal>
  )
}
