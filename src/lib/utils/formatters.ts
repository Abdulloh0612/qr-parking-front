export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин. назад`
  if (diffHours < 24) return `${diffHours} ч. назад`
  if (diffDays < 7) return `${diffDays} дн. назад`

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function formatPhoneDisplay(phone: string): string {
  // +996 XXX XXX XXX
  if (phone.startsWith('+996') && phone.length === 13) {
    return `+996 ${phone.slice(4, 7)} ${phone.slice(7, 10)} ${phone.slice(10)}`
  }
  return phone
}
