import { motion } from 'framer-motion'
import type { Message } from '@/types/user'
import { formatDate } from '@/lib/utils/formatters'
import { Card } from '@/components/ui/Card'

interface MessagesListProps {
  messages: Message[]
}

export function MessagesList({ messages }: MessagesListProps) {
  if (messages.length === 0) {
    return (
      <Card className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p className="text-gray-600">Пока нет сообщений</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:bg-white/60 transition-colors">
            <div className="flex justify-between items-start gap-3">
              <p className="text-gray-700 flex-1">{message.message}</p>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatDate(message.created_at)}
              </span>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
