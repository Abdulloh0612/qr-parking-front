import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Container } from '@/components/layout/Container'
import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/Card'
import { Loader } from '@/components/ui/Loader'
import { PageTransition } from '@/components/animations/PageTransition'
import { StatCard } from '@/features/account/components/StatCard'
import { MessagesList } from '@/features/account/components/MessagesList'
import { useAccountData } from '@/features/account/hooks/useAccountData'
import { formatPhoneDisplay } from '@/lib/utils/formatters'
import { EditProfileModal } from '@/features/account/components/EditProfileModal'
import { useSearchParams } from 'react-router-dom'
import { getPublicProfile } from '@/lib/api/endpoints'

export function AccountPage() {
  const [searchParams] = useSearchParams()
  const publicId = searchParams.get('id')
  const { user, messages, loading, error, reload } = useAccountData()
  const [activeTab, setActiveTab] = useState<'info' | 'messages'>('info')
  const [editOpen, setEditOpen] = useState(false)
  const [publicLoading, setPublicLoading] = useState(false)
  const [publicError, setPublicError] = useState<string | null>(null)
  const [publicProfile, setPublicProfile] = useState<Awaited<ReturnType<typeof getPublicProfile>>['data'] | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!publicId) {
        setPublicProfile(null)
        setPublicError(null)
        return
      }
      setPublicLoading(true)
      setPublicError(null)
      const res = await getPublicProfile(publicId)
      if (cancelled) return
      if (!res.success) {
        setPublicError(res.error?.message || 'Профиль не найден')
        setPublicProfile(null)
      } else {
        setPublicProfile(res.data)
      }
      setPublicLoading(false)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [publicId])

  const shouldShowPublic = useMemo(() => {
    if (!publicId) return false
    if (publicLoading) return true
    if (publicError) return true
    if (!publicProfile) return true
    return !publicProfile.is_owner
  }, [publicError, publicId, publicLoading, publicProfile])

  if (publicId && shouldShowPublic) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col">
          <Header title="Профиль" />
          <Container className="py-6 flex-1">
            {publicLoading && (
              <Card className="text-center">
                <Loader size="lg" text="Загрузка..." />
              </Card>
            )}
            {!publicLoading && (publicError || !publicProfile) && (
              <Card className="text-center">
                <p className="text-gray-700">{publicError || 'Профиль не найден'}</p>
              </Card>
            )}
            {!publicLoading && publicProfile && (
              <>
                <Card className="mb-6">
                  <div className="flex items-center gap-4">
                    {publicProfile.avatar_url ? (
                      <img
                        src={publicProfile.avatar_url}
                        alt="avatar"
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {publicProfile.first_name?.[0] || 'U'}
                        {publicProfile.last_name?.[0] || ''}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold">
                        {publicProfile.first_name} {publicProfile.last_name}
                      </h2>
                      <p className="text-gray-500 text-sm">{formatPhoneDisplay(publicProfile.phone)}</p>
                    </div>
                  </div>
                  {(publicProfile.vehicle_brand || publicProfile.vehicle_number) && (
                    <div className="pt-4 border-t border-gray-200 mt-4">
                      <p className="text-xs text-gray-500 mb-0.5">Автомобиль</p>
                      <p className="font-medium">
                        {publicProfile.vehicle_brand || '—'} • {publicProfile.vehicle_number || '—'}
                      </p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-200 mt-4 flex items-center gap-2 text-gray-500 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>QR отсканирован <strong>{publicProfile.scan_count}</strong> раз</span>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold mb-4">Контакты</h3>
                  <div className="space-y-2">
                    <SocialRow icon="phone" label="Телефон" value={formatPhoneDisplay(publicProfile.phone)} />
                    {publicProfile.whatsapp && (
                      <SocialRow icon="whatsapp" label="WhatsApp" value={formatPhoneDisplay(publicProfile.whatsapp)} />
                    )}
                    {publicProfile.instagram && (
                      <SocialRow icon="instagram" label="Instagram" value={`@${publicProfile.instagram.replace(/^@/, '')}`} />
                    )}
                    {publicProfile.telegram && (
                      <SocialRow icon="telegram" label="Telegram" value={publicProfile.telegram}>
                        {publicProfile.telegram_enabled && (
                          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                            Бот активен
                          </span>
                        )}
                      </SocialRow>
                    )}
                    {publicProfile.vk && <SocialRow icon="vk" label="VK" value={publicProfile.vk} />}
                    {publicProfile.facebook && <SocialRow icon="facebook" label="Facebook" value={publicProfile.facebook} />}
                  </div>
                </Card>
              </>
            )}
          </Container>
          <Footer />
        </div>
      </PageTransition>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Мой профиль" />
        <Container className="flex-1 flex items-center justify-center">
          <Loader size="lg" text="Загрузка..." />
        </Container>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Мой профиль" />
        <Container className="flex-1 flex items-center justify-center">
          <Card className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-700">{error || 'Аккаунт не найден'}</p>
          </Card>
        </Container>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Header title="Мой профиль" />
        <Container className="py-6 flex-1">

          {/* ── Карточка профиля ─────────────────────────────────── */}
          <Card className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="avatar"
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {user.first_name[0]}{user.last_name[0]}
                </div>
                )}
                <div>
                  <h2 className="text-xl font-bold">{user.first_name} {user.last_name}</h2>
                  <p className="text-gray-500 text-sm">{formatPhoneDisplay(user.phone)}</p>
                </div>
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Изменить
              </button>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-0.5">Автомобиль</p>
              <p className="font-medium">{user.vehicle_brand} • {user.vehicle_number}</p>
            </div>
          </Card>

          <EditProfileModal
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            user={user}
            onUpdated={reload}
          />

          {/* ── Статистика ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
              label="Сканирований"
              value={user.scan_count}
              color="blue"
            />
            <StatCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              label="Сообщений"
              value={messages.length}
              color="primary"
            />
          </div>

          {/* ── Табы ─────────────────────────────────────────────── */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2 px-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'info'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'glass hover:bg-white/60'
              }`}
            >
              Контакты
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-2 px-3 rounded-xl font-medium text-sm transition-all relative ${
                activeTab === 'messages'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'glass hover:bg-white/60'
              }`}
            >
              Сообщения
              {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {messages.length}
                </span>
              )}
            </button>
          </div>

          {/* ── Контакты ─────────────────────────────────────────── */}
          {activeTab === 'info' && (
            <Card>
              <h3 className="font-semibold mb-4">Мои контакты</h3>
              <div className="space-y-2">
                <SocialRow icon="phone" label="Телефон" value={formatPhoneDisplay(user.phone)} />
                {user.whatsapp && <SocialRow icon="whatsapp" label="WhatsApp" value={formatPhoneDisplay(user.whatsapp)} />}
                {user.instagram && <SocialRow icon="instagram" label="Instagram" value={`@${user.instagram.replace(/^@/, '')}`} />}
                {user.telegram && (
                  <SocialRow icon="telegram" label="Telegram" value={user.telegram}>
                    {user.telegram_enabled && (
                      <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">Бот активен</span>
                    )}
                  </SocialRow>
                )}
                {user.vk && <SocialRow icon="vk" label="VK" value={user.vk} />}
                {user.facebook && <SocialRow icon="facebook" label="Facebook" value={user.facebook} />}
              </div>
            </Card>
          )}

          {/* ── Сообщения ────────────────────────────────────────── */}
          {activeTab === 'messages' && <MessagesList messages={messages} />}

        </Container>
        <Footer />
      </div>
    </PageTransition>
  )
}

// ─── маленький хелпер-компонент ───────────────────────────────────────────────

function SocialRow({
  icon,
  label,
  value,
  children,
}: {
  icon: string
  label: string
  value: string
  children?: React.ReactNode
}) {
  const bg: Record<string, string> = {
    phone:    'bg-blue-100 text-blue-600',
    whatsapp: 'bg-green-100 text-green-600',
    instagram:'bg-pink-100 text-pink-600',
    telegram: 'bg-sky-100 text-sky-500',
    vk:       'bg-blue-100 text-blue-700',
    facebook: 'bg-blue-100 text-blue-800',
  }
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bg[icon] || 'bg-gray-100 text-gray-500'}`}>
        <SocialSVG type={icon} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-medium text-sm truncate">{value}</p>
      </div>
      {children}
    </div>
  )
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
