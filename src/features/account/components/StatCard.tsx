import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  color?: string
}

export function StatCard({ icon, label, value, color = 'primary' }: StatCardProps) {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass rounded-2xl p-4 flex items-center gap-4"
    >
      <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </motion.div>
  )
}
