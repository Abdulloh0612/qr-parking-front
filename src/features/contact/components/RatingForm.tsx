import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Rating } from '@/components/ui/Rating'
import { APP_CONFIG, SUCCESS_MESSAGES } from '@/lib/constants'

interface RatingFormProps {
  onSubmitRating: (rating: number, comment?: string) => Promise<void>
}

export function RatingForm({ onSubmitRating }: RatingFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (rating === 0) return

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await onSubmitRating(rating, comment.trim() || undefined)
      setSuccess(true)
      setRating(0)
      setComment('')

      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        Оставить отзыв
      </h3>

      <div className="flex justify-center mb-4">
        <Rating value={rating} onChange={setRating} size="lg" />
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Комментарий (необязательно)"
        maxLength={APP_CONFIG.maxCommentLength}
        rows={3}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm
                 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                 transition-all duration-200 placeholder:text-gray-400 resize-none"
      />

      <div className="flex items-center justify-end mt-2 mb-4">
        <span className="text-sm text-gray-500">
          {comment.length}/{APP_CONFIG.maxCommentLength}
        </span>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-700">{SUCCESS_MESSAGES.reviewSent}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={rating === 0}
        loading={loading}
        className="w-full"
      >
        Отправить отзыв
      </Button>
    </Card>
  )
}
