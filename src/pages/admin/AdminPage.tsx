import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatPhoneDisplay } from '@/lib/utils/formatters'
import {
  adminGetDashboard,
  adminGetUsers,
  adminGetUserDetail,
  adminUpdateUser,
  adminBlockUser,
  adminGetQRCodes,
  adminGenerateQR,
  adminBlockQR,
  adminGetMessages,
} from '@/lib/api/endpoints'
import type {
  DashboardStats,
  AdminClient,
  AdminMessage,
  AdminQRCode,
  AdminUserDetail,
} from '@/types/api'

// ─── Auth guard ───────────────────────────────────────────────────────────────

function useAdminAuth() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/admin/login', { replace: true })
    }
  }, [navigate])
}

// ─── QR download helper ───────────────────────────────────────────────────────

function downloadSvgAsImage(svgEl: SVGElement, filename: string) {
  const svgData = new XMLSerializer().serializeToString(svgEl)
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 400
  const ctx = canvas.getContext('2d')
  const img = new Image()
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  img.onload = () => {
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 400, 400)
      ctx.drawImage(img, 0, 0, 400, 400)
    }
    URL.revokeObjectURL(url)
    const a = document.createElement('a')
    a.download = filename
    a.href = canvas.toDataURL('image/png')
    a.click()
  }
  img.src = url
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return <div className="h-32 flex items-center justify-center text-gray-400 text-sm">Нет данных</div>
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-1 h-32 w-full">
      {data.map((d) => {
        const pct = Math.max((d.count / max) * 100, 4)
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 group-hover:bg-blue-400"
              style={{ height: `${pct}%` }}
            />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {d.count} · {d.date.slice(5)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = 'blue', icon }: {
  label: string
  value: number | string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  icon: string
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

// ─── QR Preview Modal ─────────────────────────────────────────────────────────

function QRModal({ isOpen, onClose, qrCode }: {
  isOpen: boolean
  onClose: () => void
  qrCode: string
}) {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrUrl = `https://qr-parking.abdullokh.com/account?qr-code=${qrCode}`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR код">
      <div className="text-center space-y-4">
        <div ref={qrRef} className="inline-block p-4 bg-white rounded-2xl shadow-inner border border-gray-100">
          <QRCodeSVG value={qrUrl} size={220} level="H" />
        </div>
        <p className="text-xs text-gray-400 break-all font-mono">{qrUrl}</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigator.clipboard.writeText(qrUrl)}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Копировать ссылку
          </button>
          <Button
            onClick={() => {
              const svg = qrRef.current?.querySelector('svg')
              if (svg) downloadSvgAsImage(svg, `qr-${qrCode}.png`)
            }}
            className="flex-1"
          >
            Скачать PNG
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── User Detail Modal ────────────────────────────────────────────────────────

function UserDetailModal({ isOpen, onClose, userId, onUpdated }: {
  isOpen: boolean
  onClose: () => void
  userId: string | null
  onUpdated: () => void
}) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({ first_name: '', last_name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'messages' | 'qrcodes'>('info')
  const [qrPreview, setQrPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !userId) return
    setLoading(true)
    setDetail(null)
    setEditing(false)
    setActiveTab('info')
    adminGetUserDetail(userId).then((res) => {
      setLoading(false)
      if (res.success && res.data) {
        setDetail(res.data)
        setEditData({
          first_name: res.data.first_name,
          last_name: res.data.last_name,
          phone: res.data.phone,
        })
      }
    })
  }, [isOpen, userId])

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    const res = await adminUpdateUser(userId, editData)
    setSaving(false)
    if (res.success) {
      setEditing(false)
      onUpdated()
      if (detail) setDetail({ ...detail, ...editData })
    }
  }

  const tabs = [
    { key: 'info', label: 'Профиль' },
    { key: 'messages', label: `Сообщения (${detail?.messages.length ?? 0})` },
    { key: 'qrcodes', label: `QR коды (${detail?.qr_codes.length ?? 0})` },
  ] as const

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="">
        {loading && (
          <div className="py-12 flex items-center justify-center text-gray-400">Загрузка...</div>
        )}
        {!loading && detail && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {detail.first_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={editData.first_name}
                        onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Имя"
                      />
                      <input
                        value={editData.last_name}
                        onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Фамилия"
                      />
                    </div>
                    <input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Телефон"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSave} loading={saving} className="flex-1 text-xs py-1.5">
                        Сохранить
                      </Button>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex-1 text-xs py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-gray-900 truncate">
                      {detail.first_name} {detail.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{formatPhoneDisplay(detail.phone)}</p>
                    <p className="text-xs text-gray-400">С {formatDate(detail.created_at)}</p>
                  </div>
                )}
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  ✏️ Изменить
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                    activeTab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab: Info */}
            {activeTab === 'info' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Машин</p>
                    <p className="font-semibold text-gray-900">{detail.vehicle_count}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Сообщений</p>
                    <p className="font-semibold text-gray-900">{detail.messages.length}</p>
                  </div>
                </div>
                {detail.vehicles.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Машины</p>
                    <div className="space-y-2">
                      {detail.vehicles.map((v) => (
                        <div key={v.display_id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{v.plate_number}</p>
                            <p className="text-xs text-gray-500">{v.car_model}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${v.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {v.is_public ? 'Публичный' : 'Скрытый'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Messages */}
            {activeTab === 'messages' && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {detail.messages.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-6">Сообщений нет</p>
                ) : (
                  detail.messages.map((m) => (
                    <div key={m.id} className="bg-gray-50 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-400">{m.sender_name || m.sender_phone || 'Аноним'}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(m.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-800">{m.content}</p>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${m.is_delivered ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        {m.is_delivered ? 'Доставлено' : 'Не доставлено'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: QR codes */}
            {activeTab === 'qrcodes' && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {detail.qr_codes.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-6">QR кодов нет</p>
                ) : (
                  detail.qr_codes.map((q) => (
                    <div key={q.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-mono text-gray-800">{q.code}</p>
                        <p className="text-xs text-gray-400">{formatDate(q.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          q.status === 'active' ? 'bg-green-100 text-green-700' :
                          q.status === 'blocked' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {q.status === 'active' ? 'Активный' : q.status === 'blocked' ? 'Заблокирован' : 'Не зарегистрирован'}
                        </span>
                        <button
                          onClick={() => setQrPreview(q.code)}
                          className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          QR
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
      <QRModal
        isOpen={!!qrPreview}
        onClose={() => setQrPreview(null)}
        qrCode={qrPreview || ''}
      />
    </>
  )
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────

type AdminTab = 'dashboard' | 'users' | 'messages' | 'qrcodes'

export function AdminPage() {
  useAdminAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<AdminClient[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [qrcodes, setQrcodes] = useState<AdminQRCode[]>([])
  const [qrFilter, setQrFilter] = useState<'' | 'unregistered' | 'active' | 'blocked'>('')
  const [qrtotal, setQrTotal] = useState(0)

  const [loading, setLoading] = useState(true)

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [qrModal, setQrModal] = useState<string | null>(null)

  const [generating, setGenerating] = useState(false)
  const [qrCount, setQrCount] = useState('10')
  const [generatedCodes, setGeneratedCodes] = useState<AdminQRCode[]>([])
  const [searchUser, setSearchUser] = useState('')


  const loadDashboard = useCallback(async () => {
    const res = await adminGetDashboard(30)
    if (res.success && res.data) setDashboard(res.data)
  }, [])

  const loadUsers = useCallback(async () => {
    const res = await adminGetUsers(1, 100)
    if (res.success && res.data) {
      setUsers(res.data.data || [])
      setUsersTotal(res.data.total || 0)
    }
  }, [])

  const loadMessages = useCallback(async () => {
    const res = await adminGetMessages(1, 100)
    if (res.success && res.data) {
      setMessages(res.data.data || [])
    }
  }, [])

  const loadQRCodes = useCallback(async (status = qrFilter) => {
    const res = await adminGetQRCodes(status, 1, 100)
    if (res.success && res.data) {
      setQrcodes(res.data.data || [])
      setQrTotal(res.data.total || 0)
    }
  }, [qrFilter])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadDashboard(), loadUsers(), loadMessages(), loadQRCodes(qrFilter)]).finally(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    void loadQRCodes(qrFilter)
  }, [qrFilter])

  async function handleGenerateQR() {
    const count = Math.max(1, Math.min(1000, parseInt(qrCount) || 10))
    setGenerating(true)
    const res = await adminGenerateQR(count)
    setGenerating(false)
    if (res.success && res.data) {
      const newCodes = res.data.data || []
      setGeneratedCodes(newCodes)
      void loadQRCodes(qrFilter)
      void loadDashboard()
    }
  }

  async function handleBlockUser(userId: string) {
    await adminBlockUser(userId)
    void loadUsers()
    void loadDashboard()
  }

  async function handleBlockQR(qrCode: string) {
    await adminBlockQR(qrCode)
    void loadQRCodes(qrFilter)
    void loadDashboard()
  }

  function logout() {
    localStorage.removeItem('admin_token')
    navigate('/admin/login', { replace: true })
  }

  const filteredUsers = useMemo(() => {
    if (!searchUser.trim()) return users
    const q = searchUser.toLowerCase()
    return users.filter(
      (u) =>
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        u.phone.includes(q)
    )
  }, [users, searchUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'dashboard', label: '📊 Дашборд' },
    { key: 'users', label: `👥 Клиенты (${usersTotal})` },
    { key: 'messages', label: `💬 Сообщения (${messages.length})` },
    { key: 'qrcodes', label: `🔳 QR коды` },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">Q</span>
            </div>
            <h1 className="font-bold text-gray-900 text-sm">QR Parking Admin</h1>
          </div>
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 hover:bg-red-50 rounded-lg"
          >
            Выйти
          </button>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Dashboard Tab ── */}
        {tab === 'dashboard' && dashboard && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Клиентов" value={dashboard.total_users} icon="👥" color="blue" />
              <StatCard label="QR кодов" value={dashboard.total_qr_codes} icon="🔳" color="purple" />
              <StatCard label="Сообщений" value={dashboard.total_messages} icon="💬" color="green" />
              <StatCard label="Сканов сегодня" value={dashboard.scans_today} icon="📡" color="yellow" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Активных QR" value={dashboard.active_qr} icon="✅" color="green" />
              <StatCard label="Незарегистр." value={dashboard.unregistered_qr} icon="⏳" color="yellow" />
              <StatCard label="Заблокировано" value={dashboard.blocked_qr} icon="🚫" color="red" />
            </div>

            {/* Growth chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Рост клиентов</h3>
                  <p className="text-xs text-gray-400">За последние 30 дней</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">+{dashboard.user_growth.reduce((a, b) => a + b.count, 0)}</span>
              </div>
              <BarChart data={dashboard.user_growth} />
              {dashboard.user_growth.length > 0 && (
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>{dashboard.user_growth[0]?.date?.slice(5)}</span>
                  <span>{dashboard.user_growth[dashboard.user_growth.length - 1]?.date?.slice(5)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Users Tab ── */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Поиск по имени или телефону..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">Пользователей не найдено</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.display_id}
                      className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedUserId(u.display_id)}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {u.first_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {u.first_name} {u.last_name}
                        </p>
                        <p className="text-xs text-gray-400">{formatPhoneDisplay(u.phone)}</p>
                        <p className="text-xs text-gray-300">{formatDate(u.created_at)}</p>
                      </div>
                      {/* Vehicle count badge */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          🚗 {u.vehicle_count ?? '—'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBlockUser(u.display_id)
                          }}
                          className="text-xs px-2.5 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Блок
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Messages Tab ── */}
        {tab === 'messages' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Сообщений нет</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {messages.map((m) => (
                  <div key={m.id} className="p-4 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                          {m.qr_code_id?.slice(0, 12)}
                        </span>
                        {m.sender_phone && (
                          <span className="text-xs text-gray-400">{formatPhoneDisplay(m.sender_phone)}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {formatDate(m.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{m.content}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.is_delivered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.is_delivered ? '✓ Доставлено' : 'Не доставлено'}
                      </span>
                      {m.sender_name && (
                        <span className="text-xs text-gray-400">{m.sender_name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── QR Codes Tab ── */}
        {tab === 'qrcodes' && (
          <div className="space-y-4">
            {/* Generate */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Генерация QR кодов</h3>
              <div className="flex gap-3 items-end">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Количество</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={qrCount}
                    onChange={(e) => setQrCount(e.target.value)}
                    className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button onClick={handleGenerateQR} loading={generating}>
                  Сгенерировать
                </Button>
              </div>
              {generatedCodes.length > 0 && (
                <div className="mt-4 space-y-2 max-h-56 overflow-y-auto">
                  <p className="text-xs text-gray-400 font-medium">Только что сгенерированные:</p>
                  {generatedCodes.map((qr) => (
                    <div key={qr.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <span className="text-sm font-mono text-gray-800">{qr.code}</span>
                      <button
                        onClick={() => setQrModal(qr.code)}
                        className="text-xs px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        QR
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {(['', 'unregistered', 'active', 'blocked'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setQrFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    qrFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s === '' ? `Все (${qrtotal})` :
                   s === 'unregistered' ? 'Незарегистрированные' :
                   s === 'active' ? 'Активные' : 'Заблокированные'}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {qrcodes.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">QR кодов нет</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {qrcodes.map((qr) => (
                    <div key={qr.id} className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-mono text-gray-900">{qr.code}</p>
                        <p className="text-xs text-gray-400">
                          {qr.registered_at ? `Зарег. ${formatDate(qr.registered_at)}` : `Создан ${formatDate(qr.created_at)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          qr.status === 'active' ? 'bg-green-100 text-green-700' :
                          qr.status === 'blocked' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {qr.status === 'active' ? 'Активный' :
                           qr.status === 'blocked' ? 'Заблокирован' : 'Не зарег.'}
                        </span>
                        <button
                          onClick={() => setQrModal(qr.code)}
                          className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          QR
                        </button>
                        {qr.status !== 'blocked' && (
                          <button
                            onClick={() => handleBlockQR(qr.code)}
                            className="text-xs px-2.5 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Блок
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User detail modal */}
      <UserDetailModal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
        onUpdated={loadUsers}
      />

      {/* QR preview modal */}
      <QRModal
        isOpen={!!qrModal}
        onClose={() => setQrModal(null)}
        qrCode={qrModal || ''}
      />
    </div>
  )
}
