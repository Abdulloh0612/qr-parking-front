import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getQRData, sendMessage } from '@/shared/api/endpoints'
import { PageLoader } from '@/shared/ui/Loader'
import { Button } from '@/shared/ui/Button'
import { ContactRow } from '@/entities/user/ui/ContactRow'
import { formatPhoneDisplay } from '@/shared/lib/formatters'
import type { QROwner } from '@/shared/types/api'

export function ContactPage() {
  const { id } = useParams<{ id: string }>()
  const [owner,     setOwner]     = useState<QROwner | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [message,   setMessage]   = useState('')
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [sendError, setSendError] = useState('')

  useEffect(() => {
    if (!id) { setError('QR код не найден'); setLoading(false); return }
    void (async () => {
      const res = await getQRData(id)
      setLoading(false)
      if (!res.success || !res.data) { setError(res.error?.message || 'QR код не найден'); return }
      if (!res.data.registered || !res.data.owner) { setError('QR код не зарегистрирован'); return }
      setOwner(res.data.owner)
    })()
  }, [id])

  async function handleSend() {
    if (!message.trim() || !id) return
    setSending(true); setSendError('')
    const res = await sendMessage(id, message.trim())
    setSending(false)
    if (!res.success) { setSendError(res.error?.message || 'Ошибка отправки'); return }
    setSent(true); setMessage('')
  }

  if (loading) return <PageLoader />

  if (error || !owner) {
    return (
      <div className="min-h-dvh bg-app flex items-center justify-center p-4">
        <div className="card max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(244,63,94,0.1)' }}>
            <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">QR код не найден</h2>
          <p className="text-sm text-slate-500">{error || 'Проверьте правильность QR кода'}</p>
        </div>
      </div>
    )
  }

  const name = [owner.first_name, owner.last_name].filter(Boolean).join(' ') || 'Владелец'
  const carInfo = [owner.vehicle_brand, owner.vehicle_number].filter(Boolean).join(' · ')

  const contacts = [
    { type: 'phone',     label: 'Телефон',   value: formatPhoneDisplay(owner.phone), href: `tel:${owner.phone}` },
    owner.whatsapp  && { type: 'whatsapp',  label: 'WhatsApp',  value: formatPhoneDisplay(owner.whatsapp), href: `https://wa.me/${owner.whatsapp.replace(/\D/g,'')}` },
    owner.instagram && { type: 'instagram', label: 'Instagram', value: `@${owner.instagram.replace(/^@/,'')}`, href: `https://instagram.com/${owner.instagram.replace(/^@/,'')}` },
    owner.telegram  && { type: 'telegram',  label: 'Telegram',  value: owner.telegram, href: `https://t.me/${owner.telegram.replace(/^@/,'')}` },
    owner.vk        && { type: 'vk',        label: 'VK',        value: owner.vk, href: `https://vk.com/${owner.vk}` },
    owner.facebook  && { type: 'facebook',  label: 'Facebook',  value: owner.facebook, href: `https://facebook.com/${owner.facebook}` },
  ].filter(Boolean) as { type: string; label: string; value: string; href: string }[]

  return (
    <div className="min-h-dvh bg-app flex flex-col">
      {/* Hero */}
      <div className="hero-gradient relative overflow-hidden pt-14 pb-24 px-5 text-center">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-6"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-white/70 text-xs font-bold tracking-[0.15em] uppercase">QR Parking</span>
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-4">
            {owner.avatar_url ? (
              <img src={owner.avatar_url} alt={name}
                className="w-24 h-24 rounded-3xl object-cover"
                style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.3)' }} />
            ) : (
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                {name.split(' ').map((w) => w[0]).join('').slice(0,2).toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="text-[26px] font-bold text-white tracking-tight">{name}</h1>
          {carInfo && (
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h10l2-2zM14 8l2 4h3l-2-4h-3z" />
              </svg>
              <span className="text-white/90 text-sm font-semibold font-mono">{carInfo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 -mt-10 flex-1">
        <div className="max-w-md mx-auto px-4 pb-8 space-y-3">
          {/* Contacts */}
          <div className="card overflow-hidden">
            <div className="px-5 pt-4 pb-1">
              <p className="section-label">Контакты</p>
            </div>
            <div className="px-2 pb-2">
              {contacts.map((c, i) => (
                <ContactRow key={i} type={c.type} label={c.label} value={c.value} href={c.href} />
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="card p-5">
            <p className="section-label mb-1">Сообщение владельцу</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>Уведомление придёт в Telegram</p>

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8 text-center">
                  <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: 'var(--success)' }}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-bold text-slate-800 text-[17px]">Сообщение отправлено</p>
                  <p className="text-sm text-slate-400 mt-1">Владелец получил уведомление</p>
                  <button
                    className="mt-5 text-sm font-semibold transition-colors"
                    style={{ color: 'var(--accent)' }}
                    onClick={() => setSent(false)}>Отправить ещё</button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <textarea
                    rows={3}
                    placeholder="Ваше сообщение..."
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); setSendError('') }}
                    className="input-base resize-none"
                  />
                  {sendError && <p className="text-sm text-rose-500 font-medium">{sendError}</p>}
                  <Button fullWidth loading={sending} disabled={!message.trim()} onClick={() => void handleSend()}>
                    Отправить сообщение
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
