function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, '')
  if (cleaned.startsWith('+'))   return cleaned
  if (cleaned.startsWith('996')) return '+' + cleaned
  if (cleaned.startsWith('0'))   return '+996' + cleaned.substring(1)
  return '+996' + cleaned
}

export function validatePhone(phone: string): boolean {
  return /^\+996[0-9]{9}$/.test(normalizePhone(phone))
}

export function validateVehicleNumber(number: string): boolean {
  return /^[A-Z0-9]{6,10}$/i.test(number)
}

export function validateInstagram(handle: string): boolean {
  if (!handle) return true
  return /^[a-zA-Z0-9._]{1,30}$/.test(handle.replace(/^@/, ''))
}

export function validateTelegram(value: string): boolean {
  if (!value.trim()) return true
  if (validatePhone(value.trim())) return true
  const username = value.trim().startsWith('@') ? value.trim().slice(1) : value.trim()
  return /^[a-zA-Z0-9_]{5,32}$/.test(username)
}
