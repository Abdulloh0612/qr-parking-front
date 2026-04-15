import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { APP_CONFIG, SUCCESS_MESSAGES } from '@/lib/constants'
import { useThrottle } from '@/hooks/useThrottle'

interface MessageFormProps {
  onSendMessage: (message: string) => Promise<void>
}

export function MessageForm({ onSendMessage }: MessageFormProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [canSend, setCanSend] = useState(true)

  const handleSubmit = useThrottle(async () => {
    if (!message.trim() || !canSend) return

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await onSendMessage(message.trim())
      setSuccess(true)
      setMessage('')
      setCanSend(false)

      setTimeout(() => {
        setCanSend(true)
        setSuccess(false)
      }, APP_CONFIG.messageThrottleMs)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки')
    } finally {
      setLoading(false)
    }
  }, APP_CONFIG.messageThrottleMs)

  return (
    <Card>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Отправить сообщение
      </h3>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ваша машина неудобно припаркована..."
        maxLength={APP_CONFIG.maxMessageLength}
        rows={4}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm
                 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                 transition-all duration-200 placeholder:text-gray-400 resize-none"
      />

      <div className="flex items-center justify-between mt-2 mb-4">
        <span className="text-sm text-gray-500">
          {message.length}/{APP_CONFIG.maxMessageLength}
        </span>
        {!canSend && (
          <span className="text-sm text-gray-500">
            Следующее сообщение через 1 мин
          </span>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-700">{SUCCESS_MESSAGES.messageSent}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!message.trim() || !canSend}
        loading={loading}
        className="w-full"
      >
        Отправить в Telegram
      </Button>
    </Card>
  )
}
