import { motion } from 'framer-motion'
import type { Review } from '@/types/user'
import { formatDate } from '@/lib/utils/formatters'
import { Card } from '@/components/ui/Card'
import { Rating } from '@/components/ui/Rating'

interface ReviewsListProps {
  reviews: Review[]
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <Card className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <p className="text-gray-600">Пока нет отзывов</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {reviews.map((review, index) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:bg-white/60 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <Rating value={review.rating} readonly size="sm" />
              <span className="text-xs text-gray-500">
                {formatDate(review.created_at)}
              </span>
            </div>
            {review.comment && (
              <p className="text-gray-700 mt-2">{review.comment}</p>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
