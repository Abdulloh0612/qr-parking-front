import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { Badge } from '@/shared/ui/Badge'
import { formatDate, formatPhoneDisplay } from '@/shared/lib/formatters'
import {
  adminGetDashboard, adminGetUsers, adminGetUserDetail, adminUpdateUser, adminBlockUser,
  adminGetQRCodes, adminGenerateQR, adminBlockQR, adminGetMessages, adminGetDashboardChart,
  adminUpdateVehicle, adminGetMe, adminListAdmins, adminCreateAdmin, adminPatchAdmin,
  adminBlockAdminAccount,
} from '@/shared/api/endpoints'
import type {
  DashboardStats, DashboardChartSeries, AdminRole, AdminAccount,
  AdminClient, AdminMessage, AdminQRCode, AdminUserDetail,
} from '@/shared/types/api'

// ─── QR download ──────────────────────────────────────────────────────────────

function downloadSvgAsImage(svgEl: SVGElement, filename: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 400; canvas.height = 400
  const ctx = canvas.getContext('2d')
  const img = new Image()
  const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: 'image/svg+xml;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  img.onload = () => {
    if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,400,400); ctx.drawImage(img,0,0,400,400) }
    URL.revokeObjectURL(url)
    const a = document.createElement('a'); a.download = filename; a.href = canvas.toDataURL('image/png'); a.click()
  }
  img.src = url
}

// ─── Toast feedback ───────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', top: 16, right: 16, zIndex: 1000,
        padding: '10px 16px', borderRadius: 'var(--r-md)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
        background: type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
        color: type === 'success' ? 'var(--success)' : 'var(--error)',
        border: `1px solid ${type === 'success' ? 'var(--success-border)' : 'var(--error-border)'}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <svg style={{ width: 14, height: 14, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {type === 'success' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        )}
      </svg>
      {message}
    </div>
  )
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({ data, loading }: { data: { date: string; count: number }[]; loading?: boolean }) {
  const safe = (data || []).map((d) => ({ date: String(d?.date ?? ''), count: Number(d?.count ?? 0) || 0 })).filter((d) => d.date.length > 0)

  if (loading) {
    return (
      <div style={{ height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%' }} />
      </div>
    )
  }

  if (!safe.length) {
    return (
      <div style={{ height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Нет данных за этот период
      </div>
    )
  }

  const max = Math.max(...safe.map((d) => d.count), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 128, width: '100%', overflow: 'hidden' }}>
      {safe.map((d) => {
        const pct = Math.max((d.count / max) * 100, 4)
        return (
          <div key={d.date} className="group" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{
              width: '100%', height: `${pct}%`, minHeight: 2,
              background: 'var(--accent)', borderRadius: '2px 2px 0 0',
              transition: 'background 150ms ease',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
            />
            <div style={{
              position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
              marginBottom: 6, padding: '4px 8px', borderRadius: 'var(--r-sm)',
              background: 'var(--text)', color: '#ffffff', fontSize: 11, fontWeight: 500,
              whiteSpace: 'nowrap', pointerEvents: 'none', opacity: 0,
              transition: 'opacity 150ms ease',
            }} className="group-hover:!opacity-100">
              {d.count} · {d.date.slice(5)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

const statColors = {
  blue:   { bg: '#eff6ff', color: 'var(--accent)' },
  green:  { bg: 'var(--success-bg)', color: 'var(--success)' },
  yellow: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  red:    { bg: 'var(--error-bg)', color: 'var(--error)' },
  purple: { bg: '#f5f3ff', color: '#7c3aed' },
  gray:   { bg: 'var(--surface-3)', color: 'var(--text-3)' },
}

function StatCard({ label, value, icon, color = 'blue', onClick }: {
  label: string; value: number | string; icon: React.ReactNode
  color?: keyof typeof statColors; onClick?: () => void
}) {
  const c = statColors[color]
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? ('button' as const) : undefined}
      onClick={onClick}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
        padding: 16, display: 'flex', alignItems: 'center', gap: 12,
        textAlign: 'left' as const, width: '100%', cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 150ms ease',
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.borderColor = 'var(--border-2)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--r-md)',
        background: c.bg, color: c.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: "'Syne', sans-serif" }}>{value}</p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, fontWeight: 500 }} className="truncate">{label}</p>
      </div>
    </Comp>
  )
}

// ─── QR modal ─────────────────────────────────────────────────────────────────

function QRModal({ isOpen, onClose, qrCode }: { isOpen: boolean; onClose: () => void; qrCode: string }) {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrUrl = `https://qr-parking.abdullokh.com/account?qr-code=${qrCode}`
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR код">
      <div style={{ textAlign: 'center' }} className="space-y-5">
        <div ref={qrRef} style={{
          display: 'inline-block', padding: 20, background: '#ffffff',
          borderRadius: 'var(--r-lg)', border: '1px solid var(--border)',
        }}>
          <QRCodeSVG value={qrUrl} size={200} level="H" />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-3)', wordBreak: 'break-all', fontFamily: 'monospace', background: 'var(--surface-2)', padding: 12, borderRadius: 'var(--r-md)' }}>
          {qrUrl}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => void navigator.clipboard.writeText(qrUrl)}
            style={{
              flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600,
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              background: 'var(--surface)', cursor: 'pointer', transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-2)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            Копировать
          </button>
          <Button className="flex-1" onClick={() => {
            const svg = qrRef.current?.querySelector('svg')
            if (svg) downloadSvgAsImage(svg, `qr-${qrCode}.png`)
          }}>Скачать PNG</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── User detail drawer (right panel) ─────────────────────────────────────────

function UserDetailDrawer({ isOpen, onClose, userId, onUpdated, onToast, onAuthExpired }: {
  isOpen: boolean; onClose: () => void; userId: string | null; onUpdated: () => void
  onToast: (msg: string, type: 'success' | 'error') => void
  onAuthExpired: () => void
}) {
  const [detail,          setDetail]         = useState<AdminUserDetail | null>(null)
  const [loading,         setLoading]        = useState(false)
  const [loadError,       setLoadError]      = useState('')
  const [editing,         setEditing]        = useState(false)
  const [editData,        setEditData]       = useState({ first_name: '', last_name: '', phone: '' })
  const [saving,          setSaving]         = useState(false)
  const [activeTab,       setActiveTab]      = useState<'info' | 'vehicles' | 'messages' | 'qrcodes'>('info')
  const [qrPreview,       setQrPreview]      = useState<string | null>(null)
  const [editingVehicleId,setEditingVehicleId]= useState<string | null>(null)
  const [vehicleEditData, setVehicleEditData]= useState({ plate_number: '', car_model: '', is_public: true })
  const [savingVehicle,   setSavingVehicle]  = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [isOpen, onClose])

  function loadUser(uid: string) {
    setLoading(true); setDetail(null); setLoadError('')
    adminGetUserDetail(uid).then((res) => {
      setLoading(false)
      const user = res.data?.data
      if (res.success && user) {
        setDetail(user)
        setEditData({ first_name: user.first_name, last_name: user.last_name, phone: user.phone })
      } else {
        if (res.error?.code === 'AUTH_EXPIRED') { onAuthExpired(); return }
        setLoadError(res.error?.message || 'Не удалось загрузить данные пользователя')
      }
    })
  }

  useEffect(() => {
    if (!isOpen || !userId) return
    setEditing(false); setEditingVehicleId(null); setActiveTab('info')
    loadUser(userId)
  }, [isOpen, userId])

  async function handleSave() {
    if (!userId) return; setSaving(true)
    const res = await adminUpdateUser(userId, editData); setSaving(false)
    if (res.success) {
      setEditing(false); onUpdated()
      if (detail) setDetail({ ...detail, ...editData })
      onToast('Профиль обновлён', 'success')
    } else {
      onToast(res.error?.message || 'Ошибка сохранения', 'error')
    }
  }

  async function handleSaveVehicle() {
    if (!editingVehicleId || !userId) return; setSavingVehicle(true)
    const res = await adminUpdateVehicle(editingVehicleId, vehicleEditData); setSavingVehicle(false)
    if (res.success && detail) {
      setDetail({ ...detail, vehicles: detail.vehicles.map((v) => v.display_id === editingVehicleId ? { ...v, ...vehicleEditData } : v) })
      setEditingVehicleId(null)
      onToast('Машина обновлена', 'success')
    } else {
      onToast(res.error?.message || 'Ошибка сохранения', 'error')
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600,
    borderRadius: 'var(--r-md)', cursor: 'pointer', border: 'none',
    background: active ? 'var(--surface)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text-3)',
    transition: 'all 150ms ease',
  })

  const vehicles = detail?.vehicles ?? []
  const detailMessages = detail?.messages ?? []
  const qrCodes = detail?.qr_codes ?? []

  const tabs = [
    { key: 'info'     as const, label: 'Профиль' },
    { key: 'vehicles' as const, label: `Машины (${vehicles.length})` },
    { key: 'messages' as const, label: `Сообщ. (${detailMessages.length})` },
    { key: 'qrcodes'  as const, label: `QR (${qrCodes.length})` },
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.3)',
            transition: 'opacity 200ms ease',
          }}
        />
      )}

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 51,
          width: '100%', maxWidth: 420,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: isOpen ? '-8px 0 24px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700,
            color: 'var(--text)', letterSpacing: '-0.02em', margin: 0,
          }}>
            {detail ? `${detail.first_name} ${detail.last_name}` : 'Клиент'}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)', background: 'var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-3)', flexShrink: 0,
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading && (
            <div style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
              <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%' }} />
            </div>
          )}

          {!loading && loadError && (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--r-lg)',
                background: 'var(--error-bg)', border: '1px solid var(--error-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <svg style={{ width: 20, height: 20, color: 'var(--error)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>Ошибка загрузки</p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 16px' }}>{loadError}</p>
              <Button size="sm" variant="secondary" onClick={() => { if (userId) loadUser(userId) }}>Повторить</Button>
            </div>
          )}

          {!loading && !loadError && detail && (
            <div className="space-y-5">
              {/* Profile header */}
              <div className="flex items-center gap-4">
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--r-lg)', background: 'var(--text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ffffff', fontSize: 20, fontWeight: 700, flexShrink: 0,
                }}>
                  {detail.first_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input value={editData.first_name} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} className="input-base flex-1" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="Имя" />
                        <input value={editData.last_name}  onChange={(e) => setEditData({ ...editData, last_name:  e.target.value })} className="input-base flex-1" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="Фамилия" />
                      </div>
                      <input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="input-base w-full" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="Телефон" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void handleSave()} loading={saving} className="flex-1">Сохранить</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditing(false)} className="flex-1">Отмена</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: 0 }} className="truncate">{detail.first_name} {detail.last_name}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '2px 0 0' }}>{formatPhoneDisplay(detail.phone)}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>С {formatDate(detail.created_at)}</p>
                    </div>
                  )}
                </div>
                {!editing && (
                  <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Изменить</Button>
                )}
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 2, background: 'var(--surface-3)', borderRadius: 'var(--r-lg)', padding: 3 }}>
                {tabs.map((t) => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabStyle(activeTab === t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Info tab */}
              {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Машин',     val: detail.vehicle_count   },
                    { label: 'Сообщений', val: detailMessages.length  },
                    { label: 'QR кодов',  val: qrCodes.length         },
                    { label: 'Статус',    val: detail.is_admin ? 'Админ' : 'Клиент' },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 12 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 2px' }}>{label}</p>
                      <p style={{ fontWeight: 700, color: 'var(--text)', margin: 0 }}>{val}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Vehicles tab */}
              {activeTab === 'vehicles' && (
                <div className="space-y-2">
                  {vehicles.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, padding: '24px 0' }}>Машин нет</p>
                  ) : vehicles.map((v) => editingVehicleId === v.display_id ? (
                    <div key={v.display_id} style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 12, border: '1px solid var(--border)' }} className="space-y-2">
                      <input value={vehicleEditData.plate_number} onChange={(e) => setVehicleEditData({ ...vehicleEditData, plate_number: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} className="input-base w-full" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="Номер машины" />
                      <input value={vehicleEditData.car_model} onChange={(e) => setVehicleEditData({ ...vehicleEditData, car_model: e.target.value })} className="input-base w-full" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="Модель" />
                      <label className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={vehicleEditData.is_public} onChange={(e) => setVehicleEditData({ ...vehicleEditData, is_public: e.target.checked })} />
                        Публичный профиль
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void handleSaveVehicle()} loading={savingVehicle} className="flex-1">Сохранить</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingVehicleId(null)} className="flex-1">Отмена</Button>
                      </div>
                    </div>
                  ) : (
                    <div key={v.display_id} style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{v.plate_number}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '2px 0 0' }}>{v.car_model}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={v.is_public ? 'success' : 'gray'}>{v.is_public ? 'Публичный' : 'Скрытый'}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingVehicleId(v.display_id); setVehicleEditData({ plate_number: v.plate_number, car_model: v.car_model, is_public: v.is_public }) }}>
                          Ред.
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Messages tab */}
              {activeTab === 'messages' && (
                <div className="space-y-2">
                  {detailMessages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, padding: '24px 0' }}>Сообщений нет</p>
                  ) : detailMessages.map((m) => (
                    <div key={m.id} style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 12 }} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, margin: 0 }}>{m.sender_name || m.sender_phone || 'Аноним'}</p>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{formatDate(m.created_at)}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text)', margin: 0 }}>{m.content}</p>
                      <Badge variant={m.is_delivered ? 'success' : 'gray'}>{m.is_delivered ? 'Доставлено' : 'Не доставлено'}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* QR codes tab */}
              {activeTab === 'qrcodes' && (
                <div className="space-y-2">
                  {qrCodes.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, padding: '24px 0' }}>QR нет</p>
                  ) : qrCodes.map((q) => (
                    <div key={q.id} style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text)', margin: 0 }}>{q.code}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>{formatDate(q.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={q.status === 'active' ? 'success' : q.status === 'blocked' ? 'error' : 'warning'}>
                          {q.status === 'active' ? 'Активный' : q.status === 'blocked' ? 'Заблок.' : 'Не зарег.'}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => setQrPreview(q.code)}>QR</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <QRModal isOpen={!!qrPreview} onClose={() => setQrPreview(null)} qrCode={qrPreview || ''} />
    </>
  )
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────

function SidebarItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 'var(--r-md)',
        background: active ? 'var(--sidebar-active-bg)' : 'transparent',
        color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
        border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
        transition: 'background 150ms ease, color 150ms ease',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--sidebar-hover-bg)'; e.currentTarget.style.color = 'var(--sidebar-text-hover)' } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)' } }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// ─── AdminPage ────────────────────────────────────────────────────────────────

type AdminTab = 'dashboard' | 'users' | 'messages' | 'qrcodes' | 'admins'

const tabMeta: Record<AdminTab, { label: string; icon: React.ReactNode }> = {
  dashboard: {
    label: 'Дашборд',
    icon: <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  },
  users: {
    label: 'Клиенты',
    icon: <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
  messages: {
    label: 'Сообщения',
    icon: <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  },
  qrcodes: {
    label: 'QR коды',
    icon: <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>,
  },
  admins: {
    label: 'Админы',
    icon: <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
}

export function AdminPage() {
  const navigate = useNavigate()

  const [tab,          setTab]         = useState<AdminTab>('dashboard')
  const [dashboard,    setDashboard]   = useState<DashboardStats | null>(null)
  const [chartSeries,  setChartSeries] = useState<DashboardChartSeries>('clients')
  const [chartPoints,  setChartPoints] = useState<{ date: string; count: number }[]>([])
  const [chartLoading, setChartLoading]= useState(false)
  const [users,        setUsers]       = useState<AdminClient[]>([])
  const [usersTotal,   setUsersTotal]  = useState(0)
  const [messages,     setMessages]    = useState<AdminMessage[]>([])
  const [qrcodes,      setQrcodes]     = useState<AdminQRCode[]>([])
  const [qrFilter,     setQrFilter]    = useState<'' | 'unregistered' | 'active' | 'blocked'>('')
  const [qrtotal,      setQrTotal]     = useState(0)
  const [qrLoading,    setQrLoading]   = useState(false)
  const [loading,      setLoading]     = useState(true)
  const [selectedUserId,  setSelectedUserId]  = useState<string | null>(null)
  const [qrModal,         setQrModal]         = useState<string | null>(null)
  const [generating,      setGenerating]      = useState(false)
  const [qrCount,         setQrCount]         = useState('10')
  const [generatedCodes,  setGeneratedCodes]  = useState<AdminQRCode[]>([])
  const [searchUser,      setSearchUser]      = useState('')
  const [sessionRole,     setSessionRole]     = useState<AdminRole | null>(() => {
    const raw = localStorage.getItem('admin_role')
    return raw === 'super_admin' || raw === 'admin' ? raw : null
  })
  const [admins,         setAdmins]        = useState<AdminAccount[]>([])
  const [adminsTotal,    setAdminsTotal]   = useState(0)
  const [createAdminOpen,setCreateAdminOpen]= useState(false)
  const [editAdmin,      setEditAdmin]     = useState<AdminAccount | null>(null)
  const [newAdminUser,   setNewAdminUser]  = useState('')
  const [newAdminPass,   setNewAdminPass]  = useState('')
  const [newAdminRole,   setNewAdminRole]  = useState<AdminRole>('admin')
  const [editAdminPass,  setEditAdminPass] = useState('')
  const [editAdminRole,  setEditAdminRole] = useState<AdminRole>('admin')
  const [adminFormError, setAdminFormError]= useState('')
  const [adminSaving,    setAdminSaving]   = useState(false)
  const [toast,          setToast]         = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [sidebarOpen,    setSidebarOpen]   = useState(false)
  const [blockingUser,   setBlockingUser]  = useState<string | null>(null)
  const [blockingQR,     setBlockingQR]    = useState<string | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }, [])

  const loadDashboard = useCallback(async () => {
    const res = await adminGetDashboard(30)
    if (res.success && res.data) setDashboard(res.data)
  }, [])

  const loadChart = useCallback(async (series: DashboardChartSeries) => {
    setChartLoading(true)
    const res = await adminGetDashboardChart(30, series)
    setChartPoints(res.success && res.data?.points ? res.data.points : [])
    setChartLoading(false)
  }, [])

  const loadUsers = useCallback(async () => {
    const res = await adminGetUsers(1, 100)
    if (res.success && res.data) { setUsers(res.data.data || []); setUsersTotal(res.data.total || 0) }
  }, [])

  const loadMessages = useCallback(async () => {
    const res = await adminGetMessages(1, 100)
    if (res.success && res.data) setMessages(res.data.data || [])
  }, [])

  const loadQRCodes = useCallback(async (status: '' | 'unregistered' | 'active' | 'blocked' = qrFilter) => {
    setQrLoading(true)
    const res = await adminGetQRCodes(status, 1, 100)
    setQrLoading(false)
    if (res.success && res.data) { setQrcodes(res.data.data || []); setQrTotal(res.data.total || 0) }
    return res
  }, [qrFilter])

  const loadAdmins = useCallback(async () => {
    const res = await adminListAdmins(1, 100)
    if (res.success && res.data) { setAdmins(res.data.data || []); setAdminsTotal(res.data.total || 0) }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadDashboard(), loadUsers(), loadMessages(), loadQRCodes(qrFilter),
      adminGetMe().then((res) => {
        const raw = localStorage.getItem('admin_role')
        const role = res.success && res.data?.role ? res.data.role : (raw === 'super_admin' || raw === 'admin' ? raw : 'admin') as AdminRole
        setSessionRole(role); localStorage.setItem('admin_role', role)
      })
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => { if (tab === 'dashboard') void loadChart(chartSeries) }, [tab, chartSeries, loadChart])
  async function handleQrFilterChange(newFilter: '' | 'unregistered' | 'active' | 'blocked') {
    if (newFilter === qrFilter || qrLoading) return
    const prevFilter = qrFilter
    setQrFilter(newFilter)
    const res = await loadQRCodes(newFilter)
    if (!res.success) {
      setQrFilter(prevFilter)
      showToast(res.error?.message || 'Ошибка загрузки', 'error')
    }
  }
  useEffect(() => { if (tab === 'admins' && sessionRole === 'super_admin') void loadAdmins() }, [tab, sessionRole, loadAdmins])
  useEffect(() => { if (tab === 'admins' && sessionRole !== 'super_admin') setTab('dashboard') }, [tab, sessionRole])

  async function handleGenerateQR() {
    const count = Math.max(1, Math.min(1000, parseInt(qrCount) || 10))
    setGenerating(true)
    const res = await adminGenerateQR(count); setGenerating(false)
    if (res.success && res.data) {
      setGeneratedCodes(res.data.data || [])
      showToast(`Сгенерировано ${res.data.data?.length ?? count} QR`, 'success')
      void loadQRCodes(qrFilter); void loadDashboard(); void loadChart(chartSeries)
    } else {
      showToast(res.error?.message || 'Ошибка генерации', 'error')
    }
  }

  async function handleBlockUser(userId: string) {
    if (!window.confirm('Заблокировать этого пользователя?')) return
    setBlockingUser(userId)
    const res = await adminBlockUser(userId)
    setBlockingUser(null)
    if (res.success) {
      showToast('Пользователь заблокирован', 'success')
      void loadUsers(); void loadDashboard()
    } else {
      showToast(res.error?.message || 'Ошибка блокировки', 'error')
    }
  }

  async function handleBlockQR(qrCode: string) {
    if (!window.confirm('Заблокировать этот QR код?')) return
    setBlockingQR(qrCode)
    const res = await adminBlockQR(qrCode)
    setBlockingQR(null)
    if (res.success) {
      showToast('QR заблокирован', 'success')
      void loadQRCodes(qrFilter); void loadDashboard()
    } else {
      showToast(res.error?.message || 'Ошибка блокировки', 'error')
    }
  }

  function logout() {
    localStorage.removeItem('admin_token'); localStorage.removeItem('admin_role')
    navigate('/admin/login', { replace: true })
  }

  function roleLabel(r: AdminRole) { return r === 'super_admin' ? 'Супер-админ' : 'Админ' }

  async function submitCreateAdmin() {
    setAdminFormError('')
    if (!newAdminUser.trim() || newAdminPass.length < 8) { setAdminFormError('Логин и пароль от 8 символов'); return }
    setAdminSaving(true)
    const res = await adminCreateAdmin({ username: newAdminUser.trim(), password: newAdminPass, role: newAdminRole })
    setAdminSaving(false)
    if (!res.success) { setAdminFormError(res.error?.message || 'Не удалось создать'); return }
    setCreateAdminOpen(false); setNewAdminUser(''); setNewAdminPass(''); setNewAdminRole('admin')
    showToast('Администратор создан', 'success')
    void loadAdmins()
  }

  async function submitEditAdmin() {
    if (!editAdmin) return; setAdminFormError(''); setAdminSaving(true)
    const body: { password?: string; role?: AdminRole } = { role: editAdminRole }
    if (editAdminPass.trim().length > 0) {
      if (editAdminPass.length < 8) { setAdminFormError('Пароль не менее 8 символов'); setAdminSaving(false); return }
      body.password = editAdminPass
    }
    const res = await adminPatchAdmin(editAdmin.display_id, body); setAdminSaving(false)
    if (!res.success) { setAdminFormError(res.error?.message || 'Ошибка'); return }
    setEditAdmin(null); setEditAdminPass('')
    showToast('Администратор обновлён', 'success')
    void loadAdmins()
  }

  async function handleRemoveAdmin(a: AdminAccount) {
    if (!window.confirm(`Удалить администратора «${a.username}»? Это действие нельзя отменить.`)) return
    const res = await adminBlockAdminAccount(a.display_id)
    if (!res.success) { showToast(res.error?.message || 'Ошибка удаления', 'error'); return }
    showToast('Администратор удалён', 'success')
    void loadAdmins()
  }

  const filteredUsers = useMemo(() => {
    if (!searchUser.trim()) return users
    const q = searchUser.toLowerCase()
    return users.filter((u) => u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q) || u.phone.includes(q))
  }, [users, searchUser])

  const visibleTabs = useMemo((): AdminTab[] => {
    const base: AdminTab[] = ['dashboard', 'users', 'messages', 'qrcodes']
    if (sessionRole === 'super_admin') base.push('admins')
    return base
  }, [sessionRole])

  // ── Loading state ──
  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 'var(--r-lg)', background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%' }} />
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: 13, fontWeight: 500 }}>Загрузка панели...</p>
      </div>
    </div>
  )

  // ── Styles ──
  const contentCard: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)', overflow: 'hidden',
  }

  const sectionTitle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700,
    color: 'var(--text)', letterSpacing: '-0.02em', margin: 0,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg)' }}>
      {/* ── Sidebar (desktop) ── */}
      <aside
        className="hidden md:flex"
        style={{
          width: 'var(--sidebar-width)', flexShrink: 0,
          background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)',
          flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100dvh', zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--r-md)',
              background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>Q</span>
            </div>
            <div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>QR Parking</p>
              {sessionRole && <p style={{ fontSize: 10, color: 'var(--sidebar-text)', margin: 0 }}>{roleLabel(sessionRole)}</p>}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visibleTabs.map((key) => (
            <SidebarItem
              key={key}
              icon={tabMeta[key].icon}
              label={key === 'users' ? `${tabMeta[key].label} (${usersTotal})` : key === 'messages' ? `${tabMeta[key].label} (${messages.length})` : key === 'admins' ? `${tabMeta[key].label} (${adminsTotal})` : tabMeta[key].label}
              active={tab === key}
              onClick={() => { setTab(key); setSidebarOpen(false) }}
            />
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--sidebar-border)' }}>
          <button
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 'var(--r-md)',
              background: 'transparent', color: 'var(--sidebar-text)', border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sidebar-text)'}
          >
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Выйти
          </button>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <div className="md:hidden" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--sidebar-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 'var(--topbar-height)',
      }}>
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: '#ffffff' }}>QR Parking</span>
          {sessionRole && <span style={{ fontSize: 10, color: 'var(--sidebar-text)' }}>{roleLabel(sessionRole)}</span>}
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 4 }}>
          <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile sidebar dropdown */}
      {sidebarOpen && (
        <div className="md:hidden" style={{
          position: 'fixed', top: 'var(--topbar-height)', left: 0, right: 0, zIndex: 49,
          background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--sidebar-border)',
          padding: '8px 8px 12px',
        }}>
          {visibleTabs.map((key) => (
            <SidebarItem
              key={key}
              icon={tabMeta[key].icon}
              label={tabMeta[key].label}
              active={tab === key}
              onClick={() => { setTab(key); setSidebarOpen(false) }}
            />
          ))}
          <div style={{ borderTop: '1px solid var(--sidebar-border)', marginTop: 8, paddingTop: 8 }}>
            <SidebarItem icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>} label="Выйти" active={false} onClick={logout} />
          </div>
        </div>
      )}

      {/* Sidebar spacer (matches fixed sidebar width on desktop) */}
      <div className="hidden md:block" style={{ width: 'var(--sidebar-width)', flexShrink: 0 }} />

      {/* ── Main content ── */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {/* Desktop topbar */}
        <div className="hidden md:flex" style={{
          position: 'sticky', top: 0, zIndex: 40,
          height: 'var(--topbar-height)',
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
        }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {tabMeta[tab].label}
          </h1>
          <div className="flex items-center gap-3">
            {sessionRole && <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{roleLabel(sessionRole)}</span>}
            <button
              onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 'var(--r-md)',
                background: 'transparent', border: '1px solid var(--border)',
                cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--text-2)',
                fontFamily: "'DM Sans', sans-serif", transition: 'border-color 150ms ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-2)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Выйти
            </button>
          </div>
        </div>

        {/* Mobile topbar spacer */}
        <div className="md:hidden" style={{ height: 'var(--topbar-height)' }} />

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px' }} className="space-y-6">

          {/* Toast */}
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

          {/* ── Dashboard ── */}
          {tab === 'dashboard' && dashboard && (
            <div className="space-y-6">
              <h2 style={sectionTitle}>Дашборд</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Клиентов"       value={dashboard.total_users}    color="blue"   onClick={() => setTab('users')}     icon={tabMeta.users.icon} />
                <StatCard label="QR кодов"       value={dashboard.total_qr_codes} color="purple" onClick={() => { setQrFilter(''); setTab('qrcodes'); void loadQRCodes('') }} icon={tabMeta.qrcodes.icon} />
                <StatCard label="Сообщений"      value={dashboard.total_messages} color="green"  onClick={() => setTab('messages')}  icon={tabMeta.messages.icon} />
                <StatCard label="Сканов сегодня" value={dashboard.scans_today}    color="yellow" onClick={() => { setQrFilter('active'); setTab('qrcodes'); void loadQRCodes('active') }} icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Активных QR"    value={dashboard.active_qr}       color="green"  onClick={() => { setQrFilter('active'); setTab('qrcodes'); void loadQRCodes('active') }}       icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard label="Незарег."       value={dashboard.unregistered_qr} color="yellow" onClick={() => { setQrFilter('unregistered'); setTab('qrcodes'); void loadQRCodes('unregistered') }} icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard label="Заблокировано"  value={dashboard.blocked_qr}      color="red"    onClick={() => { setQrFilter('blocked'); setTab('qrcodes'); void loadQRCodes('blocked') }}      icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} />
              </div>

              {/* Chart */}
              <div style={{ ...contentCard, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ ...sectionTitle, fontSize: 15 }}>
                      {chartSeries === 'clients' ? 'Новые клиенты' : chartSeries === 'qr_created' ? 'Созданные QR' : 'Активации QR'}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>Последние 30 дней</p>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', fontFamily: "'Syne', sans-serif" }}>
                    +{chartPoints.reduce((a, b) => a + b.count, 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                  {([['clients', 'Клиенты'], ['qr_created', 'QR созданы'], ['qr_activated', 'QR актив.']] as const).map(([key, lbl]) => (
                    <button key={key} onClick={() => setChartSeries(key)} style={{
                      padding: '5px 12px', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 600,
                      border: '1px solid', cursor: 'pointer', transition: 'all 150ms ease',
                      background: chartSeries === key ? 'var(--text)' : 'var(--surface)',
                      color: chartSeries === key ? '#ffffff' : 'var(--text-2)',
                      borderColor: chartSeries === key ? 'var(--text)' : 'var(--border)',
                    }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                <BarChart data={chartPoints} loading={chartLoading} />
                {chartPoints.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-4)' }}>
                    <span>{chartPoints[0]?.date?.slice(5)}</span>
                    <span>{chartPoints[chartPoints.length - 1]?.date?.slice(5)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {tab === 'users' && (
            <div className="space-y-4">
              <h2 style={sectionTitle}>Клиенты ({usersTotal})</h2>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-4)', pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text" value={searchUser} onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Поиск по имени или телефону..."
                  className="input-base" style={{ paddingLeft: 40 }}
                />
              </div>
              <div style={contentCard}>
                {filteredUsers.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    {searchUser.trim() ? 'Ничего не найдено' : 'Пользователей пока нет'}
                  </div>
                ) : (
                  <div>
                    {filteredUsers.map((u, i) => (
                      <div
                        key={u.display_id}
                        onClick={() => setSelectedUserId(u.display_id)}
                        style={{
                          padding: 16, display: 'flex', alignItems: 'center', gap: 12,
                          cursor: 'pointer', transition: 'background 150ms ease',
                          borderBottom: i < filteredUsers.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = ''}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--text)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#ffffff', fontSize: 13, fontWeight: 700, flexShrink: 0,
                        }}>
                          {u.first_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', margin: 0 }} className="truncate">{u.first_name} {u.last_name}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{formatPhoneDisplay(u.phone)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="info">{u.vehicle_count ?? 0} авто</Badge>
                          <Button size="sm" variant="danger" loading={blockingUser === u.display_id} onClick={(e) => { e.stopPropagation(); void handleBlockUser(u.display_id) }}>
                            Блок
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Messages ── */}
          {tab === 'messages' && (
            <div className="space-y-4">
              <h2 style={sectionTitle}>Сообщения ({messages.length})</h2>
              <div style={contentCard}>
                {messages.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Сообщений пока нет</div>
                ) : (
                  <div>
                    {messages.map((m, i) => (
                      <div key={m.id} style={{ padding: 16, borderBottom: i < messages.length - 1 ? '1px solid var(--border)' : 'none' }} className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontSize: 11, background: 'var(--surface-3)', color: 'var(--text-2)', padding: '2px 6px', borderRadius: 'var(--r-sm)', fontFamily: 'monospace' }}>
                              {m.qr_code_id?.slice(0, 12)}
                            </span>
                            {m.sender_phone && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatPhoneDisplay(m.sender_phone)}</span>}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-4)', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatDate(m.created_at)}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text)', margin: 0 }}>{m.content}</p>
                        <Badge variant={m.is_delivered ? 'success' : 'gray'}>{m.is_delivered ? 'Доставлено' : 'Не доставлено'}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── QR Codes ── */}
          {tab === 'qrcodes' && (
            <div className="space-y-4">
              <h2 style={sectionTitle}>QR коды</h2>

              <div style={{ ...contentCard, padding: 20 }}>
                <h3 style={{ ...sectionTitle, fontSize: 14, marginBottom: 12 }}>Генерация QR кодов</h3>
                <div className="flex gap-3 items-end">
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Количество</label>
                    <input type="number" min={1} max={1000} value={qrCount} onChange={(e) => setQrCount(e.target.value)} className="input-base" style={{ width: 112, padding: '8px 12px' }} />
                  </div>
                  <Button onClick={() => void handleGenerateQR()} loading={generating}>Сгенерировать</Button>
                </div>
                {generatedCodes.length > 0 && (
                  <div style={{ marginTop: 16, maxHeight: 192, overflowY: 'auto' }} className="space-y-2">
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Только что сгенерированные</p>
                    {generatedCodes.map((qr) => (
                      <div key={qr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text)' }}>{qr.code}</span>
                        <Button size="sm" onClick={() => setQrModal(qr.code)}>QR</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {(['', 'unregistered', 'active', 'blocked'] as const).map((s) => {
                  const count = s === '' ? (dashboard?.total_qr_codes ?? qrtotal)
                    : s === 'active' ? (dashboard?.active_qr ?? '')
                    : s === 'unregistered' ? (dashboard?.unregistered_qr ?? '')
                    : (dashboard?.blocked_qr ?? '')
                  return (
                    <button key={s} onClick={() => void handleQrFilterChange(s)} disabled={qrLoading} style={{
                      padding: '6px 14px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600,
                      border: '1px solid', cursor: qrLoading ? 'not-allowed' : 'pointer', transition: 'all 150ms ease',
                      opacity: qrLoading && qrFilter !== s ? 0.5 : 1,
                      background: qrFilter === s ? 'var(--text)' : 'var(--surface)',
                      color: qrFilter === s ? '#ffffff' : 'var(--text-2)',
                      borderColor: qrFilter === s ? 'var(--text)' : 'var(--border)',
                    }}>
                      {s === '' ? 'Все' : s === 'unregistered' ? 'Незарег.' : s === 'active' ? 'Активные' : 'Заблок.'}
                      {count !== '' ? ` (${count})` : ''}
                    </button>
                  )
                })}
                {qrLoading && (
                  <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%', flexShrink: 0 }} />
                )}
              </div>

              <div style={{ ...contentCard, position: 'relative' }}>
                {qrLoading && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 2,
                    background: 'rgba(255,255,255,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--r-lg)',
                  }}>
                    <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%' }} />
                  </div>
                )}
                {qrcodes.length === 0 && !qrLoading ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>QR кодов не найдено</div>
                ) : (
                  <div>
                    {qrcodes.map((qr, i) => (
                      <div key={qr.id} style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: i < qrcodes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div>
                          <p style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text)', margin: 0 }}>{qr.code}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{qr.registered_at ? `Зарег. ${formatDate(qr.registered_at)}` : `Создан ${formatDate(qr.created_at)}`}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={qr.status === 'active' ? 'success' : qr.status === 'blocked' ? 'error' : 'warning'}>
                            {qr.status === 'active' ? 'Активный' : qr.status === 'blocked' ? 'Заблок.' : 'Не зарег.'}
                          </Badge>
                          <Button size="sm" variant="secondary" onClick={() => setQrModal(qr.code)}>QR</Button>
                          {qr.status !== 'blocked' && (
                            <Button size="sm" variant="danger" loading={blockingQR === qr.code} onClick={() => void handleBlockQR(qr.code)}>Блок</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Admins ── */}
          {tab === 'admins' && sessionRole === 'super_admin' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <h2 style={sectionTitle}>Администраторы ({adminsTotal})</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>Учётные записи для входа в панель</p>
                </div>
                <Button onClick={() => { setCreateAdminOpen(true); setAdminFormError(''); setNewAdminUser(''); setNewAdminPass(''); setNewAdminRole('admin') }}>
                  + Новый администратор
                </Button>
              </div>
              <div style={contentCard}>
                {admins.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Нет администраторов</div>
                ) : (
                  <div>
                    {admins.map((a, i) => (
                      <div key={a.display_id} style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', borderBottom: i < admins.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--text)', margin: 0 }}>{a.username}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{formatDate(a.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={a.role === 'super_admin' ? 'info' : 'gray'}>{roleLabel(a.role)}</Badge>
                          <Button size="sm" variant="secondary" onClick={() => { setEditAdmin(a); setEditAdminRole(a.role); setEditAdminPass(''); setAdminFormError('') }}>Изменить</Button>
                          <Button size="sm" variant="danger" onClick={() => void handleRemoveAdmin(a)}>Удалить</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Admin Modal */}
      <Modal isOpen={createAdminOpen} onClose={() => { if (!adminSaving) setCreateAdminOpen(false) }} title="Новый администратор">
        <div className="space-y-4">
          {adminFormError && (
            <div style={{ padding: 10, background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--error)' }}>
              {adminFormError}
            </div>
          )}
          <div className="space-y-1.5">
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Логин</label>
            <input className="input-base" value={newAdminUser} onChange={(e) => setNewAdminUser(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Пароль (от 8 символов)</label>
            <input type="password" className="input-base" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Роль</label>
            <select className="input-base" value={newAdminRole} onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}>
              <option value="admin">Админ</option>
              <option value="super_admin">Супер-админ</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button onClick={() => void submitCreateAdmin()} loading={adminSaving} className="flex-1">Создать</Button>
            <Button variant="secondary" onClick={() => setCreateAdminOpen(false)} className="flex-1">Отмена</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal isOpen={!!editAdmin} onClose={() => { if (!adminSaving) setEditAdmin(null) }} title={editAdmin ? `Изменить: ${editAdmin.username}` : ''}>
        <div className="space-y-4">
          {adminFormError && (
            <div style={{ padding: 10, background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--error)' }}>
              {adminFormError}
            </div>
          )}
          <div className="space-y-1.5">
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Новый пароль (оставьте пустым, чтобы не менять)</label>
            <input type="password" className="input-base" value={editAdminPass} onChange={(e) => setEditAdminPass(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Роль</label>
            <select className="input-base" value={editAdminRole} onChange={(e) => setEditAdminRole(e.target.value as AdminRole)}>
              <option value="admin">Админ</option>
              <option value="super_admin">Супер-админ</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button onClick={() => void submitEditAdmin()} loading={adminSaving} className="flex-1">Сохранить</Button>
            <Button variant="secondary" onClick={() => setEditAdmin(null)} className="flex-1">Отмена</Button>
          </div>
        </div>
      </Modal>

      <UserDetailDrawer isOpen={!!selectedUserId} onClose={() => setSelectedUserId(null)} userId={selectedUserId} onUpdated={loadUsers} onToast={showToast} onAuthExpired={() => navigate('/admin/login', { replace: true })} />
      <QRModal isOpen={!!qrModal} onClose={() => setQrModal(null)} qrCode={qrModal || ''} />
    </div>
  )
}
