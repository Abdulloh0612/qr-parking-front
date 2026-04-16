import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader } from '@/components/ui/Loader'
import { Container } from '@/components/layout/Container'
import { formatPhoneDisplay } from '@/lib/utils/formatters'
import {
  getQRData,
  sendOtp,
  verifyOtp,
  sendMessage,
  getMyProfile,
  updateMyProfile,
  updateVehicle,
  saveToken,
  getToken,
} from '@/lib/api/endpoints'
import type { QROwner, OwnProfile, Vehicle } from '@/types/api'

type PageState =
  | 'loading'
  | 'not_found'
  | 'register_phone'
  | 'register_otp'
  | 'register_profile'
  | 'register_vehicle'
  | 'public_view'
  | 'owner_view'

// ─── Main component ───────────────────────────────────────────────────────────

export function AccountPage() {
  const [searchParams] = useSearchParams()
  const qrCode = searchParams.get('qr-code')

  const [state, setState] = useState<PageState>('loading')
  const [publicOwner, setPublicOwner] = useState<QROwner | null>(null)
  const [ownProfile, setOwnProfile] = useState<OwnProfile | null>(null)

  // OTP flow state
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [sending, setSending] = useState(false)

  // Edit state
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null)

  // Message form
  const [msgText, setMsgText] = useState('')
  const [msgSent, setMsgSent] = useState(false)
  const [msgError, setMsgError] = useState('')
  const [msgSending, setMsgSending] = useState(false)

  useEffect(() => {
    if (!qrCode) {
      setState('not_found')
      return
    }
    void init(qrCode)
  }, [qrCode])

  async function init(qrId: string) {
    setState('loading')

    const [qrRes, meRes] = await Promise.allSettled([
      getQRData(qrId),
      getToken() ? getMyProfile() : Promise.resolve(null),
    ])

    const qrResult = qrRes.status === 'fulfilled' ? qrRes.value : null
    const meResult =
      meRes.status === 'fulfilled' && meRes.value !== null ? meRes.value : null

    if (!qrResult || !qrResult.success) {
      setState('not_found')
      return
    }

    const qrData = qrResult.data!

    // Check if we're the owner
    if (meResult && meResult.success && meResult.data) {
      const profile = meResult.data
      const ownsThisQR = profile.vehicles.some((v) => v.qr_code === qrId)
      if (ownsThisQR) {
        setOwnProfile(profile)
        setState('owner_view')
        return
      }
    }

    if (!qrData.registered) {
      setState('register_phone')
      return
    }

    setPublicOwner(qrData.owner)
    setState('public_view')
  }

  async function handleSendOtp() {
    if (!qrCode) return
    if (!phone.trim()) {
      setPhoneError('Введите номер телефона')
      return
    }
    setSending(true)
    setPhoneError('')
    const res = await sendOtp(qrCode, phone.trim())
    setSending(false)
    if (!res.success) {
      setPhoneError(res.error?.message || 'Ошибка отправки')
      return
    }
    setState('register_otp')
  }

  async function handleVerifyOtp() {
    if (!qrCode) return
    if (otp.length < 4) {
      setOtpError('Введите код из SMS')
      return
    }
    setSending(true)
    setOtpError('')
    const res = await verifyOtp(qrCode, phone.trim(), otp.trim())
    setSending(false)
    if (!res.success) {
      setOtpError(res.error?.message || 'Неверный код')
      return
    }
    const { access_token, is_new_user } = res.data!
    saveToken(access_token)

    const meRes = await getMyProfile()
    if (meRes.success && meRes.data) {
      setOwnProfile(meRes.data)
    }

    if (is_new_user) {
      setState('register_profile')
    } else {
      setState('owner_view')
    }
  }

  async function handleSendMessage() {
    if (!qrCode || !msgText.trim()) return
    setMsgSending(true)
    setMsgError('')
    const res = await sendMessage(qrCode, msgText.trim())
    setMsgSending(false)
    if (!res.success) {
      setMsgError(res.error?.message || 'Ошибка отправки')
      return
    }
    setMsgSent(true)
    setMsgText('')
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader size="lg" text="Загрузка..." />
      </div>
    )
  }

  if (state === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Container>
          <Card className="text-center py-10">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">QR не найден</h2>
            <p className="text-gray-500 text-sm">Проверьте правильность ссылки</p>
          </Card>
        </Container>
      </div>
    )
  }

  if (state === 'register_phone') {
    return (
      <OtpPhoneStep
        phone={phone}
        setPhone={setPhone}
        error={phoneError}
        loading={sending}
        onSubmit={handleSendOtp}
      />
    )
  }

  if (state === 'register_otp') {
    return (
      <OtpCodeStep
        phone={phone}
        otp={otp}
        setOtp={setOtp}
        error={otpError}
        loading={sending}
        onSubmit={handleVerifyOtp}
        onBack={() => setState('register_phone')}
      />
    )
  }

  if (state === 'register_profile') {
    return (
      <RegisterProfileStep
        profile={ownProfile}
        onDone={async (updated) => {
          setOwnProfile((prev) => (prev ? { ...prev, ...updated } : prev))
          if (ownProfile?.vehicles.length) {
            setState('register_vehicle')
          } else {
            setState('owner_view')
          }
        }}
      />
    )
  }

  if (state === 'register_vehicle' && ownProfile) {
    const firstVehicle = ownProfile.vehicles[0]
    if (!firstVehicle) {
      setState('owner_view')
      return null
    }
    return (
      <RegisterVehicleStep
        vehicle={firstVehicle}
        onDone={() => setState('owner_view')}
      />
    )
  }

  if (state === 'public_view' && publicOwner) {
    return (
      <PublicView
        owner={publicOwner}
        msgText={msgText}
        setMsgText={setMsgText}
        msgSent={msgSent}
        msgError={msgError}
        msgSending={msgSending}
        onSendMessage={handleSendMessage}
        onClaimQR={() => setState('register_phone')}
      />
    )
  }

  if (state === 'owner_view' && ownProfile) {
    return (
      <OwnerView
        profile={ownProfile}
        editProfileOpen={editProfileOpen}
        setEditProfileOpen={setEditProfileOpen}
        editVehicleId={editVehicleId}
        setEditVehicleId={setEditVehicleId}
        onProfileUpdated={async () => {
          const res = await getMyProfile()
          if (res.success && res.data) setOwnProfile(res.data)
        }}
      />
    )
  }

  return null
}

// ─── OTP: phone step ──────────────────────────────────────────────────────────

function OtpPhoneStep({
  phone,
  setPhone,
  error,
  loading,
  onSubmit,
}: {
  phone: string
  setPhone: (v: string) => void
  error: string
  loading: boolean
  onSubmit: () => void
}) {
  return (
    <PageLayout title="Регистрация" subtitle="Введите номер телефона">
      <Card className="space-y-4">
        <div className="text-center mb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Мы отправим вам SMS с кодом подтверждения</p>
        </div>
        <Input
          label="Номер телефона"
          type="tel"
          placeholder="+996 XXX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && onSubmit()}
          error={error}
        />
        <Button onClick={onSubmit} loading={loading} className="w-full">
          Получить код
        </Button>
      </Card>
    </PageLayout>
  )
}

// ─── OTP: code step ───────────────────────────────────────────────────────────

function OtpCodeStep({
  phone,
  otp,
  setOtp,
  error,
  loading,
  onSubmit,
  onBack,
}: {
  phone: string
  otp: string
  setOtp: (v: string) => void
  error: string
  loading: boolean
  onSubmit: () => void
  onBack: () => void
}) {
  return (
    <PageLayout title="Подтверждение" subtitle={`Код отправлен на ${formatPhoneDisplay(phone)}`}>
      <Card className="space-y-4">
        <Input
          label="Код из SMS"
          type="text"
          inputMode="numeric"
          placeholder="• • • • • •"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && onSubmit()}
          error={error}
          className="text-center text-2xl tracking-widest font-bold"
        />
        <Button onClick={onSubmit} loading={loading} className="w-full">
          Подтвердить
        </Button>
        <button
          onClick={onBack}
          className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
        >
          Изменить номер
        </button>
      </Card>
    </PageLayout>
  )
}

// ─── Register: profile step ───────────────────────────────────────────────────

function RegisterProfileStep({
  profile,
  onDone,
}: {
  profile: OwnProfile | null
  onDone: (data: Partial<OwnProfile>) => void
}) {
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!firstName.trim()) {
      setError('Введите имя')
      return
    }
    setLoading(true)
    const res = await updateMyProfile({ first_name: firstName.trim(), last_name: lastName.trim() })
    setLoading(false)
    if (!res.success) {
      setError(res.error?.message || 'Ошибка сохранения')
      return
    }
    onDone({ first_name: firstName.trim(), last_name: lastName.trim() })
  }

  return (
    <PageLayout title="Ваш профиль" subtitle="Заполните данные для отображения">
      <Card className="space-y-4">
        <Input
          label="Имя"
          placeholder="Введите имя"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          error={error}
        />
        <Input
          label="Фамилия"
          placeholder="Введите фамилию"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <Button onClick={handleSave} loading={loading} className="w-full">
          Продолжить
        </Button>
      </Card>
    </PageLayout>
  )
}

// ─── Register: vehicle step ───────────────────────────────────────────────────

function RegisterVehicleStep({
  vehicle,
  onDone,
}: {
  vehicle: Vehicle
  onDone: () => void
}) {
  const [plateNumber, setPlateNumber] = useState(vehicle.plate_number || '')
  const [carModel, setCarModel] = useState(vehicle.car_model || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true)
    const res = await updateVehicle(vehicle.id, {
      plate_number: plateNumber.trim(),
      car_model: carModel.trim(),
    })
    setLoading(false)
    if (!res.success) {
      setError(res.error?.message || 'Ошибка сохранения')
      return
    }
    onDone()
  }

  return (
    <PageLayout title="Ваш автомобиль" subtitle="Укажите данные автомобиля">
      <Card className="space-y-4">
        <Input
          label="Гос. номер"
          placeholder="01 KG 001"
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
        />
        <Input
          label="Марка / модель"
          placeholder="Toyota Camry"
          value={carModel}
          onChange={(e) => setCarModel(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={handleSave} loading={loading} className="w-full">
          Сохранить
        </Button>
        <button onClick={onDone} className="w-full text-sm text-gray-400 py-2">
          Пропустить
        </button>
      </Card>
    </PageLayout>
  )
}

// ─── Public view ──────────────────────────────────────────────────────────────

function PublicView({
  owner,
  msgText,
  setMsgText,
  msgSent,
  msgError,
  msgSending,
  onSendMessage,
  onClaimQR,
}: {
  owner: QROwner
  msgText: string
  setMsgText: (v: string) => void
  msgSent: boolean
  msgError: string
  msgSending: boolean
  onSendMessage: () => void
  onClaimQR: () => void
}) {
  const initials = `${owner.first_name?.[0] || ''}${owner.last_name?.[0] || ''}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-8">
      {/* Header gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-10 pb-16 px-4">
        <p className="text-blue-100 text-sm text-center mb-1">QR Parking</p>
        <h1 className="text-white text-2xl font-bold text-center">Профиль владельца</h1>
      </div>

      <Container className="-mt-10">
        {/* Profile card */}
        <Card className="mb-4">
          <div className="flex items-center gap-4">
            {owner.avatar_url ? (
              <img src={owner.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-100" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {initials || 'U'}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {owner.first_name} {owner.last_name}
              </h2>
              {owner.scan_count > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Отсканировано {owner.scan_count} раз
                </p>
              )}
            </div>
          </div>

          {(owner.vehicle_number || owner.vehicle_brand) && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400">Автомобиль</p>
                <p className="font-semibold text-sm">
                  {[owner.vehicle_brand, owner.vehicle_number].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Contacts card */}
        <Card className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">Контакты</h3>
          <div className="space-y-2">
            <ContactRow
              icon="phone"
              label="Телефон"
              value={formatPhoneDisplay(owner.phone)}
              href={`tel:${owner.phone}`}
            />
            {owner.whatsapp && (
              <ContactRow
                icon="whatsapp"
                label="WhatsApp"
                value={formatPhoneDisplay(owner.whatsapp)}
                href={`https://wa.me/${owner.whatsapp.replace(/\D/g, '')}`}
              />
            )}
            {owner.instagram && (
              <ContactRow
                icon="instagram"
                label="Instagram"
                value={`@${owner.instagram.replace(/^@/, '')}`}
                href={`https://instagram.com/${owner.instagram.replace(/^@/, '')}`}
              />
            )}
            {owner.telegram && (
              <ContactRow
                icon="telegram"
                label="Telegram"
                value={owner.telegram}
                href={`https://t.me/${owner.telegram.replace(/^@/, '')}`}
              >
                {owner.telegram_enabled && (
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Бот активен
                  </span>
                )}
              </ContactRow>
            )}
            {owner.vk && (
              <ContactRow
                icon="vk"
                label="VK"
                value={owner.vk}
                href={`https://vk.com/${owner.vk}`}
              />
            )}
            {owner.facebook && (
              <ContactRow
                icon="facebook"
                label="Facebook"
                value={owner.facebook}
                href={`https://facebook.com/${owner.facebook}`}
              />
            )}
          </div>
        </Card>

        {/* Message form */}
        <Card className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">Написать сообщение</h3>
          {msgSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-700 font-medium">Сообщение отправлено!</p>
              <p className="text-sm text-gray-400 mt-1">Владелец получит уведомление</p>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Напишите сообщение владельцу автомобиля..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                maxLength={500}
              />
              {msgError && <p className="text-sm text-red-600">{msgError}</p>}
              <Button
                onClick={onSendMessage}
                loading={msgSending}
                disabled={!msgText.trim()}
                className="w-full"
              >
                Отправить
              </Button>
            </div>
          )}
        </Card>

        {/* Claim QR */}
        <button
          onClick={onClaimQR}
          className="w-full text-sm text-gray-400 hover:text-gray-600 py-3 text-center"
        >
          Это мой QR-код
        </button>
      </Container>
    </div>
  )
}

// ─── Owner view ───────────────────────────────────────────────────────────────

function OwnerView({
  profile,
  editProfileOpen,
  setEditProfileOpen,
  editVehicleId,
  setEditVehicleId,
  onProfileUpdated,
}: {
  profile: OwnProfile
  editProfileOpen: boolean
  setEditProfileOpen: (v: boolean) => void
  editVehicleId: string | null
  setEditVehicleId: (v: string | null) => void
  onProfileUpdated: () => Promise<void>
}) {
  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-10 pb-16 px-4">
        <p className="text-blue-100 text-sm text-center mb-1">QR Parking</p>
        <h1 className="text-white text-2xl font-bold text-center">Мой профиль</h1>
      </div>

      <Container className="-mt-10">
        {/* Profile card */}
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {initials || 'U'}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-sm text-gray-400">{formatPhoneDisplay(profile.phone)}</p>
              </div>
            </div>
            <button
              onClick={() => setEditProfileOpen(true)}
              className="p-2 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              title="Редактировать профиль"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </Card>

        {/* Vehicles */}
        {profile.vehicles.length > 0 && (
          <Card className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Мои автомобили</h3>
            <div className="space-y-2">
              {profile.vehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm">{v.car_model || 'Без модели'}</p>
                    <p className="text-xs text-gray-400">{v.plate_number || 'Без номера'}</p>
                  </div>
                  <button
                    onClick={() => setEditVehicleId(v.id)}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Social links */}
        {(profile.whatsapp || profile.instagram || profile.telegram || profile.vk || profile.facebook) && (
          <Card className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Контакты</h3>
            <div className="space-y-2">
              {profile.whatsapp && (
                <ContactRow icon="whatsapp" label="WhatsApp" value={formatPhoneDisplay(profile.whatsapp)} />
              )}
              {profile.instagram && (
                <ContactRow icon="instagram" label="Instagram" value={`@${profile.instagram.replace(/^@/, '')}`} />
              )}
              {profile.telegram && (
                <ContactRow icon="telegram" label="Telegram" value={profile.telegram} />
              )}
              {profile.vk && (
                <ContactRow icon="vk" label="VK" value={profile.vk} />
              )}
              {profile.facebook && (
                <ContactRow icon="facebook" label="Facebook" value={profile.facebook} />
              )}
            </div>
          </Card>
        )}
      </Container>

      {/* Edit profile modal */}
      {editProfileOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditProfileOpen(false)}
          onSaved={async () => {
            setEditProfileOpen(false)
            await onProfileUpdated()
          }}
        />
      )}

      {/* Edit vehicle modal */}
      {editVehicleId && (
        <EditVehicleModal
          vehicle={profile.vehicles.find((v) => v.id === editVehicleId)!}
          onClose={() => setEditVehicleId(null)}
          onSaved={async () => {
            setEditVehicleId(null)
            await onProfileUpdated()
          }}
        />
      )}
    </div>
  )
}

// ─── Edit profile modal ───────────────────────────────────────────────────────

function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: OwnProfile
  onClose: () => void
  onSaved: () => void
}) {
  const [firstName, setFirstName] = useState(profile.first_name)
  const [lastName, setLastName] = useState(profile.last_name)
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || '')
  const [instagram, setInstagram] = useState(profile.instagram || '')
  const [telegram, setTelegram] = useState(profile.telegram || '')
  const [vk, setVk] = useState(profile.vk || '')
  const [facebook, setFacebook] = useState(profile.facebook || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    onSaved()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-lg font-bold mb-4">Редактировать профиль</h2>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <Input label="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input label="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <Input label="WhatsApp" placeholder="+996 XXX XXX XXX" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        <Input label="Instagram" placeholder="username" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        <Input label="Telegram" placeholder="@username" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
        <Input label="VK" placeholder="id или username" value={vk} onChange={(e) => setVk(e.target.value)} />
        <Input label="Facebook" placeholder="username" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex gap-3 mt-4">
        <Button variant="secondary" onClick={onClose} className="flex-1">Отмена</Button>
        <Button onClick={handleSave} loading={loading} className="flex-1">Сохранить</Button>
      </div>
    </ModalOverlay>
  )
}

// ─── Edit vehicle modal ───────────────────────────────────────────────────────

function EditVehicleModal({
  vehicle,
  onClose,
  onSaved,
}: {
  vehicle: Vehicle
  onClose: () => void
  onSaved: () => void
}) {
  const [plateNumber, setPlateNumber] = useState(vehicle.plate_number)
  const [carModel, setCarModel] = useState(vehicle.car_model)
  const [telegramEnabled, setTelegramEnabled] = useState(vehicle.telegram_enabled)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true)
    setError('')
    const res = await updateVehicle(vehicle.id, {
      plate_number: plateNumber.trim(),
      car_model: carModel.trim(),
      telegram_enabled: telegramEnabled,
    })
    setLoading(false)
    if (!res.success) {
      setError(res.error?.message || 'Ошибка сохранения')
      return
    }
    onSaved()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-lg font-bold mb-4">Редактировать автомобиль</h2>
      <div className="space-y-3">
        <Input label="Гос. номер" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
        <Input label="Марка / модель" value={carModel} onChange={(e) => setCarModel(e.target.value)} />
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={telegramEnabled}
            onChange={(e) => setTelegramEnabled(e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          <div>
            <p className="text-sm font-medium">Telegram уведомления</p>
            <p className="text-xs text-gray-400">Получать сообщения через бот</p>
          </div>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex gap-3 mt-4">
        <Button variant="secondary" onClick={onClose} className="flex-1">Отмена</Button>
        <Button onClick={handleSave} loading={loading} className="flex-1">Сохранить</Button>
      </div>
    </ModalOverlay>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PageLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-10 pb-16 px-4 text-center">
        <h1 className="text-white text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-blue-100 text-sm mt-1">{subtitle}</p>}
      </div>
      <Container className="-mt-10 flex-1">
        {children}
      </Container>
    </div>
  )
}

function ModalOverlay({
  onClose,
  children,
}: {
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl">
        {children}
      </div>
    </div>
  )
}

const socialIconBg: Record<string, string> = {
  phone:    'bg-blue-100 text-blue-600',
  whatsapp: 'bg-green-100 text-green-600',
  instagram:'bg-pink-100 text-pink-600',
  telegram: 'bg-sky-100 text-sky-500',
  vk:       'bg-blue-100 text-blue-700',
  facebook: 'bg-blue-100 text-blue-800',
}

function ContactRow({
  icon,
  label,
  value,
  href,
  children,
}: {
  icon: string
  label: string
  value: string
  href?: string
  children?: React.ReactNode
}) {
  const inner = (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${socialIconBg[icon] || 'bg-gray-100 text-gray-500'}`}>
        <SocialSVG type={icon} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-medium text-sm truncate">{value}</p>
      </div>
      {children}
      {href && (
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    )
  }
  return inner
}

function SocialSVG({ type }: { type: string }) {
  if (type === 'phone') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
  )
  if (type === 'whatsapp') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
  if (type === 'instagram') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
  if (type === 'telegram') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
  if (type === 'vk') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.762-.491h1.744c.525 0 .643.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.745-.576.745z"/>
    </svg>
  )
  if (type === 'facebook') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
  return null
}
