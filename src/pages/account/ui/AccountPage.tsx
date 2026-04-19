import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button }     from '@/shared/ui/Button'
import { Input }      from '@/shared/ui/Input'
import { Badge }      from '@/shared/ui/Badge'
import { PageLoader } from '@/shared/ui/Loader'
import { PhoneInput } from '@/shared/ui/PhoneInput'
import { EditProfileModal }  from '@/features/edit-profile/ui/EditProfileModal'
import { EditVehicleModal }  from '@/features/edit-vehicle/ui/EditVehicleModal'
import { formatPhoneDisplay } from '@/shared/lib/formatters'
import { validatePhone } from '@/shared/lib/validators'
import {
  getQRData, sendOtp, verifyOtp, sendMessage, uploadMedia,
  getMyProfile, updateMyProfile, updateVehicle, saveToken, getToken,
} from '@/shared/api/endpoints'
import type { QROwner, OwnProfile, Vehicle } from '@/shared/types/api'

type PageState =
  | 'loading' | 'not_found' | 'register_phone' | 'register_otp'
  | 'register_profile' | 'register_vehicle' | 'public_view' | 'owner_view'

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
  transition: { duration: 0.18, ease: 'easeOut' as const },
}

// ─── Layout primitives (dark theme — matches admin login) ────────────────────

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="hero-gradient" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}

function Hero({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, padding: '56px 20px 48px', textAlign: 'center' }}>
      {children}
    </div>
  )
}

function HeroTag({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--hero-border)',
        marginBottom: 24,
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.5)',
      }}>
        {text}
      </span>
    </div>
  )
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
      <div style={{ maxWidth: 448, margin: '0 auto', padding: '0 16px 32px' }}>
        {children}
      </div>
    </div>
  )
}

function HeroAvatar({ src, name }: { src?: string | null; name: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  if (src) {
    return (
      <img
        src={src} alt={name}
        style={{
          width: 80, height: 80,
          borderRadius: 'var(--r-xl)',
          objectFit: 'cover',
          border: '2px solid rgba(255,255,255,0.15)',
        }}
      />
    )
  }
  return (
    <div style={{
      width: 80, height: 80,
      borderRadius: 'var(--r-xl)',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Syne', sans-serif",
      fontSize: 28,
      fontWeight: 700,
      color: '#ffffff',
    }}>
      {initials}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AccountPage() {
  const [searchParams] = useSearchParams()
  const qrCode = searchParams.get('qr-code')

  const [state,       setState]       = useState<PageState>('loading')
  const [publicOwner, setPublicOwner] = useState<QROwner | null>(null)
  const [ownProfile,  setOwnProfile]  = useState<OwnProfile | null>(null)

  const [phone,      setPhone]      = useState('')
  const [otp,        setOtp]        = useState('')
  const [otpError,   setOtpError]   = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [sending,    setSending]    = useState(false)

  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editVehicleId,   setEditVehicleId]   = useState<string | null>(null)

  const [msgText,         setMsgText]         = useState('')
  const [msgSent,         setMsgSent]         = useState(false)
  const [msgError,        setMsgError]        = useState('')
  const [msgSending,      setMsgSending]      = useState(false)
  const [msgMediaFile,    setMsgMediaFile]    = useState<File | null>(null)
  const [msgMediaPreview, setMsgMediaPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!qrCode) { setState('not_found'); return }
    void init(qrCode)
  }, [qrCode])

  async function init(qrId: string) {
    setState('loading')
    const [qrRes, meRes] = await Promise.allSettled([
      getQRData(qrId),
      getToken() ? getMyProfile() : Promise.resolve(null),
    ])
    const qr = qrRes.status === 'fulfilled' ? qrRes.value : null
    const me = meRes.status === 'fulfilled' && meRes.value !== null ? meRes.value : null

    if (!qr?.success) { setState('not_found'); return }
    if (me?.success && me.data) {
      if (me.data.vehicles.some((v) => v.qr_code === qrId)) {
        setOwnProfile(me.data); setState('owner_view'); return
      }
    }
    if (!qr.data!.registered) { setState('register_phone'); return }
    setPublicOwner(qr.data!.owner)
    setState('public_view')
  }

  async function handleSendOtp() {
    if (!qrCode || !phone.trim()) { setPhoneError('Введите номер телефона'); return }
    if (!validatePhone(phone)) { setPhoneError('Неверный формат (+996XXXXXXXXX)'); return }
    setSending(true); setPhoneError('')
    const res = await sendOtp(qrCode, phone.trim())
    setSending(false)
    if (!res.success) { setPhoneError(res.error?.message || 'Ошибка отправки'); return }
    setState('register_otp')
  }

  async function handleVerifyOtp() {
    if (!qrCode || otp.length < 4) { setOtpError('Введите код из SMS'); return }
    setSending(true); setOtpError('')
    const res = await verifyOtp(qrCode, phone.trim(), otp.trim())
    setSending(false)
    if (!res.success) { setOtpError(res.error?.message || 'Неверный код'); return }
    const { access_token, is_new_user } = res.data!
    saveToken(access_token)
    const meRes = await getMyProfile()
    if (meRes.success && meRes.data) setOwnProfile(meRes.data)
    setState(is_new_user ? 'register_profile' : 'owner_view')
  }

  async function handleSendMessage() {
    if (!qrCode || !msgText.trim()) return
    setMsgSending(true); setMsgError('')
    let mediaUrl: string | null = null
    if (msgMediaFile) {
      const up = await uploadMedia(msgMediaFile)
      if (!up.success) { setMsgError('Ошибка загрузки файла'); setMsgSending(false); return }
      mediaUrl = up.data?.url ?? null
    }
    const res = await sendMessage(qrCode, msgText.trim(), mediaUrl)
    setMsgSending(false)
    if (!res.success) { setMsgError(res.error?.message || 'Ошибка отправки'); return }
    setMsgSent(true); setMsgText(''); setMsgMediaFile(null); setMsgMediaPreview(null)
  }

  if (state === 'loading') return <PageLoader />

  if (state === 'not_found') return (
    <Page>
      <Hero>
        <HeroTag text="QR Parking" />
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>
          Не найдено
        </p>
      </Hero>
      <Content>
        <SectionCard style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
            QR-код не найден. Проверьте правильность ссылки.
          </p>
        </SectionCard>
      </Content>
    </Page>
  )

  if (state === 'register_phone') return (
    <Page>
      <Hero>
        <HeroTag text="QR Parking" />
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
          Добро пожаловать
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Введите номер для входа</p>
      </Hero>
      <Content>
        <motion.div {...fade}>
          <SectionCard style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PhoneInput
              label="Номер телефона"
              value={phone}
              onChange={(v) => { setPhone(v); setPhoneError('') }}
              onKeyDown={(e) => e.key === 'Enter' && void handleSendOtp()}
              error={phoneError}
            />
            <Button fullWidth size="lg" onClick={() => void handleSendOtp()} loading={sending}>
              Получить код
            </Button>
          </SectionCard>
        </motion.div>
      </Content>
    </Page>
  )

  if (state === 'register_otp') return (
    <Page>
      <Hero>
        <HeroTag text="QR Parking" />
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
          Код из SMS
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
          Отправлен на {formatPhoneDisplay(phone)}
        </p>
      </Hero>
      <Content>
        <motion.div {...fade}>
          <SectionCard style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Код подтверждения"
              type="text"
              inputMode="numeric"
              placeholder="• • • • • •"
              maxLength={6}
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError('') }}
              onKeyDown={(e) => e.key === 'Enter' && void handleVerifyOtp()}
              error={otpError}
              className="text-center"
              style={{ fontSize: 24, letterSpacing: '0.4em', fontWeight: 700 }}
            />
            <Button fullWidth size="lg" onClick={() => void handleVerifyOtp()} loading={sending}>
              Подтвердить
            </Button>
            <button
              onClick={() => setState('register_phone')}
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', transition: 'color 150ms' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              ← Изменить номер
            </button>
          </SectionCard>
        </motion.div>
      </Content>
    </Page>
  )

  if (state === 'register_profile') return (
    <RegisterProfileStep
      profile={ownProfile}
      onDone={async (updated) => {
        setOwnProfile((prev) => (prev ? { ...prev, ...updated } : prev))
        setState(ownProfile?.vehicles.length ? 'register_vehicle' : 'owner_view')
      }}
    />
  )

  if (state === 'register_vehicle' && ownProfile) {
    const v = ownProfile.vehicles[0]
    if (!v) { setState('owner_view'); return null }
    return <RegisterVehicleStep vehicle={v} onDone={() => setState('owner_view')} />
  }

  if (state === 'public_view' && publicOwner) {
    return (
      <PublicView
        owner={publicOwner}
        msgText={msgText} setMsgText={setMsgText}
        msgSent={msgSent} msgError={msgError} msgSending={msgSending}
        msgMediaFile={msgMediaFile} msgMediaPreview={msgMediaPreview}
        onMediaChange={(file) => { setMsgMediaFile(file); setMsgMediaPreview(file ? URL.createObjectURL(file) : null) }}
        onSendMessage={() => void handleSendMessage()}
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

// ─── Shared card wrapper ──────────────────────────────────────────────────────

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--r-lg)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Register Profile Step ────────────────────────────────────────────────────

function RegisterProfileStep({ profile, onDone }: { profile: OwnProfile | null; onDone: (d: Partial<OwnProfile>) => void }) {
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName,  setLastName]  = useState(profile?.last_name  || '')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  async function save() {
    if (!firstName.trim() || firstName.trim().length < 2) { setError('Имя — минимум 2 символа'); return }
    if (/[^A-Za-zА-Яа-яЁёÀ-ÖØ-öø-ÿ\s'-]/.test(firstName)) { setError('Имя — только буквы'); return }
    if (lastName.trim() && /[^A-Za-zА-Яа-яЁёÀ-ÖØ-öø-ÿ\s'-]/.test(lastName)) { setError('Фамилия — только буквы'); return }
    setLoading(true)
    const res = await updateMyProfile({ first_name: firstName.trim(), last_name: lastName.trim() })
    setLoading(false)
    if (!res.success) { setError(res.error?.message || 'Ошибка сохранения'); return }
    onDone({ first_name: firstName.trim(), last_name: lastName.trim() })
  }

  return (
    <Page>
      <Hero>
        <HeroTag text="QR Parking" />
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
          Ваш профиль
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Как к вам обращаться?</p>
      </Hero>
      <Content>
        <motion.div {...fade}>
          <SectionCard style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Имя" placeholder="Азамат" value={firstName}
                onChange={(e) => setFirstName(e.target.value.replace(/[^A-Za-zА-Яа-яЁёÀ-ÖØ-öø-ÿ\s'-]/g, ''))}
                error={!firstName.trim() && error ? error : ''} />
              <Input label="Фамилия" placeholder="Исаков" value={lastName}
                onChange={(e) => setLastName(e.target.value.replace(/[^A-Za-zА-Яа-яЁёÀ-ÖØ-öø-ÿ\s'-]/g, ''))} />
            </div>
            {error && firstName.trim() && <p style={{ fontSize: 12, color: '#ff6b6b', margin: 0 }}>{error}</p>}
            <Button fullWidth size="lg" onClick={() => void save()} loading={loading}>Продолжить</Button>
          </SectionCard>
        </motion.div>
      </Content>
    </Page>
  )
}

// ─── Register Vehicle Step ────────────────────────────────────────────────────

function RegisterVehicleStep({ vehicle, onDone }: { vehicle: Vehicle; onDone: () => void }) {
  const [plate,   setPlate]   = useState(vehicle.plate_number || '')
  const [model,   setModel]   = useState(vehicle.car_model    || '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function save() {
    setLoading(true)
    const res = await updateVehicle(vehicle.id, { plate_number: plate.trim(), car_model: model.trim() })
    setLoading(false)
    if (!res.success) { setError(res.error?.message || 'Ошибка сохранения'); return }
    onDone()
  }

  return (
    <Page>
      <Hero>
        <HeroTag text="QR Parking" />
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
          Ваш автомобиль
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Укажите данные</p>
      </Hero>
      <Content>
        <motion.div {...fade}>
          <SectionCard style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Гос. номер"     placeholder="01KG001"    value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
            <Input label="Марка / модель" placeholder="Toyota Camry" value={model} onChange={(e) => setModel(e.target.value)} />
            {error && <p style={{ fontSize: 12, color: '#ff6b6b', margin: 0 }}>{error}</p>}
            <Button fullWidth size="lg" onClick={() => void save()} loading={loading}>Сохранить</Button>
            <button onClick={onDone}
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', transition: 'color 150ms' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
              Пропустить
            </button>
          </SectionCard>
        </motion.div>
      </Content>
    </Page>
  )
}

// ─── Public View ──────────────────────────────────────────────────────────────

function PublicView({
  owner, msgText, setMsgText, msgSent, msgError, msgSending,
  msgMediaFile, msgMediaPreview, onMediaChange, onSendMessage, onClaimQR,
}: {
  owner: QROwner
  msgText: string; setMsgText: (v: string) => void
  msgSent: boolean; msgError: string; msgSending: boolean
  msgMediaFile: File | null; msgMediaPreview: string | null
  onMediaChange: (f: File | null) => void
  onSendMessage: () => void; onClaimQR: () => void
}) {
  const name = [owner.first_name, owner.last_name].filter(Boolean).join(' ') || 'Владелец'
  const carInfo = [owner.vehicle_brand, owner.vehicle_number].filter(Boolean).join(' · ')
  const canMessage = owner.telegram_enabled && owner.telegram_bot_linked

  const contacts = [
    { type: 'phone',     label: 'Телефон',   value: formatPhoneDisplay(owner.phone), href: `tel:${owner.phone}` },
    owner.whatsapp  && { type: 'whatsapp',  label: 'WhatsApp',  value: formatPhoneDisplay(owner.whatsapp), href: `https://wa.me/${owner.whatsapp.replace(/\D/g,'')}` },
    owner.instagram && { type: 'instagram', label: 'Instagram', value: `@${owner.instagram.replace(/^@/,'')}`, href: `https://instagram.com/${owner.instagram.replace(/^@/,'')}` },
    owner.telegram  && { type: 'telegram',  label: 'Telegram',  value: owner.telegram, href: `https://t.me/${owner.telegram.replace(/^@/,'')}`,
      badge: owner.telegram_bot_linked ? <Badge variant="success" dot>Активен</Badge> : undefined },
    owner.vk        && { type: 'vk',        label: 'VK',        value: owner.vk,       href: `https://vk.com/${owner.vk}` },
    owner.facebook  && { type: 'facebook',  label: 'Facebook',  value: owner.facebook, href: `https://facebook.com/${owner.facebook}` },
  ].filter(Boolean) as { type: string; label: string; value: string; href: string; badge?: React.ReactNode }[]

  return (
    <Page>
      <Hero>
        <HeroTag text="QR Parking" />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <HeroAvatar src={owner.avatar_url} name={name} />
        </div>
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          {name}
        </p>
        {carInfo && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--hero-border)',
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
              {carInfo}
            </span>
          </div>
        )}
        {owner.scan_count > 0 && (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '8px 0 0' }}>
            {owner.scan_count} сканирований
          </p>
        )}
      </Hero>

      <Content>
        <AnimatePresence mode="wait">
          <motion.div key="pub" {...fade} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Vehicle photo */}
            {owner.vehicle_photo_url && (
              <SectionCard style={{ overflow: 'hidden' }}>
                <img src={owner.vehicle_photo_url} alt="vehicle"
                  style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
              </SectionCard>
            )}

            {/* Contacts */}
            <SectionCard>
              <div style={{ padding: '16px 20px 8px' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Контакты</span>
              </div>
              <div style={{ padding: '4px 12px 12px' }}>
                {contacts.map((c, i) => (
                  <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px',
                    borderBottom: i < contacts.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    textDecoration: 'none', transition: 'opacity 150ms',
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{c.label}</p>
                      <p style={{ fontSize: 14, color: '#ffffff', margin: '1px 0 0', fontWeight: 500 }}>{c.value}</p>
                    </div>
                    {c.badge}
                    <svg style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </SectionCard>

            {/* Message */}
            <SectionCard style={{ padding: 20 }}>
              <span style={{ display: 'block', marginBottom: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Написать сообщение</span>

              {!canMessage ? (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(217,119,6,0.1)',
                  border: '1px solid rgba(217,119,6,0.25)',
                  borderRadius: 'var(--r-md)',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <svg style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0, marginTop: 1 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p style={{ fontSize: 13, color: '#f59e0b', margin: 0, lineHeight: 1.5 }}>
                    Владелец не подключил Telegram-бот. Используйте контакты выше.
                  </p>
                </div>
              ) : msgSent ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--r-lg)',
                    background: 'rgba(11,163,75,0.12)', border: '1px solid rgba(11,163,75,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <svg style={{ width: 20, height: 20, color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#ffffff', margin: '0 0 4px' }}>
                    Сообщение отправлено
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Владелец получит уведомление</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <textarea
                    className="input-base"
                    style={{ resize: 'none' }}
                    rows={3}
                    placeholder="Напишите сообщение владельцу..."
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    maxLength={500}
                  />
                  {msgMediaPreview && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      {msgMediaFile?.type.startsWith('video/') ? (
                        <video src={msgMediaPreview} style={{ maxHeight: 128, borderRadius: 'var(--r-md)' }} controls />
                      ) : (
                        <img src={msgMediaPreview} alt="preview" style={{ maxHeight: 128, borderRadius: 'var(--r-md)', objectFit: 'cover' }} />
                      )}
                      <button onClick={() => onMediaChange(null)} style={{
                        position: 'absolute', top: -8, right: -8,
                        width: 22, height: 22, borderRadius: '50%',
                        background: '#ef4444', color: '#fff', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 12,
                      }}>×</button>
                    </div>
                  )}
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>
                    <input type="file" accept="image/*,video/*" style={{ display: 'none' }}
                      onChange={(e) => { const f = e.target.files?.[0] ?? null; onMediaChange(f); e.target.value = '' }} />
                    <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {msgMediaFile ? msgMediaFile.name : 'Прикрепить файл'}
                  </label>
                  {msgError && <p style={{ fontSize: 12, color: '#ff6b6b', margin: 0 }}>{msgError}</p>}
                  <Button fullWidth size="lg" onClick={onSendMessage} loading={msgSending} disabled={!msgText.trim()}>
                    Отправить сообщение
                  </Button>
                </div>
              )}
            </SectionCard>

            <button onClick={onClaimQR} style={{
              width: '100%', fontSize: 13, color: 'rgba(255,255,255,0.35)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 0', textAlign: 'center',
              transition: 'color 150ms',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
              Это мой QR-код →
            </button>
          </motion.div>
        </AnimatePresence>
      </Content>
    </Page>
  )
}

// ─── Owner View ───────────────────────────────────────────────────────────────

function OwnerView({
  profile, editProfileOpen, setEditProfileOpen, editVehicleId, setEditVehicleId, onProfileUpdated,
}: {
  profile: OwnProfile
  editProfileOpen: boolean; setEditProfileOpen: (v: boolean) => void
  editVehicleId: string | null; setEditVehicleId: (v: string | null) => void
  onProfileUpdated: () => Promise<void>
}) {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Профиль'

  const hasSocials = profile.whatsapp || profile.instagram || profile.telegram || profile.vk || profile.facebook
  const socialEntries = [
    profile.whatsapp  && { type: 'whatsapp',  label: 'WhatsApp',  value: formatPhoneDisplay(profile.whatsapp), href: `https://wa.me/${profile.whatsapp.replace(/\D/g,'')}` },
    profile.instagram && { type: 'instagram', label: 'Instagram', value: `@${profile.instagram.replace(/^@/,'')}`, href: `https://instagram.com/${profile.instagram.replace(/^@/,'')}` },
    profile.telegram  && { type: 'telegram',  label: 'Telegram',  value: profile.telegram, href: `https://t.me/${profile.telegram.replace(/^@/,'')}` },
    profile.vk        && { type: 'vk',        label: 'VK',        value: profile.vk, href: `https://vk.com/${profile.vk}` },
    profile.facebook  && { type: 'facebook',  label: 'Facebook',  value: profile.facebook, href: `https://facebook.com/${profile.facebook}` },
  ].filter(Boolean) as { type: string; label: string; value: string; href: string }[]

  return (
    <Page>
      <Hero>
        <HeroTag text="QR Parking" />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <HeroAvatar src={profile.avatar_url} name={name} />
        </div>
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {name}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>
          {formatPhoneDisplay(profile.phone)}
        </p>
      </Hero>

      <Content>
        <motion.div {...fade} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Section: Profile Info ── */}
          <SectionCard>
            <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Профиль</span>
              <button
                onClick={() => setEditProfileOpen(true)}
                style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--accent)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px 0', transition: 'opacity 150ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Изменить
              </button>
            </div>
            <div style={{ padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px', fontWeight: 500 }}>Имя</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', margin: 0 }}>{profile.first_name || '—'}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px', fontWeight: 500 }}>Фамилия</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', margin: 0 }}>{profile.last_name || '—'}</p>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px', fontWeight: 500 }}>Телефон</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', margin: 0 }}>{formatPhoneDisplay(profile.phone)}</p>
              </div>
            </div>
          </SectionCard>

          {/* ── Section: Vehicles ── */}
          <SectionCard>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                Мои автомобили ({profile.vehicles.length})
              </span>
            </div>
            {profile.vehicles.length === 0 ? (
              <div style={{ padding: '0 20px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Нет зарегистрированных автомобилей</p>
              </div>
            ) : (
              <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {profile.vehicles.map((v) => (
                  <div key={v.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-md)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', margin: 0, fontFamily: 'monospace', letterSpacing: '0.04em' }}>{v.plate_number || '—'}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>{v.car_model || '—'}</p>
                    </div>
                    <button
                      onClick={() => setEditVehicleId(v.id)}
                      style={{
                        fontSize: 12, fontWeight: 600, color: 'var(--accent)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '4px 0', flexShrink: 0,
                      }}
                    >
                      Изменить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Section: Social Networks ── */}
          <SectionCard>
            <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Социальные сети</span>
              <button
                onClick={() => setEditProfileOpen(true)}
                style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--accent)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px 0', transition: 'opacity 150ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Настроить
              </button>
            </div>
            {!hasSocials ? (
              <div style={{ padding: '12px 20px 20px' }}>
                <div style={{
                  padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-md)',
                  border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center',
                }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '0 0 8px' }}>
                    Добавьте контакты, чтобы с вами могли связаться
                  </p>
                  <button
                    onClick={() => setEditProfileOpen(true)}
                    style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--accent)',
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}
                  >
                    + Добавить контакт
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {socialEntries.map((c, i) => (
                  <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px',
                    borderBottom: i < socialEntries.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    textDecoration: 'none', transition: 'opacity 150ms',
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{c.label}</p>
                      <p style={{ fontSize: 14, color: '#ffffff', margin: '1px 0 0', fontWeight: 500 }}>{c.value}</p>
                    </div>
                    <svg style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Quick stats ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <SectionCard style={{ padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 2px', fontFamily: "'Syne', sans-serif" }}>
                {profile.vehicles.length}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 500 }}>Автомобилей</p>
            </SectionCard>
            <SectionCard style={{ padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 2px', fontFamily: "'Syne', sans-serif" }}>
                {socialEntries.length}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 500 }}>Контактов</p>
            </SectionCard>
          </div>

        </motion.div>
      </Content>

      <EditProfileModal
        profile={profile}
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onSaved={async () => { setEditProfileOpen(false); await onProfileUpdated() }}
      />

      {editVehicleId && (
        <EditVehicleModal
          vehicle={profile.vehicles.find((v) => v.id === editVehicleId)!}
          isOpen={!!editVehicleId}
          onClose={() => setEditVehicleId(null)}
          onSaved={async () => { setEditVehicleId(null); await onProfileUpdated() }}
        />
      )}
    </Page>
  )
}
