import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatPhoneDisplay } from '@/lib/utils/formatters'
import {
  adminGetUsers,
  adminGenerateQR,
  adminBlockQR,
  adminGetMessages,
  adminBlockUser,
} from '@/lib/api/endpoints'
import type { AdminClient, AdminMessage, AdminQRCode } from '@/types/api'

function useAdminAuth() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/admin/login', { replace: true })
    }
  }, [navigate])
}

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

function QRModal({ isOpen, onClose, qrCode, baseUrl }: {
  isOpen: boolean
  onClose: () => void
  qrCode: string
  baseUrl: string
}) {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrUrl = `${baseUrl}/account?qr-code=${qrCode}`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR код">
      <div className="text-center space-y-4">
        <div ref={qrRef} className="inline-block p-4 bg-white rounded-2xl shadow-inner">
          <QRCodeSVG value={qrUrl} size={220} level="H" />
        </div>
        <p className="text-sm text-gray-500 break-all">{qrUrl}</p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigator.clipboard.writeText(qrUrl)}
            className="flex-1"
          >
            Копировать
          </Button>
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

type AdminTab = 'users' | 'messages' | 'qrcodes'

export function AdminPage() {
  useAdminAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<AdminClient[]>([])
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrModal, setQrModal] = useState<{ open: boolean; code: string }>({ open: false, code: '' })
  const [generating, setGenerating] = useState(false)
  const [qrCount, setQrCount] = useState('10')
  const [generatedCodes, setGeneratedCodes] = useState<AdminQRCode[]>([])

  const baseUrl = useMemo(() => window.location.origin, [])

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    const [usersRes, msgsRes] = await Promise.all([
      adminGetUsers(),
      adminGetMessages(),
    ])
    setLoading(false)
    if (usersRes.success && usersRes.data) {
      // backend returns { data: [...], total, page, limit }
      const raw = usersRes.data as unknown as { data?: AdminClient[]; users?: AdminClient[] }
      setUsers(raw.data || raw.users || [])
    } else {
      setError(usersRes.error?.message || 'Ошибка загрузки пользователей')
    }
    if (msgsRes.success && msgsRes.data) {
      const raw = msgsRes.data as unknown as { data?: AdminMessage[] } | AdminMessage[]
      setMessages(Array.isArray(raw) ? raw : raw.data || [])
    }
  }

  async function handleGenerateQR() {
    const count = Math.max(1, Math.min(1000, parseInt(qrCount) || 10))
    setGenerating(true)
    const res = await adminGenerateQR(count)
    setGenerating(false)
    if (res.success && res.data) {
      setGeneratedCodes(res.data.data || [])
    }
  }

  async function handleBlockUser(userId: string) {
    await adminBlockUser(userId)
    void load()
  }

  async function handleBlockQR(qrId: string) {
    await adminBlockQR(qrId)
    void load()
  }

  function logout() {
    localStorage.removeItem('admin_token')
    navigate('/admin/login', { replace: true })
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Загрузка...</div>
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl p-6 text-center shadow">
          <p className="text-gray-700 mb-4">{error}</p>
          <Button variant="secondary" onClick={logout}>Выйти</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-gray-900">QR Parking Admin</h1>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Выйти
          </button>
        </div>
        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1 pb-2">
          {(['users', 'messages', 'qrcodes'] as AdminTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t === 'users' ? `Пользователи (${users.length})` : t === 'messages' ? `Сообщения (${messages.length})` : 'QR коды'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Users tab */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {users.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">Пользователей нет</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {users.map((u) => (
                  <div key={u.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {u.first_name} {u.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{formatPhoneDisplay(u.phone)}</p>
                      <p className="text-xs text-gray-300 mt-0.5">{formatDate(u.created_at)}</p>
                    </div>
                    <button
                      onClick={() => handleBlockUser(String(u.id))}
                      className="text-xs px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      Блок
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages tab */}
        {tab === 'messages' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {messages.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">Сообщений нет</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {messages.map((m) => (
                  <div key={m.id} className="p-4">
                    <div className="flex justify-between gap-3 mb-1">
                      <p className="text-xs text-gray-400">QR: {m.qr_code_id}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(m.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-800">{m.content}</p>
                    {m.sender_phone && (
                      <p className="text-xs text-gray-400 mt-1">{formatPhoneDisplay(m.sender_phone)}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.is_delivered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.is_delivered ? 'Доставлено' : 'Не доставлено'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QR codes tab */}
        {tab === 'qrcodes' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="font-semibold mb-3">Генерация QR кодов</h3>
              <div className="flex gap-3 mb-3">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={qrCount}
                  onChange={(e) => setQrCount(e.target.value)}
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                />
                <Button onClick={handleGenerateQR} loading={generating}>
                  Сгенерировать
                </Button>
              </div>
              {generatedCodes.length > 0 && (
                <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                  {generatedCodes.map((qr) => (
                    <div key={qr.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <span className="text-sm font-mono text-gray-700">{qr.code}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${qr.status === 'unregistered' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {qr.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setQrModal({ open: true, code: qr.code })}
                          className="text-xs px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          QR
                        </button>
                        <button
                          onClick={() => handleBlockQR(qr.code)}
                          className="text-xs px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
      </div>

      <QRModal
        isOpen={qrModal.open}
        onClose={() => setQrModal({ open: false, code: '' })}
        qrCode={qrModal.code}
        baseUrl={baseUrl}
      />
    </div>
  )
}
