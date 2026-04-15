import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatPhoneDisplay } from '@/lib/utils/formatters'
import { getAccount, getAccountMessages } from '@/lib/api/endpoints'
import type { Message, User } from '@/types/user'

function useAdminAuth() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!sessionStorage.getItem('admin_auth')) {
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

function QRModal({ isOpen, onClose, qrId, baseUrl }: {
  isOpen: boolean
  onClose: () => void
  qrId: string
  baseUrl: string
}) {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrUrl = `${baseUrl}/qr/${qrId}`

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
              if (svg) downloadSvgAsImage(svg, `qr-${qrId}.png`)
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

export function AdminPage() {
  useAdminAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrOpen, setQrOpen] = useState(false)

  const baseUrl = useMemo(() => window.location.origin, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [u, m] = await Promise.all([getAccount(), getAccountMessages()])
        if (!u.success || !u.data) {
          setError(u.error?.message || 'Не удалось загрузить пользователя')
          return
        }
        setUser(u.data)
        setMessages(m.success && m.data ? m.data : [])
      } catch {
        setError('Не удалось загрузить данные')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const logout = () => {
    sessionStorage.removeItem('admin_auth')
    navigate('/admin/login', { replace: true })
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Загрузка...</div>
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-gray-700">{error || 'Ошибка'}</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={logout}>Выйти</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-gray-900">Admin</h1>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-gray-500">{formatPhoneDisplay(user.phone)}</p>
              <p className="text-xs text-gray-400 mt-1">{user.vehicle_brand} • {user.vehicle_number}</p>
              <p className="text-xs text-gray-400 mt-1">QR: {user.qr_id}</p>
            </div>
            <Button onClick={() => setQrOpen(true)}>QR</Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">Сообщения</p>
            <span className="text-sm text-gray-500">{messages.length}</span>
          </div>
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">Пока нет сообщений</p>
          ) : (
            <div className="space-y-2">
              {messages.map(m => (
                <div key={m.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-between gap-3">
                    <p className="text-sm text-gray-800 flex-1">{m.message}</p>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(m.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <QRModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        qrId={user.qr_id}
        baseUrl={baseUrl}
      />
    </div>
  )
}

